"""endpoints administrativos (autenticados via cookie httponly)."""

import base64
import hmac
import logging
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import ValidationError

from core.config import settings
from core.logging_config import audit_logger
from core.proxy import get_client_ip
from core.security import (
    PWD_CONTEXT,
    SESSION_COOKIE_NAME,
    create_access_token,
    sanitize_bcrypt_hash,
    verify_token,
)
from schemas.portfolio import (
    AllowedConfigFile,
    ConfigUpdateRequest,
    DeleteFileRequest,
    InterpreterRequest,
    LoginRequest,
    UploadFileRequest,
    validate_payload,
)
from services.config_repo import read_config, write_config
from services.jsonl_store import (
    ANALYTICS_PATH,
    CHAT_LOG_PATH,
    RETENTION_DAYS,
    average_response_ms,
    count_records,
    count_where,
    purge_older_than,
    read_recent,
)
from services.runtime_state import get_active_interpreter, set_active_interpreter

router = APIRouter(prefix="/api/admin")

# escopo do cookie limitado as rotas administrativas; reduz superficie
# em caso de comprometimento de outras areas da api
_COOKIE_PATH = "/api/admin"


@router.get("/turnstile-key")
async def get_turnstile_site_key():
    """Retorna a chave publica (site_key) do Turnstile configurada no .env para uso pelo frontend."""
    return {"site_key": settings.turnstile_site_key or ""}


def verify_turnstile_token(token: str, remote_ip: str | None = None) -> bool:
    """
    Valida o token do Cloudflare Turnstile junto ao endpoint oficial da Cloudflare.
    Se TURNSTILE_SECRET_KEY nao estiver configurada no ambiente (.env),
    considera modo de desenvolvimento sem captcha e permite prosseguir.
    """
    if not settings.turnstile_secret_key:
        return True

    if not token or not token.strip():
        return False

    try:
        import requests

        payload = {
            "secret": settings.turnstile_secret_key,
            "response": token.strip(),
        }
        if remote_ip and remote_ip != "unknown":
            payload["remoteip"] = remote_ip

        res = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data=payload,
            timeout=8,
        )
        if not res.ok:
            logging.error(f"Turnstile siteverify retornou HTTP {res.status_code}")
            return False

        data = res.json()
        success = bool(data.get("success", False))
        if not success:
            logging.warning(
                "Turnstile siteverify rejeitado pela Cloudflare",
                extra={"event": "turnstile_siteverify_rejected", "error_codes": data.get("error-codes")},
            )
        return success
    except Exception as exc:
        logging.error(f"Falha na comunicacao com Cloudflare Turnstile: {exc}")
        return False


# LOGIN ADMINISTRATIVO
@router.post("/login")
async def admin_login(req: LoginRequest, request: Request, response: Response):
    client_ip = get_client_ip(request)

    # Validacao de seguranca via Cloudflare Turnstile
    if settings.turnstile_secret_key:
        if not req.turnstile_token:
            audit_logger.warning(
                "tentativa de login rejeitada por falta de turnstile",
                extra={"event": "turnstile_missing", "client_ip": client_ip, "username": req.username},
            )
            raise HTTPException(
                status_code=400,
                detail="Desafio de segurança obrigatório. Conclua o Cloudflare Turnstile.",
            )

        if not verify_turnstile_token(req.turnstile_token, remote_ip=client_ip):
            audit_logger.warning(
                "tentativa de login com turnstile invalido ou expirado",
                extra={"event": "turnstile_invalid", "client_ip": client_ip, "username": req.username},
            )
            raise HTTPException(
                status_code=400,
                detail="Validação do Cloudflare Turnstile falhou ou expirou. Tente novamente.",
            )

    if not settings.admin_user or not settings.admin_password_hash:
        logging.error("ADMIN_USER/ADMIN_PASSWORD_HASH ausentes no ambiente")
        raise HTTPException(status_code=500, detail="servico de autenticacao indisponivel")

    # limpa eventuais aspas residuais ou $$ duplicados pelo docker-compose
    admin_hash = sanitize_bcrypt_hash(settings.admin_password_hash)
    if not admin_hash:
        logging.error("ADMIN_PASSWORD_HASH invalido apos sanitizacao")
        raise HTTPException(status_code=500, detail="servico de autenticacao indisponivel")

    # compara username em tempo constante para mitigar timing attack
    user_ok = hmac.compare_digest(
        req.username.encode("utf-8"), settings.admin_user.encode("utf-8")
    )
    try:
        pass_ok = PWD_CONTEXT.verify(req.password, admin_hash)
    except (ValueError, TypeError) as exc:
        # bcrypt nao aceita o hash mesmo apos sanitizacao; configuracao errada
        logging.error(f"falha na verificacao de senha: {type(exc).__name__}")
        raise HTTPException(status_code=500, detail="servico de autenticacao indisponivel")

    if not (user_ok and pass_ok):
        logging.warning(
            "tentativa de login negada",
            extra={"event": "auth_failed", "username": req.username, "client_ip": client_ip},
        )
        raise HTTPException(status_code=401, detail="credenciais invalidas")

    token = create_access_token(req.username)
    ttl_seconds = settings.jwt_expiration_minutes * 60

    # cookie httponly + secure + samesite=lax: topologia same-origin com
    # tls terminado no nginx do host; lax e suficiente e mais ergonomico
    # que strict (preserva o cookie em navegacoes top-level)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=ttl_seconds,
        httponly=True,
        secure=True,
        samesite="lax",
        path=_COOKIE_PATH,
    )

    audit_logger.info(
        "login bem sucedido",
        extra={"event": "auth_success", "actor": req.username, "client_ip": client_ip},
    )
    return {"status": "sucesso"}


# LOGOUT ADMINISTRATIVO
@router.post("/logout")
async def admin_logout(response: Response):
    """remove o cookie no cliente; nao exige verify_token para limpar sessao expirada."""
    # flags identicas ao set_cookie sao necessarias para que o browser
    # case o cookie e aceite o delete (rfc 6265)
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path=_COOKIE_PATH,
        httponly=True,
        secure=True,
        samesite="lax",
    )
    audit_logger.info("logout administrativo", extra={"event": "auth_logout"})
    return {"status": "sucesso"}


# LEITURA DOS ULTIMOS LOGS DE CHAT
@router.get("/logs")
async def get_chat_logs(admin: str = Depends(verify_token)):
    """retorna os ultimos 100 registros do chat_logs.jsonl."""
    try:
        logs = read_recent(CHAT_LOG_PATH, limit=100)
        return {"logs": logs}
    except Exception as exc:
        logging.error(f"falha ao ler chat_logs.jsonl: {exc}")
        raise HTTPException(status_code=500, detail="erro na leitura dos dados")


# AGREGADO DE KPIS A PARTIR DOS ARQUIVOS JSONL
@router.get("/stats")
async def get_dashboard_stats(admin: str = Depends(verify_token)):
    """consolida totais e media de tempo de resposta lendo os jsonl."""
    try:
        total_chats = count_records(CHAT_LOG_PATH)
        total_views = count_where(ANALYTICS_PATH, key="event_type", value="page_view")
        avg_time = average_response_ms(CHAT_LOG_PATH)
        recent_events = read_recent(ANALYTICS_PATH, limit=10)
    except Exception as exc:
        logging.error(f"falha ao agregar metricas dos arquivos jsonl: {exc}")
        raise HTTPException(status_code=500, detail="erro na leitura dos dados")

    return {
        "total_chats": total_chats,
        "total_views": total_views,
        "avg_response_ms": avg_time,
        "recent_events": recent_events,
        "active_interpreter": get_active_interpreter(),
    }


# CONSULTA DO INTERPRETER ATIVO
@router.get("/interpreter")
async def get_interpreter(admin: str = Depends(verify_token)):
    """Retorna o provedor de IA atualmente ativo em runtime."""
    return {"active": get_active_interpreter()}


# TROCA DE INTERPRETER ATIVO
@router.post("/interpreter")
async def set_interpreter(req: InterpreterRequest, admin: str = Depends(verify_token)):
    # persiste o provedor em runtime_state.json (atomico e thread-safe),
    # eliminando a mutacao global de os.environ
    try:
        active = set_active_interpreter(req.provider)
    except ValueError as exc:
        audit_logger.info(
            "tentativa de troca de interpreter rejeitada",
            extra={
                "event": "config_change_rejected",
                "key": "active_interpreter",
                "value": req.provider,
                "actor": admin,
                "reason": str(exc),
            },
        )
        raise HTTPException(status_code=422, detail="provider invalido")
    except OSError as exc:
        logging.error(f"falha ao persistir provedor ativo: {exc}")
        audit_logger.info(
            "falha ao persistir interpreter",
            extra={
                "event": "config_change_failed",
                "key": "active_interpreter",
                "value": req.provider,
                "actor": admin,
                "error": f"{type(exc).__name__}: {exc}",
            },
        )
        raise HTTPException(status_code=500, detail="falha ao persistir configuracao")

    audit_logger.info(
        "interpreter alterado",
        extra={
            "event": "config_change",
            "key": "active_interpreter",
            "value": active,
            "actor": admin,
        },
    )
    return {"status": "sucesso", "active": active}


# LEITURA DE ARQUIVO DE CONFIGURACAO
@router.get("/config")
async def get_config(filename: AllowedConfigFile, admin: str = Depends(verify_token)):
    try:
        return read_config(filename)
    except HTTPException:
        raise
    except Exception as exc:
        logging.error(f"falha ao ler {filename.value}: {exc}")
        raise HTTPException(status_code=500, detail="falha ao ler configuracao")


# PURGA DE RETENCAO MANUAL
@router.post("/retention/purge")
async def trigger_retention_purge(admin: str = Depends(verify_token)):
    """remove registros expirados de chat_logs.jsonl e analytics.jsonl."""
    try:
        chat_deleted = purge_older_than(CHAT_LOG_PATH, RETENTION_DAYS)
        analytics_deleted = purge_older_than(ANALYTICS_PATH, RETENTION_DAYS)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logging.error(f"falha ao executar purga de retencao: {exc}")
        raise HTTPException(status_code=500, detail="falha ao executar purga")

    audit_logger.info(
        "purga de retencao disparada por admin",
        extra={
            "event": "data_retention_triggered",
            "actor": admin,
            "retention_days": RETENTION_DAYS,
            "chat_logs_deleted": chat_deleted,
            "analytics_deleted": analytics_deleted,
        },
    )
    return {
        "status": "sucesso",
        "actor": admin,
        "retention_days": RETENTION_DAYS,
        "chat_logs_deleted": chat_deleted,
        "analytics_deleted": analytics_deleted,
    }


# ESCRITA DE ARQUIVO DE CONFIGURACAO
@router.post("/config")
async def update_config(req: ConfigUpdateRequest, admin: str = Depends(verify_token)):
    try:
        validated = validate_payload(req.filename, req.content)
    except ValidationError as exc:
        logging.warning(
            "payload rejeitado pela validacao",
            extra={
                "event": "config_validation_failed",
                "file_name": req.filename.value,
                "actor": admin,
                "errors": exc.errors(),
            },
        )
        raise HTTPException(status_code=422, detail=exc.errors())

    try:
        bytes_written = write_config(req.filename, validated, actor=admin)
    except HTTPException:
        raise
    except Exception as exc:
        logging.error(f"falha ao salvar {req.filename.value}: {exc}")
        raise HTTPException(status_code=500, detail="erro ao gravar arquivo")

    return {
        "status": "sucesso",
        "message": f"{req.filename.value} atualizado",
        "bytes_written": bytes_written,
    }


# UPLOAD E GERENCIAMENTO DE ARQUIVOS (CURRÍCULOS E SELOS DE CERTIFICAÇÕES)
UPLOAD_BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "uploads")
)
CATEGORY_DIR_MAP = {
    "resume": "resumes",
    "badge": "badges",
    "image": "images",
}


@router.post("/upload-file")
async def upload_file(req: UploadFileRequest, admin: str = Depends(verify_token)):
    import base64
    import re

    category_folder = CATEGORY_DIR_MAP.get(req.category)
    if not category_folder:
        raise HTTPException(status_code=400, detail="Categoria de upload inválida.")

    target_dir = os.path.join(UPLOAD_BASE_DIR, category_folder)
    os.makedirs(target_dir, exist_ok=True)

    safe_name = os.path.basename(req.filename)
    safe_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", safe_name)
    ext = os.path.splitext(safe_name)[1].lower()

    if req.category == "resume":
        if ext != ".pdf":
            raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos para currículos.")
    elif req.category in ("badge", "image"):
        if ext not in (".svg", ".png", ".webp", ".jpg", ".jpeg"):
            raise HTTPException(status_code=400, detail="Formato não suportado para selos. Use SVG, PNG ou WebP.")

    target_path = os.path.abspath(os.path.join(target_dir, safe_name))
    if os.path.commonpath([UPLOAD_BASE_DIR, target_path]) != UPLOAD_BASE_DIR:
        raise HTTPException(status_code=400, detail="Caminho de arquivo inválido.")

    # Se informado old_url de arquivo anterior em uploads, removemos o antigo para não deixar lixo no disco
    old_deleted = False
    if req.old_url and req.old_url.startswith(f"/api/uploads/{category_folder}/"):
        old_filename = os.path.basename(req.old_url)
        old_safe = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", old_filename)
        old_path = os.path.abspath(os.path.join(target_dir, old_safe))
        if (
            os.path.commonpath([UPLOAD_BASE_DIR, old_path]) == UPLOAD_BASE_DIR
            and os.path.isfile(old_path)
            and old_path != target_path
        ):
            try:
                os.remove(old_path)
                old_deleted = True
            except Exception as exc:
                logging.warning(f"Não foi possível remover arquivo anterior {old_path}: {exc}")

    content = req.content_base64
    if "," in content:
        content = content.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Codificação Base64 inválida.")

    max_size = 15 * 1024 * 1024 if req.category == "resume" else 5 * 1024 * 1024
    if len(raw_bytes) > max_size:
        raise HTTPException(status_code=413, detail="Arquivo excede o tamanho máximo permitido.")

    try:
        # Modo 'wb' trunca e sobrescreve o arquivo no disco se já existir o mesmo nome
        with open(target_path, "wb") as f:
            f.write(raw_bytes)
    except Exception as exc:
        logging.error(f"Falha ao salvar arquivo {target_path}: {exc}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar arquivo no servidor.")

    url_path = f"/api/uploads/{category_folder}/{safe_name}"

    audit_logger.info(
        "arquivo anexado via console admin",
        extra={
            "event": "admin_file_uploaded",
            "actor": admin,
            "target_file": safe_name,
            "category": req.category,
            "size": len(raw_bytes),
            "url": url_path,
            "old_deleted": old_deleted,
        },
    )

    return {
        "status": "sucesso",
        "url": url_path,
        "filename": safe_name,
        "size": len(raw_bytes),
        "replaced_previous": old_deleted or (os.path.isfile(target_path)),
    }


@router.post("/delete-file")
async def delete_file(req: DeleteFileRequest, admin: str = Depends(verify_token)):
    """Remove um arquivo enviado anteriormente pelo painel da pasta uploads."""
    if not req.url or not req.url.startswith("/api/uploads/"):
        return {"status": "ignorado", "message": "Arquivo padrão ou externo não requer exclusão do disco."}

    rel_path = req.url.replace("/api/uploads/", "", 1)
    target_path = os.path.abspath(os.path.join(UPLOAD_BASE_DIR, rel_path))

    if os.path.commonpath([UPLOAD_BASE_DIR, target_path]) != UPLOAD_BASE_DIR:
        raise HTTPException(status_code=400, detail="Caminho de arquivo inválido.")

    if os.path.isfile(target_path):
        try:
            os.remove(target_path)
            audit_logger.info(
                "arquivo removido via admin",
                extra={
                    "event": "admin_file_deleted",
                    "actor": admin,
                    "path": target_path,
                    "url": req.url,
                },
            )
            return {"status": "sucesso", "message": "Arquivo removido do disco com sucesso."}
        except Exception as exc:
            logging.error(f"Erro ao remover {target_path}: {exc}")
            raise HTTPException(status_code=500, detail="Erro interno ao excluir arquivo.")

    return {"status": "inexistente", "message": "Arquivo não encontrado no disco."}



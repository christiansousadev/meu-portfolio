"""endpoints administrativos (autenticados via cookie httponly)."""

import hmac
import logging

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import ValidationError

from core.config import settings
from core.logging_config import audit_logger
from core.security import (
    PWD_CONTEXT,
    SESSION_COOKIE_NAME,
    create_access_token,
    verify_token,
)
from schemas.portfolio import (
    AllowedConfigFile,
    ConfigUpdateRequest,
    InterpreterRequest,
    LoginRequest,
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
from services.runtime_state import set_active_interpreter

router = APIRouter(prefix="/api/admin")

# escopo do cookie limitado as rotas administrativas; reduz superficie
# em caso de comprometimento de outras areas da api
_COOKIE_PATH = "/api/admin"


# LOGIN ADMINISTRATIVO
@router.post("/login")
async def admin_login(req: LoginRequest, response: Response):
    if not settings.admin_user or not settings.admin_password_hash:
        logging.error("ADMIN_USER/ADMIN_PASSWORD_HASH ausentes no ambiente")
        raise HTTPException(status_code=500, detail="servico de autenticacao indisponivel")

    # compara username em tempo constante para mitigar timing attack
    user_ok = hmac.compare_digest(
        req.username.encode("utf-8"), settings.admin_user.encode("utf-8")
    )
    try:
        pass_ok = PWD_CONTEXT.verify(req.password, settings.admin_password_hash)
    except (ValueError, TypeError):
        # hash mal formado e configuracao errada; nao expor ao cliente
        logging.error("ADMIN_PASSWORD_HASH com formato invalido")
        raise HTTPException(status_code=500, detail="servico de autenticacao indisponivel")

    if not (user_ok and pass_ok):
        logging.warning(
            "tentativa de login negada",
            extra={"event": "auth_failed", "username": req.username},
        )
        raise HTTPException(status_code=401, detail="credenciais invalidas")

    token = create_access_token(req.username)
    ttl_seconds = settings.jwt_expiration_minutes * 60

    # cookie http-only: o jwt nunca fica acessivel via javascript,
    # mitigando o vetor de xss-aciona-take-over identificado na auditoria.
    # secure=true somente em producao (https); em dev http o navegador
    # rejeitaria o cookie e quebraria o fluxo local
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=ttl_seconds,
        httponly=True,
        secure=settings.is_production,
        samesite="strict",
        path=_COOKIE_PATH,
    )

    audit_logger.info(
        "login bem sucedido",
        extra={"event": "auth_success", "actor": req.username},
    )
    return {"status": "sucesso"}


# LOGOUT ADMINISTRATIVO
@router.post("/logout")
async def admin_logout(response: Response):
    """
    remove o cookie de sessao no cliente; nao exige verify_token para
    que sessoes ja expiradas tambem possam limpar o estado residual.
    """
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path=_COOKIE_PATH,
        httponly=True,
        secure=settings.is_production,
        samesite="strict",
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
    }


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
                "filename": req.filename.value,
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

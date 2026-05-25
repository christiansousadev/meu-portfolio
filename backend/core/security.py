"""primitivas de seguranca: emissao/verificacao de jwt via cookie httponly."""

import logging
import re
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request
from passlib.context import CryptContext

from core.config import settings

# nome do cookie usado para transportar o jwt no fluxo administrativo;
# manter centralizado evita divergencia entre login, logout e verify_token
SESSION_COOKIE_NAME = "admin_session"

PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")

# hash bcrypt valido: $2[aby]$<cost>$<22 chars de salt><31 chars de hash>
_BCRYPT_RE = re.compile(r"^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$")


# SANITIZACAO DE HASH BCRYPT
def sanitize_bcrypt_hash(raw: str | None) -> str:
    """
    devolve o hash limpo, tolerando corrupcoes comuns:
      * aspas externas (\" ou ') inseridas por shells ou wrappers .env
      * dolar duplicado ($$) gerado por interpolacao do docker-compose
      * espacos e quebras de linha em volta
    string vazia indica hash ausente; formato invalido propaga vazio
    para o chamador tratar como "servico indisponivel".
    """
    if not raw:
        return ""
    s = raw.strip()
    # remove aspas externas pareadas (uma camada apenas)
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ('"', "'"):
        s = s[1:-1].strip()
    # docker-compose interpola variaveis: um '$' literal vira '$$' no arquivo
    if "$$" in s:
        s = s.replace("$$", "$")
    return s if _BCRYPT_RE.match(s) else ""


# EMISSAO DE TOKEN JWT
def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


# DEPENDENCIA DE AUTENTICACAO POR COOKIE
def verify_token(request: Request) -> str:
    """
    le o jwt diretamente do cookie http-only e devolve o subject.

    qualquer falha (ausencia, expiracao ou assinatura invalida) gera 401
    sem revelar detalhes ao cliente e produz log estruturado para auditoria.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        # ausencia de cookie e o caso comum em sessao expirada; nao alarmar
        raise HTTPException(status_code=401, detail="autenticacao requerida")

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        logging.warning("tentativa de acesso bloqueada por token expirado")
        raise HTTPException(status_code=401, detail="sessao expirada")
    except jwt.InvalidTokenError:
        # assinatura invalida indica tentativa de forjar token; eleva o log
        logging.warning("tentativa de acesso bloqueada por token invalido")
        raise HTTPException(status_code=401, detail="credenciais invalidas")

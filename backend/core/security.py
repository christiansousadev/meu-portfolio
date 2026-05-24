"""Primitivas de seguranca: emissao/verificacao de JWT via cookie HttpOnly."""

import logging
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request
from passlib.context import CryptContext

from core.config import settings

# nome do cookie usado para transportar o jwt no fluxo administrativo;
# manter centralizado evita divergencia entre login, logout e verify_token
SESSION_COOKIE_NAME = "admin_session"

PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")


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

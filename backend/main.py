import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.logging_config import configure_logging
from core.rate_limit import RateLimitMiddleware
from core.security_headers import SecurityHeadersMiddleware
from core.trace_middleware import TRACE_HEADER, TraceIdMiddleware
from core.trace_context import get_trace_id
from routers import admin, chat

# configura o logger estruturado em json antes de instanciar o fastapi
# para que qualquer evento de boot ja saia no formato padronizado
configure_logging(level=logging.INFO)

# persistencia exclusivamente em arquivos json/jsonl sob backend/data/;
# nao ha migracao de schema ou conexao com banco relacional no boot.

app = FastAPI(
    title="Portfolio API",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

# guarda explicita contra wildcard em allowed_origins:
# cors com allow_credentials=true e origem "*" permite que qualquer site
# envie requisicoes autenticadas via cookie
for _origin in settings.allowed_origins:
    if "*" in _origin:
        raise RuntimeError(
            f"wildcard nao e permitido em ALLOWED_ORIGINS: {_origin}"
        )

# allow_credentials=true e obrigatorio para que o navegador envie o cookie
# http-only de sessao em requisicoes cross-origin (admin do frontend).
# expose_headers libera o trace id para clientes lerem via fetch
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=[TRACE_HEADER],
)

app.add_middleware(RateLimitMiddleware)

# headers de seguranca em toda resposta (clickjacking, mime sniffing,
# referrer, csp e permissions policy); fica logicamente entre rate-limit
# e trace_id para que ate respostas de bloqueio recebam os headers
app.add_middleware(SecurityHeadersMiddleware)

# a ordem importa: o ultimo add_middleware fica como camada mais externa,
# entao o trace_id e fixado antes de qualquer outra logica e fica
# disponivel para cors, rate-limit, handlers e exception handler
app.add_middleware(TraceIdMiddleware)


# HANDLER GLOBAL DE EXCECOES NAO TRATADAS
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """captura erros nao tratados, loga com trace_id e oculta stack em producao."""
    logging.exception(f"erro nao tratado em {request.url.path}: {exc}")
    detail = (
        "erro interno do servidor"
        if settings.is_production
        else f"{type(exc).__name__}: {exc}"
    )
    # ecoa o trace_id na resposta de erro mesmo quando o middleware
    # nao chega a executar o set de header (ex.: erro muito precoce)
    return JSONResponse(
        status_code=500,
        content={"detail": detail, "trace_id": get_trace_id()},
        headers={TRACE_HEADER: get_trace_id()},
    )


# registro de rotas (modulares)
app.include_router(chat.router)
app.include_router(admin.router)

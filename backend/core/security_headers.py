"""
middleware de defesa em profundidade que injeta headers padrao de
seguranca em toda resposta http da api.

a politica e conservadora porque a aplicacao serve majoritariamente json:
nao ha necessidade de scripts, estilos ou recursos externos no proprio
dominio da api. o frontend e um host separado e dispoe da propria politica.

headers aplicados:
  * X-Frame-Options: DENY            anti-clickjacking
  * X-Content-Type-Options: nosniff  bloqueia mime sniffing
  * Referrer-Policy                  strict-origin-when-cross-origin
  * Content-Security-Policy          default-src 'none' (api so devolve json)
  * Permissions-Policy               desliga apis sensiveis do navegador
  * Strict-Transport-Security        apenas em producao (https obrigatorio)
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from core.config import settings


# csp restritiva para uma api json: nada pode ser carregado por padrao
# e ninguem pode embedar a resposta em iframe
_CSP_POLICY = (
    "default-src 'none'; "
    "frame-ancestors 'none'; "
    "base-uri 'none'; "
    "form-action 'none'"
)

# permissions-policy bloqueia apis sensiveis caso a resposta seja
# eventualmente renderizada pelo navegador (ex.: /docs em ambientes dev)
_PERMISSIONS_POLICY = (
    "geolocation=(), "
    "microphone=(), "
    "camera=(), "
    "payment=(), "
    "usb=()"
)

_BASE_HEADERS: dict[str, str] = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": _CSP_POLICY,
    "Permissions-Policy": _PERMISSIONS_POLICY,
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """aplica os headers base em qualquer resposta, inclusive de erro."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # setdefault preserva valores que rotas especificas tenham definido
        for header, value in _BASE_HEADERS.items():
            response.headers.setdefault(header, value)

        # hsts so faz sentido sobre https; aplicar em dev sobre http
        # poderia "queimar" o navegador do desenvolvedor por meses
        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=63072000; includeSubDomains; preload",
            )

        return response

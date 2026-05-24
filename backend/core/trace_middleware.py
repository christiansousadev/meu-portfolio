"""
middleware http que materializa o trace_id de cada requisicao.

a estrategia e simples:
  * se o cliente envia X-Trace-ID com formato valido, reutilizamos
    (permite correlacao com sistemas externos a montante);
  * caso contrario, geramos um uuid4 novo.

o valor e fixado em contextvar para ser lido pelo JsonFormatter e
ecoado no header de resposta para auditoria externa.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from core.trace_context import (
    is_valid_trace_id,
    new_trace_id,
    reset_trace_id,
    set_trace_id,
)


# NOME DO HEADER PADRONIZADO
TRACE_HEADER = "X-Trace-ID"


class TraceIdMiddleware(BaseHTTPMiddleware):
    """injeta trace_id por requisicao no contextvar e nos headers de resposta."""

    async def dispatch(self, request: Request, call_next) -> Response:
        incoming = request.headers.get(TRACE_HEADER, "").strip()
        # confia em uuid bem formado para impedir log injection;
        # qualquer outro valor e descartado e substituido por um novo id
        trace_id = incoming if is_valid_trace_id(incoming) else new_trace_id()

        token = set_trace_id(trace_id)
        try:
            response = await call_next(request)
            response.headers[TRACE_HEADER] = trace_id
            return response
        finally:
            # garante isolamento entre requisicoes mesmo em caso de excecao
            reset_trace_id(token)

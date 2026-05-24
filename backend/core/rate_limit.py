"""
middleware in-memory de sliding window por (path, ip).

funciona apenas para um worker uvicorn unico. em deploy multi-replica,
trocar por backend redis (fastapi-limiter).

o ip do cliente e resolvido via core.proxy.get_client_ip, que so honra
X-Forwarded-For quando o peer direto pertence a TRUSTED_PROXIES.
"""

import logging
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from core.proxy import get_client_ip


RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/admin/login": (5, 60),
    "/api/chat": (30, 60),
    # endpoint publico de telemetria: limita a 20 req/min por ip para
    # impedir inflacao maliciosa da tabela site_analytics em mysql
    "/api/analytics/track": (20, 60),
}

_buckets: dict[tuple[str, str], deque] = defaultdict(deque)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rule = RATE_LIMITS.get(request.url.path)
        if rule is None:
            return await call_next(request)

        max_calls, window = rule

        # ip real do cliente: protegido contra spoofing por X-Forwarded-For
        # quando o operador define TRUSTED_PROXIES corretamente em prod
        client_ip = get_client_ip(request)

        key = (request.url.path, client_ip)
        now = time.time()
        bucket = _buckets[key]

        # descarta hits fora da janela deslizante
        while bucket and now - bucket[0] > window:
            bucket.popleft()

        if len(bucket) >= max_calls:
            logging.warning(
                "rate limit excedido",
                extra={"event": "rate_limit", "path": request.url.path, "ip": client_ip},
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "muitas requisicoes; tente novamente em instantes"},
            )

        bucket.append(now)
        return await call_next(request)

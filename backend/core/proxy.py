"""
resolucao defensiva do ip do cliente atras de proxy reverso.

estrategia:
  * se o peer imediato (request.client.host) NAO esta em TRUSTED_PROXIES,
    o cabecalho X-Forwarded-For e ignorado por completo (proteção contra
    ip spoofing por clientes diretos);
  * se o peer e um proxy confiavel, percorre X-Forwarded-For da direita
    para a esquerda removendo cada hop tambem confiavel; o primeiro hop
    nao confiavel encontrado e considerado o ip de origem real;
  * qualquer entrada com formato invalido e descartada via ipaddress.
"""

import ipaddress
import logging
from typing import Iterable

from starlette.requests import Request

from core.config import settings


# COMPILA AS REDES CONFIAVEIS DECLARADAS NA ENV
def _parse_networks(values: Iterable[str]):
    """converte cada item de settings.trusted_proxies em ip_network."""
    networks = []
    for raw in values:
        try:
            # strict=False permite informar host puro (ex.: 10.0.0.5)
            networks.append(ipaddress.ip_network(raw, strict=False))
        except ValueError:
            # configuracao invalida nao deve derrubar o boot; apenas registra
            logging.warning(
                "trusted proxy invalido ignorado",
                extra={"event": "trusted_proxy_invalid", "value": raw},
            )
    return networks


_TRUSTED_NETWORKS = _parse_networks(settings.trusted_proxies)


# VALIDACAO DE FORMATO DE IP
def _is_valid_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except (ValueError, AttributeError):
        return False


# CHECAGEM DE PERTENCIMENTO A UMA REDE CONFIAVEL
def _ip_in_trusted(value: str) -> bool:
    if not _TRUSTED_NETWORKS:
        return False
    try:
        addr = ipaddress.ip_address(value)
    except (ValueError, AttributeError):
        return False
    return any(addr in net for net in _TRUSTED_NETWORKS)


# RESOLVE O IP REAL DO CLIENTE
def get_client_ip(request: Request) -> str:
    """
    devolve o ip que devera ser usado por componentes sensiveis a origem
    (rate-limit, logs de auditoria, geo-bloqueio). fallback "unknown" se
    a request nao expoe peer (pode ocorrer em testes de unidade).
    """
    immediate = request.client.host if request.client else None
    if not immediate:
        return "unknown"

    # sem proxy confiavel configurado ou peer nao confiavel:
    # nao podemos confiar no header e devolvemos o ip direto
    if not _ip_in_trusted(immediate):
        return immediate

    forwarded = request.headers.get("x-forwarded-for")
    if not forwarded:
        return immediate

    # X-Forwarded-For: "client, proxy1, proxy2"
    # cada proxy intermediario anexa o peer anterior a direita;
    # andando da direita para a esquerda e descartando proxies confiaveis,
    # o primeiro nao confiavel e o cliente real (sem inflar via spoof)
    candidates = [part.strip() for part in forwarded.split(",") if part.strip()]
    for candidate in reversed(candidates):
        if not _is_valid_ip(candidate):
            continue
        if not _ip_in_trusted(candidate):
            return candidate

    # cadeia composta apenas por proxies confiaveis: caso degenerado;
    # devolve o peer imediato como melhor aproximacao
    return immediate

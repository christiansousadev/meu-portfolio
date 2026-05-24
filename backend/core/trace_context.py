"""
contextvar global usada para propagar o trace_id da requisicao ate o
formatter de logs sem precisar passar o id explicitamente em cada chamada.

contextvars sao copiadas automaticamente para tarefas asyncio filhas,
o que garante que handlers, dependencias e middlewares vejam o mesmo
identificador dentro do escopo de uma unica requisicao.
"""

import contextvars
import uuid

# valor sentinela usado quando o codigo executa fora do escopo de uma
# requisicao http (ex.: startup, scripts cli, jobs em background)
_TRACE_ID_DEFAULT = "-"

_trace_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "trace_id", default=_TRACE_ID_DEFAULT
)


# LEITURA DO TRACE ID ATUAL
def get_trace_id() -> str:
    """retorna o trace_id da requisicao em curso ou sentinela quando ausente."""
    return _trace_id_var.get()


# ESCRITA DO TRACE ID (USO INTERNO DO MIDDLEWARE)
def set_trace_id(value: str) -> contextvars.Token:
    """grava o trace_id no escopo atual e devolve o token para reset."""
    return _trace_id_var.set(value)


# LIMPEZA APOS A REQUISICAO
def reset_trace_id(token: contextvars.Token) -> None:
    """restaura o valor anterior do contextvar."""
    _trace_id_var.reset(token)


# GERADOR PADRAO
def new_trace_id() -> str:
    """retorna um uuid4 textual usado como id de correlacao."""
    return str(uuid.uuid4())


# VALIDACAO DE TRACE ID RECEBIDO
def is_valid_trace_id(value: str) -> bool:
    """
    aceita apenas uuid bem formado para impedir log injection via header
    arbitrario (ex.: cabecalho contendo quebras de linha ou aspas).
    """
    if not value:
        return False
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False

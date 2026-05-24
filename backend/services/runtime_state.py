"""
gerencia o estado mutavel em runtime do servidor (ex.: provedor llm ativo).

a persistencia ocorre em arquivo json dedicado, isolado dos schemas de
conteudo validados pelo pydantic, e usa escrita atomica (tempfile + os.replace)
para impedir estado parcial em caso de crash. um lock de processo garante
serializacao basica entre threads do mesmo worker uvicorn.

deploys multi-worker devem migrar este estado para um backing store
compartilhado (redis, banco) — por hora, o lock cobre o cenario single-worker.
"""

import json
import logging
import os
import tempfile
import threading
from pathlib import Path

from core.config import settings

# arquivo dedicado: nao mistura estado mutavel com portfolio_data.json,
# evitando colisao com o schema estrito (extra='forbid') de PortfolioData
RUNTIME_STATE_PATH: Path = settings.base_dir / "data" / "runtime_state.json"

# providers aceitos espelham o regex do schema InterpreterRequest
_ALLOWED_PROVIDERS: set[str] = {"json_only", "gemini", "openai", "ollama", "deepseek"}

# lock de processo para serializar leitura/escrita concorrente
_STATE_LOCK = threading.Lock()


# LEITURA INTERNA DO ARQUIVO DE ESTADO
def _read_state() -> dict:
    """retorna o conteudo do arquivo; dict vazio se inexistente ou corrompido."""
    if not RUNTIME_STATE_PATH.exists():
        return {}
    try:
        text = RUNTIME_STATE_PATH.read_text(encoding="utf-8").strip()
        return json.loads(text) if text else {}
    except (json.JSONDecodeError, OSError) as exc:
        # corrupcao em runtime_state.json nao deve derrubar o servico;
        # registra e cai no fallback (default do settings)
        logging.error(
            "falha ao ler runtime_state.json; assumindo estado vazio",
            extra={"event": "runtime_state_read_failed", "error": str(exc)},
        )
        return {}


# ESCRITA ATOMICA NO ARQUIVO DE ESTADO
def _write_state_atomic(payload: dict) -> None:
    """grava o payload via arquivo temporario e renomeia para evitar estado parcial."""
    RUNTIME_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")

    with tempfile.NamedTemporaryFile(
        mode="wb",
        dir=RUNTIME_STATE_PATH.parent,
        prefix=".runtime_state.",
        suffix=".tmp",
        delete=False,
    ) as tmp:
        tmp.write(encoded)
        tmp.flush()
        os.fsync(tmp.fileno())
        tmp_path = tmp.name

    os.replace(tmp_path, RUNTIME_STATE_PATH)


# API PUBLICA: LEITURA DO PROVEDOR ATIVO
def get_active_interpreter() -> str:
    """devolve o provedor persistido; aplica fallback do settings se invalido."""
    with _STATE_LOCK:
        state = _read_state()

    value = state.get("active_interpreter")
    if isinstance(value, str) and value in _ALLOWED_PROVIDERS:
        return value
    return settings.active_interpreter_default


# API PUBLICA: ESCRITA DO PROVEDOR ATIVO
def set_active_interpreter(provider: str) -> str:
    """
    persiste o provedor ativo de forma atomica e thread-safe.

    levanta ValueError quando o provider nao esta na whitelist e OSError
    quando a escrita em disco falha; o chamador deve traduzir essas
    excecoes para a resposta http apropriada e auditar via audit_logger.
    """
    if provider not in _ALLOWED_PROVIDERS:
        raise ValueError(f"provider invalido: {provider}")

    with _STATE_LOCK:
        state = _read_state()
        state["active_interpreter"] = provider
        try:
            _write_state_atomic(state)
        except OSError as exc:
            # falha de io em disco; propaga para o router registrar audit_failure
            logging.error(
                "falha ao persistir runtime_state.json",
                extra={"event": "runtime_state_write_failed", "error": str(exc)},
            )
            raise

    return provider

"""
armazenamento append-only em arquivos jsonl para chat e telemetria.

cada linha do arquivo e um registro independente em json, o que permite
recuperacao parcial mesmo com corrupcao localizada e ingestao direta em
ferramentas tipo elastic/splunk. as escritas usam fsync para minimizar
janela de perda em queda de energia, e um lock de processo serializa
o append entre threads do mesmo worker uvicorn.
"""

import json
import logging
import os
import tempfile
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator

from core.config import settings

# caminhos dedicados sob backend/data/; sobrevivem via volume nomeado em docker
CHAT_LOG_PATH: Path = settings.base_dir / "data" / "chat_logs.jsonl"
ANALYTICS_PATH: Path = settings.base_dir / "data" / "analytics.jsonl"

# politica de retencao padrao (dias) alinhada a lgpd art. 6 iii
RETENTION_DAYS = 90

# lock por processo: cobre o cenario single-worker do uvicorn em vps
_WRITE_LOCK = threading.Lock()


# UTILITARIO PUBLICO DE TIMESTAMP
def utc_now_iso() -> str:
    """timestamp utc iso-8601 usado como chave de ordenacao temporal."""
    return datetime.now(timezone.utc).isoformat()


# APPEND ATOMICO DE UMA LINHA JSONL
def append_jsonl(path: Path, record: dict) -> None:
    """grava uma linha jsonl com fsync, serializada entre threads."""
    record.setdefault("timestamp", utc_now_iso())
    line = json.dumps(record, ensure_ascii=False, default=str) + "\n"

    with _WRITE_LOCK:
        path.parent.mkdir(parents=True, exist_ok=True)
        # modo binario impede conversao automatica de newline no windows
        with open(path, "ab") as fh:
            fh.write(line.encode("utf-8"))
            fh.flush()
            os.fsync(fh.fileno())


# ITERADOR TOLERANTE A LINHAS CORROMPIDAS
def iter_jsonl(path: Path) -> Iterator[dict]:
    """percorre o arquivo registro a registro, pulando linhas invalidas."""
    if not path.exists():
        return
    with open(path, "r", encoding="utf-8") as fh:
        for raw in fh:
            stripped = raw.strip()
            if not stripped:
                continue
            try:
                yield json.loads(stripped)
            except json.JSONDecodeError:
                logging.warning(
                    "linha jsonl corrompida ignorada",
                    extra={"event": "jsonl_decode_error", "path": str(path)},
                )


# LEITURA DOS ULTIMOS N REGISTROS
def read_recent(path: Path, limit: int) -> list[dict]:
    """retorna os ultimos N registros em ordem cronologica reversa."""
    if limit <= 0:
        return []
    records = list(iter_jsonl(path))
    return list(reversed(records[-limit:]))


# CONTAGEM TOTAL DE REGISTROS
def count_records(path: Path) -> int:
    """conta as linhas validas do arquivo."""
    return sum(1 for _ in iter_jsonl(path))


# CONTAGEM FILTRADA POR CHAVE/VALOR
def count_where(path: Path, *, key: str, value: str) -> int:
    """conta registros cujo campo key bate com value."""
    return sum(1 for r in iter_jsonl(path) if r.get(key) == value)


# AGREGADOR DE TEMPO MEDIO DE RESPOSTA DO CHAT
def average_response_ms(path: Path) -> float:
    """media simples de response_time_ms; zero se nao houver dados."""
    total = 0
    count = 0
    for record in iter_jsonl(path):
        value = record.get("response_time_ms")
        if isinstance(value, (int, float)) and value >= 0:
            total += value
            count += 1
    return round(total / count, 2) if count else 0.0


# PURGA POR JANELA DE RETENCAO
def purge_older_than(path: Path, days: int) -> int:
    """
    remove registros com timestamp anterior ao corte e devolve a contagem
    removida. reescrita do arquivo e atomica via tempfile + os.replace.
    """
    if days <= 0:
        raise ValueError("dias deve ser maior que zero")
    if not path.exists():
        return 0

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    kept: list[str] = []
    removed = 0

    for record in iter_jsonl(path):
        ts = record.get("timestamp")
        try:
            record_dt = datetime.fromisoformat(ts) if isinstance(ts, str) else None
        except ValueError:
            record_dt = None

        # registros sem timestamp valido sao preservados para nao perder trilha
        if record_dt and record_dt < cutoff:
            removed += 1
            continue
        kept.append(json.dumps(record, ensure_ascii=False, default=str))

    if removed == 0:
        return 0

    payload = ("\n".join(kept) + ("\n" if kept else "")).encode("utf-8")

    with _WRITE_LOCK:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as tmp:
            tmp.write(payload)
            tmp.flush()
            os.fsync(tmp.fileno())
            tmp_path = tmp.name
        os.replace(tmp_path, path)

    return removed

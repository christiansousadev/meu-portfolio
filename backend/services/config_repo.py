"""
repositorio de leitura e escrita dos arquivos json de configuracao:
  * resolucao segura de caminho (whitelist + realpath check)
  * escrita atomica (tempfile + os.replace)
  * registro de auditoria estruturado em toda mutacao

todos os arquivos vivem em backend/data/ (montado via bind mount em prod),
garantindo paridade dev/prod e sobrevivencia a rebuild de container.
"""

import json
import logging
import os
import tempfile
from pathlib import Path

from fastapi import HTTPException

from core.config import settings
from core.logging_config import audit_file_write
from schemas.portfolio import AllowedConfigFile


# RESOLUCAO SEGURA DE CAMINHO
def resolve_path(filename: AllowedConfigFile) -> Path:
    """resolve filename para caminho absoluto dentro de data_dir (whitelist)."""
    target = settings.data_dir / filename.value
    resolved = Path(os.path.realpath(target))
    allowed_root = Path(os.path.realpath(settings.data_dir))

    if not _is_within(resolved, allowed_root):
        logging.error(
            "tentativa de acesso fora da whitelist",
            extra={"event": "path_traversal", "resolved": str(resolved)},
        )
        raise HTTPException(status_code=400, detail="arquivo nao permitido")

    return resolved


def _is_within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def read_config(filename: AllowedConfigFile) -> dict:
    path = resolve_path(filename)
    if not path.exists():
        logging.warning(
            "arquivo de configuracao ausente",
            extra={"event": "config_read_missing", "file_name": filename.value, "path": str(path)},
        )
        return {}

    text = path.read_text(encoding="utf-8")
    if not text.strip():
        return {}
    return json.loads(text)


def write_config(filename: AllowedConfigFile, payload: dict, actor: str) -> int:
    """
    Persiste payload validado em disco de forma atomica.

    Retorna o numero de bytes gravados. Em qualquer cenario emite registro
    de auditoria via audit_file_write para rastreabilidade.
    """
    path = resolve_path(filename)
    action = "update" if path.exists() else "create"
    encoded = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")

    try:
        path.parent.mkdir(parents=True, exist_ok=True)

        # escrita atomica: grava em arquivo temporario na mesma pasta
        # e renomeia, evitando estado parcial em caso de crash.
        tmp_dir = path.parent
        with tempfile.NamedTemporaryFile(
            mode="wb", dir=tmp_dir, prefix=f".{filename.value}.", suffix=".tmp", delete=False
        ) as tmp:
            tmp.write(encoded)
            tmp.flush()
            os.fsync(tmp.fileno())
            tmp_path = tmp.name

        os.replace(tmp_path, path)
    except Exception as exc:
        audit_file_write(
            filename=filename.value,
            resource_path=str(path),
            actor=actor,
            bytes_written=0,
            action=action,
            status="failure",
            error=f"{type(exc).__name__}: {exc}",
        )
        raise

    audit_file_write(
        filename=filename.value,
        resource_path=str(path),
        actor=actor,
        bytes_written=len(encoded),
        action=action,
        status="success",
    )
    return len(encoded)

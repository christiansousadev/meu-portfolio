"""
configuracao de logging estruturado em json e helper de auditoria de escrita.

o logger 'audit' grava qualquer mutacao em arquivo (escrita, criacao, falha)
em formato chave=valor para ingestao em siem, atendendo aos requisitos de
rastreabilidade exigidos por itil change management e iso 27001 a.12.4.

todo registro recebe:
  * trace_id da requisicao em curso (correlacao entre eventos);
  * mascaramento automatico de pii via _redact (lgpd art. 6 iii).
"""

import json
import logging
import re
import sys
from datetime import datetime, timezone
from typing import Any

from core.trace_context import get_trace_id


# REGRAS DE REDACAO DE PII
# ordem importa: padroes mais especificos primeiro para nao colidir
# com padroes generalistas como o de email
_REDACTED = "[REDACTED]"

# jwt: tres segmentos base64url separados por ponto
_JWT_RE = re.compile(r"eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+")

# hash bcrypt acidentalmente logado ($2a/$2b/$2y$<cost>$<53 chars>)
_BCRYPT_RE = re.compile(r"\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}")

# cpf brasileiro com ou sem mascara
_CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")

# email rfc5322 simplificado: suficiente para mascaramento operacional
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

# bearer tokens explicitos em strings
_BEARER_RE = re.compile(r"(?i)bearer\s+[A-Za-z0-9_\-\.=]+")

_PATTERNS = (_JWT_RE, _BCRYPT_RE, _BEARER_RE, _EMAIL_RE, _CPF_RE)


# CAMPOS RESERVADOS DO LOGRECORD QUE NAO DEVEM IR PARA O PAYLOAD JSON
_RESERVED_LOGRECORD_KEYS = {
    "args", "asctime", "created", "exc_info", "exc_text",
    "filename", "funcName", "levelname", "levelno", "lineno",
    "module", "msecs", "message", "msg", "name", "pathname",
    "process", "processName", "relativeCreated", "stack_info",
    "thread", "threadName", "taskName",
}


# REDATOR RECURSIVO
def _redact(value: Any) -> Any:
    """
    percorre estruturas aninhadas e mascara pii em strings.

    listas/tuplas/dicts sao reconstruidos para preservar a forma original
    do payload no log; qualquer outro tipo e retornado sem alteracao.
    """
    if isinstance(value, str):
        masked = value
        for pattern in _PATTERNS:
            masked = pattern.sub(_REDACTED, masked)
        return masked
    if isinstance(value, dict):
        return {k: _redact(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_redact(item) for item in value]
    return value


# FORMATTER JSON
class JsonFormatter(logging.Formatter):
    """serializa cada registro como uma linha json com trace_id e pii mascarada."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "trace_id": get_trace_id(),
            "message": _redact(record.getMessage()),
        }

        if record.exc_info:
            # excecoes podem carregar stack trace com dados sensiveis
            payload["exception"] = _redact(self.formatException(record.exc_info))

        # campos extras passados via logger.info(..., extra={...})
        for key, value in record.__dict__.items():
            if key in payload or key.startswith("_"):
                continue
            if key in _RESERVED_LOGRECORD_KEYS:
                continue
            payload[key] = _redact(value)

        return json.dumps(payload, ensure_ascii=False, default=str)


# CONFIGURACAO IDEMPOTENTE DO LOGGER RAIZ
def configure_logging(level: int = logging.INFO) -> None:
    """aplica o JsonFormatter no handler raiz, idempotente."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.setLevel(level)
    # remove handlers padrao para evitar duplicacao em modo --reload
    for existing in list(root.handlers):
        root.removeHandler(existing)
    root.addHandler(handler)


audit_logger = logging.getLogger("audit")


# AUDITORIA DE ESCRITA EM ARQUIVO
def audit_file_write(
    *,
    filename: str,
    resource_path: str,
    actor: str,
    bytes_written: int,
    action: str,
    status: str,
    error: str | None = None,
) -> None:
    """
    emite registro estruturado para cada operacao de escrita em arquivo.

    campos sao alinhados ao padrao cim (common information model) para
    facilitar correlacao em ferramentas como splunk e elastic.
    """
    audit_logger.info(
        "file_write_audit",
        extra={
            "event": "file_write",
            "file_name": filename,
            "resource_path": resource_path,
            "actor": actor,
            "bytes_written": bytes_written,
            "action": action,
            "status": status,
            "error": error,
            "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

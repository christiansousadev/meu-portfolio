# syntax=docker/dockerfile:1.7
# ============================================================
# Backend FastAPI - Multi-stage build
# Imagem final ~80MB, usuario nao-root, sem cache pip
# ============================================================

# ---- Stage 1: builder -----------------------------------------------------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Dependencias de sistema apenas para a fase de build
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt


# ---- Stage 2: runtime -----------------------------------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/usr/local/bin:${PATH}"

# Cria usuario nao-root para mitigar escalation em caso de RCE
RUN groupadd --system app && useradd --system --gid app --home /app app

WORKDIR /app

# Copia somente o que foi instalado no builder
COPY --from=builder /install /usr/local

# Copia o codigo da aplicacao
COPY --chown=app:app . /app

# Permissoes: data/ precisa ser gravavel para runtime_state.json
RUN mkdir -p /app/data && chown -R app:app /app

USER app

EXPOSE 8000

# Healthcheck simples baseado no endpoint publico de portfolio
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request, sys; \
        sys.exit(0) if urllib.request.urlopen('http://127.0.0.1:8000/api/portfolio', timeout=3).status == 200 else sys.exit(1)" \
        || exit 1

# 2 workers por padrao; ajustar via env GUNICORN_WORKERS conforme CPU da VPS
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS:-2} --proxy-headers --forwarded-allow-ips=*"]

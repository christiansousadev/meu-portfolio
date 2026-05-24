# syntax=docker/dockerfile:1.7
# ============================================================
# Frontend React/Vite - Build estatico + Nginx Alpine
# Imagem final ~25MB, usuario nao-root
# ============================================================

# ---- Stage 1: build -------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build

# Cache de dependencias: copia somente os manifests primeiro
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copia o restante e gera bundle de producao
COPY . .

# VITE_API_URL e injetado em build-time (variavel de bundle)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build


# ---- Stage 2: runtime (Nginx) ---------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Remove configuracao default e usa a nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o bundle gerado
COPY --from=builder /build/dist /usr/share/nginx/html

# Nginx ja vem com usuario "nginx" nao-root para os workers
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

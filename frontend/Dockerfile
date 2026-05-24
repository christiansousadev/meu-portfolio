# syntax=docker/dockerfile:1.7
# ============================================================
# frontend react/vite -> nginx alpine
# bundle nao carrega url absoluta da api: as chamadas usam path
# relativo /api/ e o nginx do container faz o proxy para o backend
# ============================================================

# ---- stage 1: build -------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build

# cache de deps: copia somente os manifests primeiro
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# copia o restante e gera o bundle de producao
COPY . .
RUN npm run build


# ---- stage 2: runtime (nginx) ---------------------------------------------
FROM nginx:1.27-alpine AS runtime

# substitui a config default pela nossa (inclui proxy /api/ -> backend)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# bundle estatico gerado no estagio anterior
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Portfólio Christian Sousa

**Plataforma híbrida React + FastAPI com RAG corporativo, governança de TI e deploy automatizado via Docker.**

> [!NOTE]
> Este projeto serve como vitrine técnica e ao mesmo tempo como referência prática de arquitetura **same-origin**, persistência **JSON-only**, auditoria estruturada (LGPD / ISO 27001 A.12.4) e CI/CD via `git pull` na VPS.

---

## 1. Visão Geral do Sistema

Sistema composto por dois serviços containerizados, orquestrados via Docker Compose, expostos sob um único domínio através de proxy reverso.

| Camada | Tecnologia | Função |
|---|---|---|
| **Frontend** | React 18 + Vite 5 (bundle estático servido por Nginx Alpine) | Renderiza o portfólio público, o widget de chat e o Dashboard de Governança (`/admin`) |
| **Backend** | Python 3.12 + FastAPI + Uvicorn | API REST, autenticação JWT em cookie HttpOnly, integração com LLMs e auditoria estruturada |
| **Persistência** | Arquivos JSON / JSONL em `backend/data/` (bind mount) | Dados de portfólio, contexto RAG e trilhas append-only de chat/telemetria |
| **IA** | Google Gemini / OpenAI / Ollama / DeepSeek (intercambiáveis em runtime) | Assistente conversacional com **RAG corporativo**: recorta o contexto JSON antes de chamar o LLM, reduzindo tokens e impedindo vazamento de dados acessórios |

O intérprete ativo é trocável em runtime via painel administrativo (`POST /api/admin/interpreter`) e persistido em `runtime_state.json` com escrita atômica — sem mutação de `os.environ`, sem race condition em deploys multi-réplica.

---

## 2. Arquitetura e Fluxo de Rede (Same-Origin)

### Topologia

```
        ┌──────────────────────────┐
        │       Navegador          │
        │  madebychristian.fusao   │
        └────────────┬─────────────┘
                     │  HTTPS (TLS 1.3)
                     ▼
        ┌──────────────────────────┐
        │   Nginx do HOST (VPS)    │   ← TLS termina aqui (Let's Encrypt)
        │   :443 ─▶ 127.0.0.1:8081 │
        └────────────┬─────────────┘
                     │  HTTP local (loopback)
                     ▼
   ┌─────────────────────────────────────┐
   │  portfolio-frontend (Nginx Alpine)  │
   │  :80 dentro do container            │
   │  ├─ /          → SPA estática       │
   │  └─ /api/      → proxy_pass         │
   └────────────────┬────────────────────┘
                    │  Rede Docker interna (portfolio-net)
                    ▼
   ┌─────────────────────────────────────┐
   │  portfolio-backend (FastAPI)        │
   │  :8000 — NÃO exposto ao host        │
   │  Lê e grava em /app/data ──┐        │
   └────────────────────────────┼────────┘
                                │  Bind mount
                                ▼
                       ./backend/data
                       (host = fonte de verdade)
```

### Princípios aplicados

| Princípio | Implementação |
|---|---|
| **Same-Origin** | Bundle React faz `fetch("/api/...")` (path relativo). Nenhuma URL absoluta no JS — não há CORS, não há subdomínio `api.*`, não há `ERR_NAME_NOT_RESOLVED`. |
| **Defesa em camadas** | Backend não expõe porta ao host. A única forma de chegar até ele é pelo proxy interno do Nginx do container frontend, que está dentro da rede Docker. |
| **Headers de segurança** | CSP `default-src 'none'`, X-Frame-Options DENY, HSTS em produção, Permissions-Policy restritiva (aplicados via `SecurityHeadersMiddleware`). |
| **Trace ID por requisição** | `TraceIdMiddleware` injeta UUID em `contextvar`, propagado para logs JSON e ecoado no header `X-Trace-ID` para correlação cliente/servidor. |
| **Rate limit por IP real** | `RateLimitMiddleware` resolve o IP via `X-Forwarded-For` somente quando o peer pertence a `TRUSTED_PROXIES`, evitando spoofing. |

### Persistência unificada via Bind Mount

```yaml
backend:
  volumes:
    - ./backend/data:/app/data
```

| Vantagem | Por quê importa |
|---|---|
| `git pull` na VPS atualiza JSONs e o container vê imediatamente | Zero rebuild para mudar dados |
| Mutações via `/admin` gravam direto em `./backend/data/` no host | Você pode `git commit` o resultado e sincronizar dev ↔ prod |
| Sem "arquivos zumbis" do `copy-on-create` de volumes nomeados | Estado nunca diverge entre o repo e o container |

> [!IMPORTANT]
> Arquivos como `runtime_state.json`, `analytics.jsonl` e `chat_logs.jsonl` são gerados em runtime e **estão no `.gitignore`** — nunca commitados. Apenas `portfolio.json` e `portfolio_data.json` são versionados.

---

## 3. Comandos de Desenvolvimento Local

### 3.1 Subir os serviços

```bash
# backend
cd backend
source venv/Scripts/activate          # Linux/Mac: source venv/bin/activate
uvicorn main:app --reload

# frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

Acesso local: `http://localhost:5173` (frontend) — a SPA chama `/api/...` em mesma origem, então o Vite dev server faz proxy para `localhost:8000` automaticamente.

### 3.2 Sincronização e versionamento (Git)

```bash
cd /app/meu-portfolio

git add .
git commit -m "feat: sua mensagem descritiva aqui"
git push origin main
```

> [!TIP]
> Use prefixos **Conventional Commits** para manter histórico legível:  
> `feat:` (nova feature) · `fix:` (correção) · `chore:` (manutenção) · `refactor:` (reestruturação) · `docs:` (documentação)

### 3.3 Geração de hash bcrypt para admin

```bash
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('SUA_SENHA_FORTE'))"
```

Cole o resultado em `ADMIN_PASSWORD_HASH` do `.env` — **sem aspas, sem duplicar `$`**.

### 3.4 Geração de JWT_SECRET

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

---

## 4. Esteira de Deploy na VPS

Após o `git push`, conecte na VPS via SSH e execute em sequência:

```bash
cd /app/meu-portfolio
git pull origin main
chmod -R 777 backend/data
docker compose up -d --build --force-recreate
```

### O que cada passo faz

| Comando | Função |
|---|---|
| `git pull origin main` | Sincroniza o código e os JSONs versionados |
| `chmod -R 777 backend/data` | Garante que o usuário não-root `app` do container consiga escrever no bind mount |
| `docker compose up -d --build --force-recreate` | Rebuilda imagens com cache invalidado e recria containers com a nova configuração |

### Validação pós-deploy

```bash
# 1. ambos containers em estado healthy
docker compose ps

# 2. backend responde dentro da rede docker
docker exec portfolio-frontend wget -qO- http://backend:8000/api/portfolio | head -c 200

# 3. proxy do nginx interno funciona
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8081/api/portfolio
# esperado: 200

# 4. dominio publico responde via nginx do host
curl -sI https://madebychristian.fusaotecno.com/api/portfolio | head -1
# esperado: HTTP/2 200
```

> [!WARNING]
> O `chmod 777` é deliberadamente permissivo para evitar bloqueio do bind mount em UIDs divergentes (container `app` vs. usuário do host). Em ambientes com requisitos de hardening estritos, substitua por `chown -R 1000:1000 backend/data` mapeando o UID exato.

### Pipeline conceitual

```
git push (workstation)
     │
     ▼
[ GitHub ]
     │
     ▼   ssh + manual
[ VPS ] ──▶ git pull ──▶ chmod ──▶ docker compose up --build
                                        │
                                        ▼
                              Nginx host recarregado
                              automaticamente (reload via cron / systemd)
```

---

## 5. Governança e Auditoria

A camada de observabilidade foi desenhada para atender requisitos **ITIL Change Management**, **ISO 27001 A.12.4** e **LGPD Art. 6 III** (princípio da minimização).

### Logs estruturados em JSON

Todos os eventos saem por `stdout` em formato JSON Lines, com **PII automaticamente mascarada** pelo `JsonFormatter`:

```json
{
  "timestamp": "2026-05-24T23:39:55.692354+00:00",
  "level": "INFO",
  "logger": "audit",
  "trace_id": "a8b35c6d-b762-46a3-bfd0-8ca202aac1a8",
  "event": "auth_success",
  "actor": "[REDACTED]",
  "message": "login bem sucedido"
}
```

**Padrões mascarados automaticamente:** JWT, hash bcrypt, CPF (com/sem máscara), e-mail (RFC 5322), Bearer tokens.

### Trilhas append-only

| Arquivo | Conteúdo | Retenção padrão |
|---|---|---|
| `backend/data/chat_logs.jsonl` | Interações com o assistente: pergunta, resposta, latência, fonte (`local_json` ou `ai_<provider>`) | 90 dias |
| `backend/data/analytics.jsonl` | Telemetria: `page_view`, path, browser, IP real, trace_id | 90 dias |
| `runtime_state.json` | Estado mutável (intérprete LLM ativo) — escrita atômica + thread-safe | Permanente |

A purga é idempotente e pode ser disparada por:
- `POST /api/admin/retention/purge` (manual, autenticado)
- Cron / systemd timer (automatizado)

### KPIs e SLAs no Dashboard

O painel `/admin` consolida em tempo real a partir dos JSONLs:

| KPI | Cálculo | Fonte |
|---|---|---|
| **Interações IA** | `count_records(chat_logs.jsonl)` | Append-only |
| **Visualizações** | `count_where(analytics, event_type="page_view")` | Append-only |
| **SLA de Resposta** | Média de `response_time_ms` em ms | Append-only |

### Autenticação segura

| Mecanismo | Configuração |
|---|---|
| **Cookie de sessão** | `admin_session` — `HttpOnly` (XSS-proof) + `Secure` (HTTPS-only) + `SameSite=Lax` (compatível com navegação top-level same-origin) + `path=/api/admin` (escopo restrito) |
| **JWT** | HS256, expiração 60 min (configurável via `JWT_EXPIRATION_MINUTES`) |
| **Login** | Comparação de username em tempo constante (`hmac.compare_digest`) + `bcrypt.verify` com sanitização defensiva contra `$$` do docker-compose e aspas residuais |
| **Logout** | `delete_cookie` com flags idênticas (RFC 6265) |

### Validação estrita de payload

Schemas Pydantic com `extra="forbid"` rejeitam qualquer campo desconhecido. O modelo `PortfolioData` aceita chaves PT (canônicas) e EN (compatibilidade) via `AliasChoices`, mas serializa sempre em PT — garantindo **um único contrato no arquivo persistido**.

---

## Estrutura de Pastas

```
meu-portfolio/
├── backend/
│   ├── core/
│   │   ├── config.py              # carrega .env e expõe Settings (frozen dataclass)
│   │   ├── security.py            # JWT, bcrypt, sanitize_bcrypt_hash
│   │   ├── logging_config.py      # JsonFormatter + PII redaction + audit_file_write
│   │   ├── trace_middleware.py    # X-Trace-ID por requisição
│   │   ├── security_headers.py    # CSP, HSTS, X-Frame-Options...
│   │   ├── rate_limit.py          # sliding window por (path, ip)
│   │   └── proxy.py               # resolução defensiva de X-Forwarded-For
│   ├── routers/
│   │   ├── chat.py                # /api/portfolio, /api/chat, /api/analytics/track
│   │   └── admin.py               # /api/admin/* (login, logs, stats, config, purge)
│   ├── services/
│   │   ├── config_repo.py         # leitura/escrita atômica dos JSONs
│   │   ├── jsonl_store.py         # append-only, fsync, purga por retenção
│   │   ├── llm.py                 # roteamento de provedores e RAG focado
│   │   └── runtime_state.py       # estado mutável (intérprete ativo)
│   ├── schemas/
│   │   └── portfolio.py           # Pydantic strict com AliasChoices PT/EN
│   ├── data/                      # bind mount: portfolio.json, portfolio_data.json
│   ├── Dockerfile                 # multi-stage, usuário não-root, healthcheck
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx # painel /admin com KPIs e telemetria
│   │   │   ├── ChatWidget.jsx     # widget flutuante
│   │   │   └── JsonEditor.jsx     # editor visual dos JSONs de config
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   ├── icon.ico               # favicon
│   │   └── images/
│   ├── nginx.conf                 # proxy /api/ -> backend:8000 + SPA fallback
│   ├── Dockerfile                 # multi-stage Node 20 -> Nginx 1.27 Alpine
│   └── package.json
├── docker-compose.yml             # backend + frontend + rede portfolio-net
├── .env.example                   # template de variáveis (preencher .env)
├── .gitignore
└── README.md
```

---

## Variáveis de Ambiente (`.env`)

Copie `.env.example` para `.env` e preencha. As variáveis críticas:

| Variável | Obrigatória em prod | Função |
|---|---|---|
| `ENV` | sim | `production` ou `development` |
| `JWT_SECRET` | sim | Segredo de assinatura JWT (≥ 64 chars aleatórios) |
| `ALLOWED_ORIGINS` | sim | Lista CSV de origens — sem wildcard |
| `TRUSTED_PROXIES` | sim | CIDR/IPs dos proxies confiáveis (Nginx host + rede Docker) |
| `ADMIN_USER` | sim | Username do painel |
| `ADMIN_PASSWORD_HASH` | sim | Hash bcrypt da senha (60 chars começando com `$2b$12$`) |
| `ACTIVE_INTERPRETER` | não | Padrão inicial: `json_only`, `gemini`, `openai`, `ollama` ou `deepseek` |
| `GEMINI_API_KEY` | condicional | Necessária se `ACTIVE_INTERPRETER=gemini` |

---

## Tabela de Endpoints

### Públicos

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/portfolio` | Retorna o `portfolio.json` para o frontend hidratar a UI |
| `POST` | `/api/chat` | Interage com o assistente (RAG local ou LLM) |
| `POST` | `/api/analytics/track` | Registra `page_view` em `analytics.jsonl` |

### Administrativos (cookie `admin_session` obrigatório)

| Método | Rota | Função |
|---|---|---|
| `POST` | `/api/admin/login` | Autenticação por credencial → grava cookie HttpOnly |
| `POST` | `/api/admin/logout` | Remove o cookie de sessão |
| `GET` | `/api/admin/stats` | Agregado de KPIs lendo os JSONLs |
| `GET` | `/api/admin/logs` | Últimos 100 registros de chat |
| `GET` | `/api/admin/config?filename=...` | Lê `portfolio.json` ou `portfolio_data.json` |
| `POST` | `/api/admin/config` | Persiste JSON validado (Pydantic strict) atomicamente |
| `POST` | `/api/admin/interpreter` | Troca o provedor LLM ativo em runtime |
| `POST` | `/api/admin/retention/purge` | Purga registros JSONL além de 90 dias |

---

## Licença e Contato

Projeto pessoal de **Christian Sousa**. Para questões técnicas ou propostas de colaboração:

- **LinkedIn**: [christiansousasilva](https://www.linkedin.com/in/christiansousasilva/)
- **GitHub**: [christiansousadev](https://github.com/christiansousadev)
- **Portfólio**: [madebychristian.fusaotecno.com](https://madebychristian.fusaotecno.com/)

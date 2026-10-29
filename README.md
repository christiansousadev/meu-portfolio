# Christian Sousa | Engenharia de Software & Governança de TI

Plataforma fullstack de alta confiabilidade e segurança corporativa desenvolvida com **React 18 + Vite** e **Python 3.12 + FastAPI**, orquestrada em **Docker Compose**, integrada a **Cloudflare Tunnel (Zero Trust)** e protegida por **Cloudflare Turnstile**.

🌐 **Ambiente de Produção:** [https://christiansousa.dev](https://christiansousa.dev)

---

## 1. Visão Geral e Pilares do Projeto

O sistema opera como portfólio técnico de engenharia de software, automação e governança de TI. A aplicação combina uma vitrine pública sob **Design Editorial de Engenharia** (*Obsidian Graphite* no tema escuro e *Technical Paper* no tema claro), um assistente conversacional corporativo (**RAG com controle de contexto**) e um **Console de Governança** restrito (`/admin`) para telemetria operacional, auditoria e edição em tempo real do conteúdo.

```
+-----------------------------------------------------------------------------------------+
|                                    PILARES ARQUITETURAIS                                |
+-----------------------------+-----------------------------+-----------------------------+
|    SAME-ORIGIN DOCKER       |     ZERO TRUST TUNNEL       |   GOVERNANÇA & LGPD NATIVA  |
| Sem CORS · Sem subdomínios  | Sem portas abertas no host  | Redação de PII · 90d Purge  |
| Nginx roteia / e /api/      | Borda Cloudflare + Turnstile| Trilha CIM · Fsync atômico  |
+-----------------------------+-----------------------------+-----------------------------+
```

### Tecnologias Centrais

| Camada | Tecnologia | Função no Sistema |
|---|---|---|
| **Frontend** | React 18, Vite 5, Framer Motion, Lucide Icons | SPA interativa (`Instrument Sans` + `JetBrains Mono`), coreografia `layoutId`, timeline dinâmica, diagrama SVG e console `/admin` |
| **Borda / Edge** | Cloudflare Tunnel (`cloudflared`) & Cloudflare Turnstile | Tunelamento criptografado outbound, terminação TLS 1.3, mitigação DDoS e proteção antibot |
| **Proxy / Servidor Web** | Nginx 1.27 Alpine | Proxy reverso interno `/api/`, compressão Gzip, cache de assets estáticos e SPA fallback |
| **Backend API** | Python 3.12, FastAPI, Uvicorn, Pydantic V2 | API REST assíncrona, validação estrita (`extra='forbid'`), sessão por cookie `HttpOnly` e rate limiting |
| **IA & RAG Corporativo** | Gemini 1.5 Flash, Ollama, OpenAI, DeepSeek + JSON Local | Assistente conversacional com resposta determinística local ou RAG com recorte focado de contexto |
| **Persistência de Dados** | JSON & JSONL em bind mount (`backend/data`) | Escrita atômica (`tempfile` + `fsync` + `os.replace`), auto-seed via `.example` e retenção de 90 dias |

---

## 2. Topologia de Rede e Fluxo Operacional

A infraestrutura adota o paradigma **Zero Port Exposure**: o servidor não precisa expor portas `80` ou `443` no roteador ou firewall público. Toda a comunicação externa trafega de dentro para fora através do Cloudflare Tunnel.

```
                              [ CLIENTE / NAVEGADOR ]
                                         │
                                         │ HTTPS :443 (TLS 1.3 / Borda Cloudflare)
                                         ▼
                          [ REDE DE BORDA CLOUDFLARE ]
                    (WAF · Proteção DDoS · Desafio Turnstile)
                                         │
                                         │ Túnel Criptografado Outbound
                                         ▼
             ┌────────────────────────────────────────────────────────┐
             │              DOCKER NETWORK: portfolio-net             │
             │                                                        │
             │  ┌───────────────────────────────┐                     │
             │  │ Container: cloudflared        │                     │
             │  │ (cloudflare/cloudflared)      │                     │
             │  └───────────────┬───────────────┘                     │
             │                  │ HTTP interno: frontend:80           │
             │                  ▼                                     │
             │  ┌───────────────────────────────┐                     │
             │  │ Container: portfolio-frontend │ ◄── [Opcional LAN]  │
             │  │ (Nginx 1.27 Alpine)           │     Host: :8085     │
             │  │ ├─ /          → SPA Estática  │                     │
             │  │ └─ /api/      → Proxy Pass ─┐ │                     │
             │  └─────────────────────────────┼─┘                     │
             │                                │                       │
             │                                ▼                       │
             │  ┌───────────────────────────────┐                     │
             │  │ Container: portfolio-backend  │                     │
             │  │ (FastAPI / Uvicorn · UID 1000)│                     │
             │  │ Porta interna: 8000 (Sem bind)│                     │
             │  └───────────────┬───────────────┘                     │
             └──────────────────┼─────────────────────────────────────┘
                                │
                                ▼ [ Bind Mount ]
                       ./backend/data (Host UID 1000)
```

### Princípios Técnicos Aplicados

- **Arquitetura Same-Origin:** O frontend consome rotas relativas (`/api/...`). Não há chamadas diretas a subdomínios de API pelo navegador, eliminando problemas de CORS e simplificando o escopo de cookies `SameSite=Lax`.
- **Isolamento de Contêineres:** O container do backend não publica portas no host (`8000/tcp` permanece restrita à rede interna `portfolio-net`); o container do frontend roda com filesystem `read_only: true`.
- **Resolução Defensiva de IP Real:** O backend lê `CF-Connecting-IP` / `X-Forwarded-For` somente quando o peer TCP pertence a `TRUSTED_PROXIES`, garantindo rate limiting e auditoria resistentes a *IP spoofing*.
- **Persistência Bind-Mount com Proteção de Produção:** `./backend/data` é montado em `/app/data` com UID/GID alinhado ao usuário do host (`PUID=1000` / `PGID=1000`, sem necessidade de `chmod 777`). Os arquivos vivos (`portfolio.json`, `portfolio_data.json`, `runtime_state.json` e `*.jsonl`) são ignorados pelo `.gitignore` para nunca serem sobrescritos em um `git pull`, sendo inicializados automaticamente no primeiro boot a partir dos templates `.example`.

---

## 3. Módulos e Recursos do Sistema

### 3.1 Interface do Usuário (Frontend)
- **Design System & Motion Coreografado:** Tipografia `Instrument Sans` + `JetBrains Mono` com `tabular-nums`, profundidade atmosférica com grid esmaecido e superfícies translúcidas, além de utilitários centralizados de animação em `motion.js` respeitando `prefers-reduced-motion`.
- **Navbar & Internacionalização Resiliente:** Indicadores deslizantes via `layoutId`, *drawer* móvel, *scroll spy* e tradução PT/EN via Google Website Translator (`googleTranslate.js`) sobre fonte única em português, acompanhada de patch defensivo de reconciliação DOM em `main.jsx` e blindagem `notranslate` no `/admin`.
- **Hero & Credenciais:** Entrada coreografada (`staggerChildren`), caricatura autoral (`hero_developer.png`) em moldura com inclinação 3D sutil e feixe de borda, CTAs diretos e barra de credenciais com iluminação reativa ao hover.
- **Matriz de Competências & Diagrama de Fluxo (`Skills`):** Diagrama SVG interativo (*ERPs/CRMs/APIs → Integração → Dados & IA → Governança*) sincronizado no hover com os 3 domínios arquiteturais, lista de entregas e `tags` dinâmicas lidas do JSON.
- **Timeline Interativa (`Experience`):** Linha guia preenchida conforme a rolagem, marcador luminoso, destaque deslizante entre experiências e expansão animada (`AnimatePresence`) do histórico completo.
- **Projetos & Modal de Especificação (`Projects`):** Abas de filtro derivadas dinamicamente das categorias cadastradas, grade uniforme em 2 colunas e modal condicional **Especificação** exibido quando o projeto possui detalhamento técnico (`architecture`).
- **Certificações (`Certifications`):** Credenciais oficiais com emissor, ano tabular, escopo da competência e link de verificação externa.
- **Assistente Conversacional (`ChatWidget`):** Painel discreto com sugestões rápidas, parser seguro de Markdown (negrito, listas, links externos, blocos de código copiáveis sem `dangerouslySetInnerHTML`) e fechamento por `Esc`.
- **Console de Governança (`/admin`):**
  - Autenticação protegida por **Cloudflare Turnstile** (container DOM isolado sem filhos React) e cookie `HttpOnly`.
  - Faixa tabular de KPIs reais (diálogos, `page_view`, latência média com status de SLA < 2.000 ms) integrada ao seletor de motor de resposta em runtime (`Gemini 1.5 Flash` ou `JSON Determinístico`).
  - Tabela de auditoria de diálogos com busca textual, filtro de violação de SLA, exportação JSON (padrão ISO 27001 / SIEM) e modal de expurgo LGPD (90 dias).
- **Editor Semântico de Conteúdo (`JsonEditor`):** Edição estruturada de `portfolio.json` (**Apresentação / Hero**, **Habilidades**, **Experiências**, **Projetos** com `architecture` e `tags`, **Certificações**) e de `portfolio_data.json` (base factual do RAG), com indicador de sincronização, download de backup e hierarquia visual focada em um único CTA primário (**Salvar alterações**).

### 3.2 Segurança, Backend e RAG
- **RAG Corporativo Econômico em Tokens:** Roteamento determinístico local em `json_only` (custo zero e latência sub-milissegundo) ou orquestração multi-provider (`gemini`, `openai`, `ollama`, `deepseek`) enviando ao prompt apenas as seções pertinentes de `portfolio_data.json`.
- **Validação Estrita de Contratos:** Schemas Pydantic V2 (`StrictModel` com `extra="forbid"` e limites de tamanho `ShortStr` / `MediumStr` / `LongStr`) bloqueiam *mass assignment* e payloads malformados antes da escrita em disco.
- **Autenticação & Anti-Timing Attack:** Cookie `admin_session` (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/admin`), comparação de usuário em tempo constante (`hmac.compare_digest`) e verificação `bcrypt` com sanitização de hashes escapados (`$$`).
- **Mascaramento Recursivo de PII & Auditoria CIM:** Logs estruturados em JSON com redação automática de CPFs, e-mails, tokens `Bearer`, hashes `bcrypt` e JWTs (LGPD Art. 6º, III), além de trilha dedicada `audit.file_write` (ISO 27001 A.12.4) e correlação por `X-Trace-ID` (`contextvars`).

---

## 4. Estrutura de Diretórios

```
meu-portfolio/
├── backend/
│   ├── core/
│   │   ├── config.py              # Carrega .env e expõe Settings (dataclass imutável)
│   │   ├── security.py            # JWT, sanitização de bcrypt e validação de cookie
│   │   ├── logging_config.py      # Formatação JSON, redação de PII e auditoria CIM
│   │   ├── proxy.py               # Resolução defensiva de IP real (CF-Connecting-IP)
│   │   ├── rate_limit.py          # Rate limiting em memória por janela deslizante
│   │   ├── security_headers.py    # CSP estrita na API, HSTS, X-Frame-Options DENY
│   │   ├── trace_context.py       # ContextVar para propagação assíncrona do Trace ID
│   │   └── trace_middleware.py    # Middleware injetor de X-Trace-ID
│   ├── routers/
│   │   ├── chat.py                # Endpoints públicos (/portfolio, /chat, /analytics/track)
│   │   └── admin.py               # Endpoints protegidos (/admin/*: login, KPIs, config, purge)
│   ├── services/
│   │   ├── config_repo.py         # Auto-seed, whitelist e escrita atômica (0664 + fsync)
│   │   ├── jsonl_store.py         # Append-only JSONL, métricas e expurgo de 90 dias
│   │   ├── llm.py                 # Recorte focado de contexto RAG e provedores LLM
│   │   └── runtime_state.py       # Persistência atômica do provedor ativo em runtime
│   ├── schemas/
│   │   └── portfolio.py           # Contratos Pydantic V2 estritos (extra='forbid')
│   ├── data/                      # Bind mount persistente (/app/data no container)
│   │   ├── portfolio.json.example      # Template versionado da vitrine pública
│   │   ├── portfolio_data.json.example # Template versionado da base factual do RAG
│   │   ├── portfolio.json              # [gitignored] Conteúdo ativo em produção
│   │   ├── portfolio_data.json         # [gitignored] Base RAG ativa em produção
│   │   ├── runtime_state.json          # [gitignored] Estado em runtime (intérprete ativo)
│   │   └── *.jsonl                     # [gitignored] Logs de chat e telemetria
│   ├── Dockerfile                 # Multi-stage Python 3.12-slim com usuário app (UID/GID 1000)
│   └── requirements.txt           # Dependências Python travadas
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Cabeçalho editorial, i18n, tema e scroll spy
│   │   │   ├── Hero.jsx           # Apresentação, caricatura emoldurada e barra de credenciais
│   │   │   ├── Skills.jsx         # Matriz arquitetural de 3 domínios, entregas e tags dinâmicas
│   │   │   ├── Experience.jsx     # Ledger cronológico tabular em 2 colunas
│   │   │   ├── Projects.jsx       # Projetos com abas dinâmicas e modal de especificação
│   │   │   ├── Certifications.jsx # Grade de certificações e verificação externa
│   │   │   ├── ChatWidget.jsx     # Assistente conversacional com parser seguro de Markdown
│   │   │   ├── AdminDashboard.jsx # Console de governança, Turnstile, KPIs e auditoria
│   │   │   └── JsonEditor.jsx     # Editor semântico do portfólio (Hero/Skills/Exp/Proj/Cert) e RAG
│   │   ├── utils/
│   │   │   ├── googleTranslate.js # Integração controlada com Google Website Translator
│   │   │   └── motion.js          # Curvas, variantes e presets compartilhados de Framer Motion
│   │   ├── App.jsx                # Orquestração de rotas (/ e /admin), tema e rodapé
│   │   ├── index.css              # Design system Obsidian Graphite / Technical Paper
│   │   └── main.jsx               # Bootstrap React + patch defensivo de reconciliação DOM
│   ├── public/
│   │   ├── images/
│   │   │   └── hero_developer.png # Ilustração autoral exibida no Hero
│   │   └── icon.ico               # Favicon
│   ├── nginx.conf                 # Proxy reverso /api/, compressão Gzip e headers SPA
│   ├── Dockerfile                 # Multi-stage Node 20 -> Nginx 1.27 Alpine
│   └── package.json
├── auditorias/
│   └── analise_detalhada_modulos.md # Dossiê técnico e auditoria detalhada dos módulos
├── docker-compose.yml             # Orquestração: backend + frontend + cloudflared
├── .env.example                   # Modelo documentado de variáveis de ambiente
├── .gitignore
└── README.md
```

---

## 5. Guia de Deploy em Produção (Servidor Ubuntu)

### Passo 5.1: Conectar ao Servidor e Clonar o Repositório
```bash
ssh christiansousadev@christianserver
cd ~
git clone https://github.com/christiansousadev/meu-portfolio.git
cd meu-portfolio
```

### Passo 5.2: Criar o Arquivo de Variáveis de Ambiente (`.env`)
```bash
cp .env.example .env
nano .env
```
Preencha com suas configurações de produção:

```env
# Ambiente
ENV=production

# JWT de Sessao (gere com: openssl rand -hex 32)
JWT_SECRET=sua_chave_jwt_secreta_aqui
JWT_EXPIRATION_MINUTES=60

# Porta local do frontend no host e alinhamento de UID/GID do bind mount
FRONTEND_PORT=8085
PUID=1000
PGID=1000

# Origens autorizadas para CORS
ALLOWED_ORIGINS=https://christiansousa.dev,http://localhost:8085,http://localhost:8081

# Proxies confiaveis (Docker + Loopback)
TRUSTED_PROXIES=127.0.0.1/32,172.16.0.0/12,10.0.0.0/8,192.168.0.0/16

# Cloudflare Tunnel & Turnstile
CLOUDFLARE_TUNNEL_TOKEN=seu_token_do_cloudflare_tunnel_aqui
TURNSTILE_SITE_KEY=sua_turnstile_site_key_aqui
TURNSTILE_SECRET_KEY=sua_turnstile_secret_key_aqui

# Interprete padrao de IA (json_only ou gemini)
ACTIVE_INTERPRETER=json_only
GEMINI_API_KEY=

# Credenciais Administrativas
# Recomendado em producao: hash bcrypt (gere com o comando abaixo).
# Caso definido direto no docker-compose.yml, escape cada '$' como '$$'; no arquivo .env mantenha simples entre aspas simples ou sem interpolacao.
ADMIN_USER=admin@christiansousa.dev
ADMIN_PASSWORD_HASH=
```

Para gerar o `ADMIN_PASSWORD_HASH` com segurança:
```bash
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('SUA_SENHA_FORTE'))"
```
*(Em desenvolvimento ou migração inicial, `config.py` também aceita `ADMIN_PASSWORD` como fallback, convertendo-a em hash em memória na inicialização).*

### Passo 5.3: Obter e Configurar a Chave do Google Gemini (Opcional)
1. Gere uma chave no [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Edite `~/meu-portfolio/.env` e preencha `GEMINI_API_KEY=AIzaSy...`.
3. Reinicie apenas o backend:
   ```bash
   docker compose restart backend
   ```
*(A alternância entre `Gemini 1.5 Flash` e `JSON Determinístico` pode ser feita em tempo real em `/admin`).*

### Passo 5.4: Ajustar Propriedade e Permissões de `backend/data` (Sem `chmod 777`)
O container `portfolio-backend` executa sob o usuário não-root `app` alinhado a `PUID:PGID` (padrão `1000:1000`). Garanta que a pasta `backend/data` pertença ao seu usuário Linux no host:
```bash
sudo chown -R $(id -u):$(id -g) backend/data && chmod -R 775 backend/data
```
*(Se `id -u` no seu servidor retornar um valor diferente de `1000`, defina `PUID` e `PGID` correspondentes no `.env`).*

### Passo 5.5: Subir a Stack Completa
```bash
docker compose up -d --build
```

### Passo 5.6: Verificar Status dos Containers
```bash
docker compose ps
```
Os 3 serviços devem operar saudáveis:
- `portfolio-backend` (`Up (healthy)`)
- `portfolio-frontend` (`Up`)
- `portfolio-cloudflared` (`Up`)

---

## 6. Configuração no Painel Cloudflare (Zero Trust)

1. No painel da Cloudflare, acesse **Zero Trust** → **Networks** → **Tunnels**.
2. Selecione o túnel correspondente ao `CLOUDFLARE_TUNNEL_TOKEN`.
3. Em **Public Hostnames**, aponte o domínio público para o Nginx interno da rede Docker:
   - **Public Hostname:** `christiansousa.dev`
   - **Service Type:** `HTTP`
   - **URL:** `frontend:80`

---

## 7. Fluxo de Atualização e Manutenção no Servidor Linux

### 7.1 Atualização Padrão (Após `git push`)
```bash
cd ~/meu-portfolio && git pull origin main && docker compose up -d --build
```
> **Nota importante:** Como `backend/data/portfolio.json` e `backend/data/portfolio_data.json` estão protegidos no `.gitignore`, o `git pull` atualiza o código e os templates `.example` **sem apagar** os textos e projetos que você já cadastrou em produção.

### 7.2 Sincronização Forçada em Caso de `divergent branches`
```bash
cd ~/meu-portfolio && git fetch origin main && git reset --hard origin/main && docker compose up -d --build
```

### 7.3 Rebuild Limpo Sem Cache
```bash
cd ~/meu-portfolio && docker compose build --no-cache frontend backend && docker compose up -d
```

### 7.4 Recarregar Apenas Variáveis do `.env`
```bash
nano ~/meu-portfolio/.env
docker compose restart backend      # alterações de IA, JWT, Turnstile ou credenciais
docker compose restart cloudflared  # alteração de CLOUDFLARE_TUNNEL_TOKEN
```

### 7.5 Monitoramento e Limpeza
```bash
docker compose ps
docker compose logs -f --tail=50
docker compose logs -f backend
docker image prune -f
```

### 7.6 Solução do Erro `Erro de permissão ao gravar em backend/data`
Caso o painel `/admin` exiba erro de permissão ao salvar configurações, isso indica divergência de UID/GID entre arquivos antigos em `backend/data` no host e o usuário não-root do container. Nunca utilize `chmod 777`; corrija de forma segura executando no servidor:
```bash
cd ~/meu-portfolio
sudo chown -R $(id -u):$(id -g) backend/data
chmod -R 775 backend/data
PUID=$(id -u) PGID=$(id -g) docker compose up -d --build backend
```

### 💡 Atalho Recomendado (Alias no `.bashrc`)
```bash
echo "alias atualizar-portfolio='cd ~/meu-portfolio && git pull origin main && PUID=\$(id -u) PGID=\$(id -g) docker compose up -d --build'" >> ~/.bashrc
source ~/.bashrc
```

---

## 8. Execução em Desenvolvimento Local

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate          # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:5173` (o Vite encaminha `/api/` para `http://localhost:8000` via `vite.config.js`).

---

## 9. Tabela de Endpoints da API

### Rotas Públicas
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/portfolio` | Retorna os dados do portfólio (`portfolio.json`) para hidratação da SPA |
| `POST` | `/api/chat` | Processa pergunta do visitante via modo determinístico local ou LLM/RAG |
| `POST` | `/api/analytics/track` | Registra evento de telemetria (`page_view`) |

### Rotas Administrativas (Protegidas por Cookie `admin_session`)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/turnstile-key` | Retorna a Site Key pública do Cloudflare Turnstile |
| `POST` | `/api/admin/login` | Valida credenciais + Turnstile e emite cookie `HttpOnly` |
| `POST` | `/api/admin/logout` | Remove o cookie de sessão administrativa |
| `GET` | `/api/admin/stats` | Retorna KPIs consolidados, eventos recentes e intérprete ativo |
| `GET` | `/api/admin/logs` | Retorna os últimos 100 diálogos registrados do assistente |
| `GET` | `/api/admin/interpreter` | Consulta o motor de resposta ativo em runtime |
| `POST` | `/api/admin/interpreter` | Alterna em runtime o motor ativo (`gemini`, `json_only`, etc.) |
| `GET` | `/api/admin/config?filename=...` | Lê `portfolio.json` ou `portfolio_data.json` |
| `POST` | `/api/admin/config` | Valida via Pydantic estrito e grava atomicamente com auditoria CIM |
| `POST` | `/api/admin/retention/purge` | Expurga registros de chat e telemetria anteriores a 90 dias (LGPD) |

---

## 10. Matriz de Segurança e Conformidade

| Domínio | Mecanismo Implementado | Referência / Norma |
|---|---|---|
| **Borda e Anti-DDoS** | Cloudflare Tunnel sem portas públicas expostas no host | Cloudflare Zero Trust |
| **Proteção Anti-Bot** | Cloudflare Turnstile validado server-side no login administrativo | OWASP Automated Threats (OAT-009) |
| **Sessão Administrativa** | Cookie `HttpOnly` + `Secure` + `SameSite=Lax` restrito a `/api/admin` | OWASP Session Management |
| **Mitigação de Timing** | Comparação constante via `hmac.compare_digest` + hash `bcrypt` | OWASP Timing Attacks |
| **Proteção de Origem** | Leitura de `CF-Connecting-IP` restrita a CIDRs em `TRUSTED_PROXIES` | Anti-IP Spoofing |
| **Controle de Abuso** | Rate Limiting Sliding Window (5 req/min login, 10 req/min chat) | OWASP Anti-Brute Force |
| **Headers HTTP** | CSP `default-src 'none'` na API, HSTS, `X-Frame-Options: DENY` | OWASP Secure Headers |
| **Privacidade de Dados** | Redação recursiva de PII (CPF, e-mail, Bearer, JWT, bcrypt) nos logs | LGPD Art. 6º, III (Minimização) |
| **Rastreabilidade** | Correlação ponta a ponta via `X-Trace-ID` (UUID4 + `contextvars`) | ISO 27001 A.12.4 |
| **Auditoria de Mudança** | Eventos `audit.file_write` padronizados em toda gravação administrativa | ITIL Change Management |
| **Ciclo de Vida de Dados** | Expurgo atômico de registros acima da janela de 90 dias | LGPD Descarte Seguro |
| **Integridade de Disco** | Escrita atômica (`NamedTemporaryFile` + `fsync` + `0664` + `replace`) | Proteção contra corrupção |
| **Isolamento de SO** | Backend não-root alinhado por `PUID:PGID` (`1000:1000`) e Nginx `read_only` | CIS Docker Benchmark |

---

## 11. Contato e Links Oficiais

- **Portfólio Oficial:** [https://christiansousa.dev](https://christiansousa.dev)
- **LinkedIn:** [linkedin.com/in/christiansousasilva](https://www.linkedin.com/in/christiansousasilva/)
- **GitHub:** [github.com/christiansousadev](https://github.com/christiansousadev)
- **E-mail:** [christiansousadev@gmail.com](mailto:christiansousadev@gmail.com)

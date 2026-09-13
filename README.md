# Christian Sousa | Software Engineer & Governança de TI

Plataforma fullstack de alta performance e segurança corporativa desenvolvida com **React 18 + Vite** e **Python 3.12 + FastAPI**, orquestrada em **Docker Compose**, integrada a **Cloudflare Tunnel (Zero Trust)** e protegida por **Cloudflare Turnstile**.

🌐 **Ambiente de Produção:** [https://christiansousa.dev](https://christiansousa.dev)

---

## 1. Visão Geral e Pilares do Projeto

O sistema opera como portfólio profissional e vitrine técnica de engenharia de software e governança de TI. A solução combina uma interface executiva pública de alto padrão estético (*Glassmorphism 2.0* com iluminação ambiente *aurora glow*) com um assistente conversacional corporativo (**RAG com IA**) e um ambiente administrativo restrito de governança (`/admin`) para gestão de configurações e telemetria em tempo real.

```
+-----------------------------------------------------------------------------------------+
|                                    PILAREs ARQUITETURAIS                                |
+-----------------------------+-----------------------------+-----------------------------+
|    SAME-ORIGIN DOCKER       |     ZERO TRUST TUNNEL       |   GOVERNANÇA & LGPD NATIVA  |
| Sem CORS · Sem subdomínios  | Sem portas abertas no host  | Redação de PII · 90d Purge  |
| Nginx roteia / e /api/      | Borda Cloudflare + Turnstile| Trilha CIM · Fsync atômico  |
+-----------------------------+-----------------------------+-----------------------------+
```

### Tecnologias Centrais

| Camada | Tecnologia | Função no Sistema |
|---|---|---|
| **Frontend** | React 18, Vite 5, Framer Motion, Lucide Icons | SPA com design system corporativo, timeline vertical, modal de arquitetura e dashboard de auditoria |
| **Borda / Edge** | Cloudflare Tunnel (`cloudflared`) & Cloudflare Turnstile | Tunelamento criptografado outbound, terminação TLS 1.3, mitigação DDoS e proteção antibot |
| **Proxy / Servidor Web**| Nginx 1.27 Alpine | Proxy reverso interno `/api/`, compressão Gzip, cache de assets estáticos e SPA fallback |
| **Backend API** | Python 3.12, FastAPI, Uvicorn | API REST assíncrona, autenticação por cookie HttpOnly, rate limiting e middlewares defensivos |
| **IA & RAG Corporativo**| Gemini 1.5 Flash, Ollama, OpenAI, DeepSeek | Assistente conversacional com recorte focado de contexto (RAG local econômico em tokens) |
| **Persistência de Dados**| JSON & JSONL em bind mount (`backend/data`) | Armazenamento leve e atômico sem dependência de banco de dados relacional pesado |

---

## 2. Topologia de Rede e Fluxo Operacional

A infraestrutura foi desenhada sob o paradigma **Zero Port Exposure**: o servidor não precisa ter portas `80` ou `443` abertas no roteador ou firewall. Toda a comunicação externa trafega de dentro para fora através do Cloudflare Tunnel.

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
             │  │ (FastAPI / Uvicorn)           │                     │
             │  │ Porta interna: 8000 (Sem bind)│                     │
             │  └───────────────┬───────────────┘                     │
             └──────────────────┼─────────────────────────────────────┘
                                │
                                ▼ [ Bind Mount ]
                       ./backend/data (Host)
```

### Princípios Técnicos Aplicados

- **Arquitetura Same-Origin:** O frontend consome rotas relativas (`/api/...`). Não há chamadas a origens externas pelo navegador, eliminando problemas de CORS e complexidade de certificados em subdomínios.
- **Isolamento de Contêineres:** O container do backend não publica portas no host da máquina (`8000/tcp` opera restrita à rede `portfolio-net`).
- **Resolução de IP Real com Cloudflare:** O backend mapeia o cabeçalho `CF-Connecting-IP` validando se a requisição originou-se de um proxy confiável (`TRUSTED_PROXIES`), permitindo rate limiting preciso e logs de auditoria fidedignos.
- **Persistência Bind-Mount:** O diretório `./backend/data` é montado em `/app/data`. Alterações salvas no painel administrativo gravam diretamente nos arquivos físicos do servidor, facilitando backups e versionamento no Git.

---

## 3. Módulos e Recursos do Sistema

### 3.1 Interface do Usuário (Frontend)
- **Design System Glassmorphism 2.0:** Tipografia moderna (**Plus Jakarta Sans** e **JetBrains Mono**), iluminação ambiente *aurora glow*, barra de leitura no topo (`scroll-progress-bar`) e botão retrátil de retorno ao topo.
- **Navbar Responsiva:** Menu *drawer* móvel, seletor de internacionalização (PT/EN), chaveador de tema claro/escuro e indicador de seção ativa (*scroll spy*) animado com Framer Motion.
- **Hero & Disponibilidade:** Badge pulsante de disponibilidade profissional, ticker dinâmico de especialidades e cards com métricas de impacto corporativo.
- **Skills Categorizadas:** Filtros interativos (*Fullstack & APIs*, *Dados & IA*, *Governança & Cloud*) com badges dinâmicas.
- **Timeline de Experiências:** Linha do tempo executiva vertical com marcadores luminosos e botão expansível para visualização da trajetória completa.
- **Projetos com Modal de Arquitetura:** Cards filtráveis com links diretos de repositório e modal embutido detalhando arquitetura técnica, desafios e resultados.
- **Vitrine de Certificações Oficiais:** Destaque para **ITIL® 4 Foundation in IT Service Management (Axelos)**, **ISO/IEC 27001 & LGPD**, **Arquitetura Python & Microsserviços** e **Metodologias Ágeis**.
- **Assistente IA (ChatWidget):** Chatbot flutuante com chips de perguntas rápidas (*Quick Chips*), renderização completa de Markdown (negrito, listas) e blocos de código com botão de cópia com 1 clique.
- **Dashboard de Governança 2.0 (`/admin`):**
  - Desafio antibot via **Cloudflare Turnstile** no formulário de login.
  - Cartões de KPIs com gráficos **Sparklines em SVG puro**.
  - Histórico de diálogos com busca em tempo real e filtro de estouro de SLA (> 2000ms).
  - Botão de **Exportar Relatório de Auditoria em JSON** para conformidade e ingestão SIEM.
  - Modal defensivo para expurgo de dados de retenção LGPD (90 dias).
- **Editor Semântico JSON (`JsonEditor`):** Formulário interativo para editar em tempo real o portfólio e a base factual de conhecimento do RAG sem precisar editar código.

### 3.2 Segurança, Backend e RAG
- **RAG Corporativo Multi-Provider:** Casamento determinístico por palavras-chave (custo zero e resposta imediata) com transição suave para Gemini 1.5 Flash, Ollama, OpenAI ou DeepSeek. O recorte semântico anexa ao prompt apenas as seções do JSON necessárias para responder à dúvida.
- **Autenticação Segura:** Cookie de sessão `admin_session` HttpOnly, Secure e SameSite=Lax restrito a `/api/admin`, mitigando vulnerabilidades de XSS e vazamento de tokens em `localStorage`.
- **Validação de Senha em Tempo Constante:** Prevenção contra *timing attacks* via `hmac.compare_digest` e validação com bcrypt sanitizado contra interpolações de `$$`.
- **Mascaramento Automático de PII:** Serialização de logs em formato JSON Lines com redação recursiva de CPFs, e-mails, tokens Bearer, senhas e chaves JWT (LGPD Art. 6º, III).
- **Trilha de Auditoria CIM:** Gravação padronizada de eventos de mutação de arquivo para conformidade com a norma ISO 27001 A.12.4 e ITIL Change Management.
- **Rastreabilidade Ponta a Ponta:** Injeção de `X-Trace-ID` (UUID4) em todas as requisições e respostas, propagado de forma assíncrona via `contextvars`.

---

## 4. Estrutura de Diretórios

```
meu-portfolio/
├── backend/
│   ├── core/
│   │   ├── config.py              # Carrega .env e expõe Settings (dataclass imutável)
│   │   ├── security.py            # JWT, sanitização de bcrypt e validação de cookie
│   │   ├── logging_config.py      # Formatação JSON, redação de PII e log de auditoria CIM
│   │   ├── proxy.py               # Resolução defensiva de IP real (CF-Connecting-IP)
│   │   ├── rate_limit.py          # Limitação de taxa em memória por janela deslizante
│   │   ├── security_headers.py    # Injeção de CSP estrita, HSTS, X-Frame-Options
│   │   ├── trace_context.py       # ContextVar para propagação assíncrona do Trace ID
│   │   └── trace_middleware.py    # Middleware injetor de X-Trace-ID
│   ├── routers/
│   │   ├── chat.py                # Endpoints públicos (/portfolio, /chat, /analytics/track)
│   │   └── admin.py               # Endpoints protegidos (/admin/*: login com Turnstile, KPIs, configs, purge)
│   ├── services/
│   │   ├── config_repo.py         # Leitura/escrita atômica em disco com checagem de Path Traversal
│   │   ├── jsonl_store.py         # Append-only com fsync, agregações e purga de 90 dias
│   │   ├── llm.py                 # Orquestração do RAG focado e provedores de IA
│   │   └── runtime_state.py       # Gerenciamento de estado em runtime (intérprete ativo)
│   ├── schemas/
│   │   └── portfolio.py           # Modelos Pydantic V2 estritos (extra='forbid', validações de tamanho)
│   ├── data/                      # Diretório compartilhado (bind mount persistente)
│   │   ├── portfolio.json         # Conteúdo público bilíngue do portfólio
│   │   └── portfolio_data.json    # Base factual estruturada consumida pelo RAG
│   ├── Dockerfile                 # Multi-stage build com usuário não-root e healthcheck
│   └── requirements.txt           # Dependências Python travadas
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Menu com drawer móvel, i18n, tema e scroll spy
│   │   │   ├── Hero.jsx           # Apresentação, ticker de papéis e métricas
│   │   │   ├── Skills.jsx         # Competências categorizadas com badges animadas
│   │   │   ├── Experience.jsx     # Timeline executiva vertical com expansão
│   │   │   ├── Projects.jsx       # Vitrine de projetos com filtros e modal arquitetural
│   │   │   ├── Certifications.jsx # Credenciais corporativas (ITIL 4, ISO 27001, etc.)
│   │   │   ├── ChatWidget.jsx     # Chat flutuante com Markdown, Quick Chips e cópia
│   │   │   ├── AdminDashboard.jsx # Painel de governança com Turnstile, KPIs e export JSON
│   │   │   └── JsonEditor.jsx     # Editor visual dos arquivos JSON
│   │   ├── App.jsx                # Layout mestre, scroll progress bar e footer
│   │   ├── index.css              # Glassmorphism 2.0, variáveis e utilitários
│   │   └── main.jsx               # Ponto de entrada React
│   ├── public/
│   │   └── icon.ico               # Favicon
│   ├── nginx.conf                 # Configuração de proxy reverso /api/ e compressão Gzip
│   ├── Dockerfile                 # Multi-stage Node 20 -> Nginx 1.27 Alpine (~25MB)
│   └── package.json
├── auditorias/
│   └── analise_detalhada_modulos.md # Laudo técnico de auditoria e arquitetura detalhada
├── docker-compose.yml             # Orquestração: backend + frontend + cloudflared
├── .env.example                   # Modelo documentado de variáveis de ambiente
├── .gitignore
└── README.md
```

---

## 5. Guia de Deploy em Produção (Servidor Ubuntu)

Abaixo estão os passos completos para configurar e rodar o projeto em um servidor Ubuntu (ex.: `christiansousadev@christianserver:~$`).

### Passo 5.1: Conectar ao Servidor e Clonar o Repositório
```bash
ssh christiansousadev@christianserver
cd ~
git clone https://github.com/christiansousadev/meu-portfolio.git
cd meu-portfolio
```

### Passo 5.2: Criar o Arquivo de Variáveis de Ambiente (`.env`)
```bash
nano .env
```
Preencha com suas configurações de produção:

```env
# Ambiente
ENV=production

# JWT de Sessao (gere uma chave aleatoria se desejar: openssl rand -hex 32)
JWT_SECRET=sua_chave_jwt_secreta_aqui
JWT_EXPIRATION_MINUTES=60

# Porta do frontend no host (caso a 8081 ja esteja ocupada por outro container)
FRONTEND_PORT=8085

# Origens autorizadas para CORS
ALLOWED_ORIGINS=https://christiansousa.dev,http://localhost:8085,http://localhost:8081

# Proxies confiaveis (Docker + Loopback)
TRUSTED_PROXIES=127.0.0.1/32,172.16.0.0/12,10.0.0.0/8,192.168.0.0/16

# Token do Cloudflare Tunnel (obtenha no Cloudflare Zero Trust)
CLOUDFLARE_TUNNEL_TOKEN=seu_token_do_cloudflare_tunnel_aqui

# Credenciais do Cloudflare Turnstile (obtenha no Cloudflare Turnstile)
TURNSTILE_SITE_KEY=sua_turnstile_site_key_aqui
TURNSTILE_SECRET_KEY=sua_turnstile_secret_key_aqui

# Interprete padrao de IA (json_only ou gemini)
ACTIVE_INTERPRETER=json_only
GEMINI_API_KEY=

# Credenciais Administrativas
ADMIN_USER=admin@seudominio.com
ADMIN_PASSWORD=sua_senha_segura_aqui
```
*(Salve com `Ctrl + O`, `Enter` e saia com `Ctrl + X`)*.

### Passo 5.3: Obter e Configurar a Chave da IA Google Gemini (Gratuito)

O sistema suporta tanto o modo **JSON Local (custo zero)** quanto o **Google Gemini 1.5 Flash (RAG focado)**. Para ativar o Gemini:

1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey) com sua conta Google.
2. Clique no botão azul **"Create API key"** (ou "Get API key").
3. Copie a chave gerada (inicia com `AIzaSy...`).
4. No servidor, edite o `.env`:
   ```bash
   nano ~/meu-portfolio/.env
   ```
5. Preencha o campo:
   ```env
   GEMINI_API_KEY=AIzaSySuaChaveAqui
   ```
6. Salve (`Ctrl + O`, `Enter`, `Ctrl + X`) e recarregue o backend:
   ```bash
   docker compose restart backend
   ```
*(Você pode ligar ou desligar o Gemini com 1 clique a qualquer momento no Painel Admin em `/admin`)*.

### Passo 5.4: Ajustar Permissões de Dados
Para permitir que o container backend consiga salvar telemetria e arquivos de configuração:
```bash
chmod -R 775 backend/data
```

### Passo 5.5: Subir a Stack Completa
```bash
docker compose up -d --build
```

### Passo 5.6: Verificar Status dos Containers
```bash
docker compose ps
```
Você verá os 3 containers com status `Up (healthy)`:
- `portfolio-backend`
- `portfolio-frontend`
- `portfolio-cloudflared`

---

## 6. Configuração no Painel Cloudflare (Zero Trust)

1. Acesse o painel da Cloudflare: **Zero Trust** → **Networks** → **Tunnels**.
2. Selecione o túnel associado ao seu token.
3. Na aba **Public Hostnames**, adicione ou edite o domínio:
   - **Public Hostname:** `christiansousa.dev`
   - **Service Type:** `HTTP`
   - **URL:** `frontend:80`
   *(Como o container `cloudflared` está na mesma rede Docker `portfolio-net`, ele acessa o container `frontend` na porta 80 internamente)*.

---

## 7. Fluxo de Atualização no Servidor Linux (Após cada `git push`)

Sempre que você fizer alterações no código no seu computador local e enviar para o GitHub (`git push`), siga as instruções abaixo para atualizar a aplicação no seu servidor Ubuntu (`christianserver`).

### 7.1 Comando Rápido Padrão (Após qualquer `git push`)

Acesse o terminal do servidor Linux e execute:

```bash
cd ~/meu-portfolio && git pull origin main && docker compose up -d --build
```

> [!TIP]
> O Docker utiliza compilação em camadas (*build cache*). Apenas os arquivos modificados serão recompilados (ex.: bundle Vite do frontend em ~3 segundos), recarregando os containers sem derrubar o ambiente.

---

### 7.2 O que fazer se o `git pull` der erro de divergência (`divergent branches`)

Se o histórico remoto no GitHub tiver sido sincronizado ou reescrito e o `git pull` falhar com:
`fatal: Need to specify how to reconcile divergent branches.`

Execute este comando seguro que alinha os arquivos com o GitHub **sem apagar seu `.env`** (pois o `.env` é protegido pelo `.gitignore`):

```bash
cd ~/meu-portfolio && git fetch origin main && git reset --hard origin/main && docker compose up -d --build
```

---

### 7.3 Como Forçar Reconstrução Limpa Sem Cache (Quando a UI não atualizar)

Caso você tenha feito alterações no frontend ou backend e queira garantir que o Docker não use camadas antigas de cache:

```bash
cd ~/meu-portfolio && docker compose build --no-cache frontend backend && docker compose up -d
```

---

### 7.4 Como Atualizar Apenas Variáveis de Ambiente (`.env`)

Sempre que você alterar tokens, chaves da Gemini ou credenciais no `.env`, **não é necessário recompilar**:

```bash
# 1. Edite o arquivo
nano ~/meu-portfolio/.env

# 2. Reinicie apenas os serviços afetados
docker compose restart backend   # se alterou GEMINI_API_KEY, ADMIN_USER, etc.
docker compose restart cloudflared # se alterou CLOUDFLARE_TUNNEL_TOKEN
```

---

### 7.5 Diagnóstico e Monitoramento de Containers

```bash
# Verificar se todos os 3 containers estão saudáveis (Up)
docker compose ps

# Acompanhar logs em tempo real de toda a stack
docker compose logs -f --tail=50

# Acompanhar logs de um container específico
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f cloudflared

# Limpar imagens órfãs de builds antigos para liberar espaço em disco
docker image prune -f
```

---

### 💡 Dica de Produtividade: Criando um Atalho (Alias) no Linux

Para atualizar seu portfólio digitando apenas uma única palavra no terminal:

1. Abra o arquivo de aliases do seu usuário:
   ```bash
   echo "alias atualizar-portfolio='cd ~/meu-portfolio && git pull origin main && docker compose up -d --build'" >> ~/.bashrc
   ```
2. Recarregue as configurações do shell:
   ```bash
   source ~/.bashrc
   ```
3. Pronto! Nas próximas vezes, basta entrar no servidor e digitar:
   ```bash
   atualizar-portfolio
   ```

---

## 8. Execução em Desenvolvimento Local

Caso deseje rodar a aplicação localmente sem Docker:

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:5173`. O Vite possui proxy reverso configurado em `vite.config.js` repassando `/api/` para `http://localhost:8000`.

---

## 9. Tabela de Endpoints da API

### Rotas Públicas
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/portfolio` | Retorna os dados completos do portfólio para hidratação da UI |
| `POST` | `/api/chat` | Processa mensagem do visitante via RAG corporativo / LLM |
| `POST` | `/api/analytics/track` | Registra evento de visualização de página (`page_view`) |

### Rotas Administrativas (Protegidas por Cookie `admin_session`)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/turnstile-key` | Retorna dinamicamente a Site Key pública do Cloudflare Turnstile |
| `POST` | `/api/admin/login` | Valida credencial + **Cloudflare Turnstile** e emite cookie HttpOnly |
| `POST` | `/api/admin/logout` | Invalida a sessão e remove o cookie do navegador |
| `GET` | `/api/admin/stats` | Retorna agregação de KPIs, telemetria e status do intérprete ativo |
| `GET` | `/api/admin/logs` | Retorna os últimos 100 registros de diálogos do assistente |
| `GET` | `/api/admin/interpreter` | Retorna o provedor de IA atualmente ativo em runtime |
| `POST` | `/api/admin/interpreter` | Altera em runtime o provedor ativo (`gemini` ou `json_only`) |
| `GET` | `/api/admin/config?filename=...` | Lê o arquivo de configuração cru (`portfolio.json` ou `portfolio_data.json`) |
| `POST` | `/api/admin/config` | Grava arquivo com validação estrita Pydantic e escrita atômica |
| `POST` | `/api/admin/retention/purge` | Dispara expurgo seguro de registros anteriores a 90 dias (LGPD) |

---

## 10. Matriz de Segurança e Conformidade

| Domínio | Mecanismo Implementado | Referência / Norma |
|---|---|---|
| **Borda e Anti-DDoS** | Cloudflare Tunnel com zero portas de entrada expostas no firewall | Cloudflare Zero Trust |
| **Proteção Anti-Bot** | Cloudflare Turnstile obrigatório no login administrativo | OWASP Automated Threats (OAT-009) |
| **Sessão Administrativa**| Cookie HttpOnly + Secure + SameSite=Lax restrito a `/api/admin` | OWASP Session Management |
| **Mitigação de Timing** | Validação de credenciais via `hmac.compare_digest` e bcrypt | OWASP Timing Attacks |
| **Proteção de Origem** | Mapeamento de `CF-Connecting-IP` e restrição estrita de `TRUSTED_PROXIES` | Anti-IP Spoofing |
| **Controle de Abuso** | Rate Limiting em memória por Sliding Window (5 req/min no login) | OWASP Anti-Brute Force |
| **Headers HTTP** | CSP estrita (`default-src 'none'`), HSTS, X-Frame-Options DENY | OWASP Secure Headers |
| **Privacidade de Dados**| Mascaramento recursivo de PII (CPF, e-mails, tokens, hashes) em logs | LGPD Art. 6º, III (Minimização) |
| **Rastreabilidade** | Injeção de `X-Trace-ID` (UUID4) propagado em logs e headers | ISO 27001 A.12.4 |
| **Auditoria de Mudança**| Registro estruturado de escrita em arquivo no padrão CIM | ITIL Change Management |
| **Ciclo de Vida de Dados**| Expurgos periódicos de logs acima da janela de 90 dias | LGPD Descarte Seguro |
| **Integridade de Disco**| Escrita atômica em dois passos (`tempfile` + `fsync` + `replace`) | Proteção contra corrupção |
| **Isolamento de SO** | Contêiner executando como usuário `app` (não-root) e Nginx `read_only` | CIS Docker Benchmark |

---

## 11. Contato e Links Oficiais

- **Portfólio Oficial:** [https://christiansousa.dev](https://christiansousa.dev)
- **LinkedIn:** [linkedin.com/in/christiansousasilva](https://www.linkedin.com/in/christiansousasilva/)
- **GitHub:** [github.com/christiansousadev](https://github.com/christiansousadev)
- **E-mail:** [christiansousadev@gmail.com](mailto:christiansousadev@gmail.com)

---

Desenvolvido com foco em **Alta Resiliência**, **Governança de TI** e **Excelência Arquitetural**.

// frontend/src/components/SkillsArchitectureCanvas.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Workflow,
  Cpu,
  Database,
  Sparkles,
  ShieldCheck,
  Boxes,
  Terminal,
  Activity,
  CheckCircle2,
  Lock,
  Layers,
  RefreshCw,
  Zap,
} from "lucide-react";

// Definição dos nós da arquitetura real do Christian (FastAPI, n8n, Postgres, RAG, Docker, Governança)
const NODES = [
  {
    id: "trigger",
    title: "Webhooks & APIs",
    tech: "HTTP Triggers / ERPs",
    tag: "Entrada de Eventos",
    color: "#38BDF8", // Sky blue
    icon: Zap,
    metrics: "Latência < 20ms",
    description: "Recepção de eventos em tempo real a partir de ERPs, CRMs contábeis e APIs de parceiros via webhooks autenticados.",
  },
  {
    id: "orchestrator",
    title: "n8n Automation",
    tech: "Workflow Engine",
    tag: "Orquestração Ativa",
    color: "#FF6D5A", // n8n Coral
    icon: Workflow,
    metrics: "140+ Workflows Ativos",
    description: "Pipelines de integração resilientes conectando sistemas legados, filas assíncronas e tratamento estruturado de exceções.",
  },
  {
    id: "backend",
    title: "Python & FastAPI",
    tech: "Core Microservices",
    tag: "Processamento Assíncrono",
    color: "#009688", // FastAPI Teal
    icon: Cpu,
    metrics: "Uvicorn Async · 99.98%",
    description: "Serviços escaláveis em Python 3.11, validação tipada com Pydantic v2 e endpoints REST de alta performance.",
  },
  {
    id: "data",
    title: "PostgreSQL & BI",
    tech: "Database & Metabase",
    tag: "Modelagem & Analytics",
    color: "#336791", // Postgres Blue
    icon: Database,
    metrics: "CTEs Otimizadas · ACID",
    description: "Consultas analíticas complexas, índices eficientes e dashboards interativos no Metabase para suporte a tomada de decisão.",
  },
  {
    id: "ai",
    title: "RAG & LLM Engine",
    tech: "Embeddings / IA",
    tag: "Inteligência Operacional",
    color: "#8B5CF6", // Purple Neon
    icon: Sparkles,
    metrics: "Cosine Sim: 0.94",
    description: "Extração semântica com busca vetorial, recuperação em bases documentais e orquestração de prompts estruturados.",
  },
];

const GOVERNANCE_ITEMS = [
  {
    title: "ITIL® 4 Foundation",
    category: "Governança de Serviços",
    status: "Certificado & Ativo",
    desc: "Gestão orientada a valor: ciclo de vida de incidentes, requisições, mudanças e melhoria contínua de TI.",
    icon: ShieldCheck,
    color: "#10B981",
  },
  {
    title: "ISO/IEC 27001 & LGPD",
    category: "Segurança & Conformidade",
    status: "Auditoria Contínua",
    desc: "Princípios de confidencialidade, integridade e disponibilidade. Tratamento rigoroso de dados sensíveis e auditoria.",
    icon: Lock,
    color: "#3B82F6",
  },
  {
    title: "Docker & Linux Servers",
    category: "Infraestrutura & Deploy",
    status: "Containerizado",
    desc: "Ambientes isolados e reproduzíveis em Ubuntu/Debian, Nginx reverse proxy e deploy automatizado via Git.",
    icon: Boxes,
    color: "#06B6D4",
  },
  {
    title: "SLAs & Observabilidade",
    category: "Métricas Operacionais",
    status: "99.98% Uptime",
    desc: "Monitoramento proativo de disponibilidade, alertas automáticos e tempo de resposta otimizado para operações críticas.",
    icon: Activity,
    color: "#F59E0B",
  },
];

const INITIAL_LOGS = [
  { time: "15:20:01", tag: "n8n", level: "info", msg: "Trigger: webhook_sync_contabil.json -> 200 OK" },
  { time: "15:20:02", tag: "FastAPI", level: "info", msg: "POST /api/v1/enrich-data duration: 16ms (Pydantic valid)" },
  { time: "15:20:02", tag: "Postgres", level: "success", msg: "Executed CTE query: 48 records synchronized" },
  { time: "15:20:03", tag: "Metabase", level: "info", msg: "Dashboard cache updated. Query latency: 8ms" },
  { time: "15:20:04", tag: "Gov-Audit", level: "success", msg: "ISO 27001 policy check: PASSED (encrypted in transit)" },
  { time: "15:20:05", tag: "RAG-LLM", level: "info", msg: "Vector search similarity: 0.942 | Context retrieved" },
];

export default function SkillsArchitectureCanvas() {
  const [activeTab, setActiveTab] = useState("pipeline"); // "pipeline" | "governance" | "logs"
  const [selectedNode, setSelectedNode] = useState(NODES[2]); // Default: FastAPI
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [pulseIndex, setPulseIndex] = useState(0);

  // Ciclo sutil de pulso pelos nós para dar vida ao diagrama sem ser intrusivo
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % NODES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="arch-canvas" role="region" aria-label="Painel de Arquitetura de Sistemas e Habilidades">
      {/* Topbar estilo janela de engenharia / Linear */}
      <div className="arch-canvas-topbar">
        <div className="arch-canvas-dots" aria-hidden="true">
          <span className="dot dot--red" />
          <span className="dot dot--yellow" />
          <span className="dot dot--green" />
        </div>

        <div className="arch-canvas-title">
          <span className="arch-canvas-mono">christian://arch-runtime.v2</span>
        </div>

        <div className="arch-canvas-status" title="Status dos serviços em tempo real">
          <span className="status-live-dot" />
          <span className="status-live-text">PROD READY</span>
        </div>
      </div>

      {/* Seletor de Modo de Exibição */}
      <div className="arch-canvas-nav">
        <button
          type="button"
          className={`arch-nav-btn ${activeTab === "pipeline" ? "active" : ""}`}
          onClick={() => setActiveTab("pipeline")}
        >
          <Workflow size={13} style={{ marginRight: 6 }} />
          Fluxo de Dados
        </button>
        <button
          type="button"
          className={`arch-nav-btn ${activeTab === "governance" ? "active" : ""}`}
          onClick={() => setActiveTab("governance")}
        >
          <ShieldCheck size={13} style={{ marginRight: 6 }} />
          Governança & Infra
        </button>
        <button
          type="button"
          className={`arch-nav-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <Terminal size={13} style={{ marginRight: 6 }} />
          Telemetria
        </button>
      </div>

      {/* Conteúdo Dinâmico Baseado na Aba Ativa */}
      <div className="arch-canvas-body">
        <AnimatePresence mode="wait">
          {activeTab === "pipeline" && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="arch-pipeline-view"
            >
              {/* Diagrama de Nós Interconectados */}
              <div className="arch-nodes-chain">
                {NODES.map((node, index) => {
                  const Icon = node.icon;
                  const isSelected = selectedNode.id === node.id;
                  const isPulsing = pulseIndex === index;

                  return (
                    <div key={node.id} className="arch-chain-step">
                      <button
                        type="button"
                        onClick={() => setSelectedNode(node)}
                        className={`arch-node-card ${isSelected ? "selected" : ""} ${isPulsing ? "pulsing" : ""}`}
                        style={{
                          "--node-accent": node.color,
                        }}
                      >
                        <div className="arch-node-header">
                          <div
                            className="arch-node-icon-box"
                            style={{ backgroundColor: `${node.color}18`, color: node.color }}
                          >
                            <Icon size={18} />
                          </div>
                          <span className="arch-node-tag">{node.tag}</span>
                        </div>

                        <div className="arch-node-body">
                          <div className="arch-node-title">{node.title}</div>
                          <div className="arch-node-tech">{node.tech}</div>
                        </div>

                        <div className="arch-node-footer">
                          <span className="arch-node-metric">{node.metrics}</span>
                        </div>
                      </button>

                      {/* Conector com indicador de fluxo animado entre nós */}
                      {index < NODES.length - 1 && (
                        <div className="arch-flow-connector" aria-hidden="true">
                          <div className="connector-line" />
                          <div className="connector-dot" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Inspetor Técnico do Nó Selecionado */}
              <div className="arch-inspector-box">
                <div className="arch-inspector-header">
                  <div className="arch-inspector-label">
                    <Layers size={13} style={{ marginRight: 6, color: selectedNode.color }} />
                    ESPECIFICAÇÃO DE ARQUITETURA: <strong>{selectedNode.title}</strong>
                  </div>
                  <span className="arch-inspector-badge" style={{ color: selectedNode.color }}>
                    {selectedNode.tech}
                  </span>
                </div>
                <p className="arch-inspector-desc">{selectedNode.description}</p>
                <div className="arch-inspector-metric-strip">
                  <span className="metric-pill">
                    <CheckCircle2 size={12} style={{ marginRight: 4, color: "#10B981" }} />
                    Produção Validada
                  </span>
                  <span className="metric-pill">
                    <Activity size={12} style={{ marginRight: 4, color: selectedNode.color }} />
                    {selectedNode.metrics}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "governance" && (
            <motion.div
              key="governance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="arch-gov-grid"
            >
              {GOVERNANCE_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="arch-gov-card">
                    <div className="arch-gov-header">
                      <div
                        className="arch-gov-icon"
                        style={{ backgroundColor: `${item.color}1A`, color: item.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="arch-gov-status">{item.status}</span>
                    </div>
                    <h3 className="arch-gov-title">{item.title}</h3>
                    <span className="arch-gov-cat">{item.category}</span>
                    <p className="arch-gov-desc">{item.desc}</p>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="arch-logs-terminal"
            >
              <div className="terminal-header">
                <span className="terminal-prompt">$</span> telemetry stream --follow --env=production
                <button
                  type="button"
                  className="terminal-refresh-btn"
                  onClick={() => {
                    const now = new Date().toTimeString().split(" ")[0];
                    setLogs((prev) => [
                      ...prev.slice(1),
                      {
                        time: now,
                        tag: "healthcheck",
                        level: "success",
                        msg: "All microservices & pipelines responding nominal (latency < 12ms)",
                      },
                    ]);
                  }}
                  title="Novo ciclo de ping"
                >
                  <RefreshCw size={11} style={{ marginRight: 4 }} /> Ping
                </button>
              </div>

              <div className="terminal-content">
                {logs.map((log, i) => (
                  <div key={i} className={`terminal-line terminal-line--${log.level}`}>
                    <span className="term-time">{log.time}</span>
                    <span className="term-tag">[{log.tag}]</span>
                    <span className="term-msg">{log.msg}</span>
                  </div>
                ))}
                <div className="terminal-cursor">
                  <span className="cursor-blink">_</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rodapé com garantia de engenharia e métricas consolidadas */}
      <div className="arch-canvas-footer">
        <div className="footer-metric">
          <span className="metric-label">Segurança:</span>
          <span className="metric-val">ISO 27001 Alinhado</span>
        </div>
        <div className="footer-metric">
          <span className="metric-label">Governança:</span>
          <span className="metric-val">ITIL® 4 Framework</span>
        </div>
        <div className="footer-metric">
          <span className="metric-label">Arquitetura:</span>
          <span className="metric-val">Microsserviços & Event-Driven</span>
        </div>
      </div>
    </div>
  );
}

// frontend/src/components/SkillsVectorDiagram.jsx
import { useState } from "react";
import { motion } from "framer-motion";

export default function SkillsVectorDiagram() {
  const [activeNode, setActiveNode] = useState(null);

  const nodes = [
    {
      id: "ai",
      title: "RAG & LLMs",
      subtitle: "Vector Search & IA",
      tag: "Inteligência",
      color: "#8B5CF6",
      desc: "Busca semântica com embeddings e orquestração de LLMs (OpenAI & Gemini) para automação cognitiva.",
      x: 270,
      y: 42,
    },
    {
      id: "fastapi",
      title: "Python / FastAPI",
      subtitle: "Microsserviços Async",
      tag: "Core Backend",
      color: "#009688",
      desc: "APIs assíncronas de alta performance com Python 3.11, validação com Pydantic v2 e documentação Swagger.",
      x: 435,
      y: 135,
    },
    {
      id: "postgres",
      title: "PostgreSQL & BI",
      subtitle: "CTEs & Metabase",
      tag: "Dados & Analytics",
      color: "#336791",
      desc: "Modelagem relacional, queries analíticas complexas com CTEs avançadas e dashboards gerenciais no Metabase.",
      x: 435,
      y: 335,
    },
    {
      id: "gov",
      title: "ITIL® 4 & ISO",
      subtitle: "Governança & LGPD",
      tag: "Compliance & ITSM",
      color: "#10B981",
      desc: "Gestão orientada a valor, frameworks ITIL v4, auditoria contínua de segurança ISO/IEC 27001 e conformidade LGPD.",
      x: 270,
      y: 430,
    },
    {
      id: "docker",
      title: "Docker & Linux",
      subtitle: "Infra & Nginx",
      tag: "Containerização",
      color: "#2496ED",
      desc: "Containers isolados com Docker Compose, servidores Linux (Debian/Ubuntu) e proxy reverso Nginx com SSL.",
      x: 105,
      y: 335,
    },
    {
      id: "n8n",
      title: "n8n Workflows",
      subtitle: "Orquestração ETL",
      tag: "Automação",
      color: "#FF6D5A",
      desc: "Integração resiliente de ERPs e CRMs, tratamento de webhooks em tempo real e eliminação de processos manuais.",
      x: 105,
      y: 135,
    },
  ];

  return (
    <div className="skills-vector-wrapper" role="region" aria-label="Diagrama Vetorial do Ecossistema de Habilidades">
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="skills-vector-svg"
      >
        <defs>
          {/* Gradientes Neon Estilo Stripe / Dribbble */}
          <linearGradient id="grad-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="grad-circuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          <linearGradient id="grad-glow-radial" x1="50%" y1="50%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </linearGradient>

          {/* Filtro de Glow Suave */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Padrão de Grid Pontilhado Tecnológico */}
          <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#3B82F6" fillOpacity="0.12" />
          </pattern>
        </defs>

        {/* Fundo do Card com Grid Pontilhado */}
        <rect width="540" height="500" rx="20" className="vector-card-bg" />
        <rect width="540" height="500" rx="20" fill="url(#dot-grid)" />
        <rect width="540" height="500" rx="20" className="vector-card-border" />

        {/* Aura Central de Iluminação Neon */}
        <circle cx="270" cy="235" r="160" fill="url(#grad-glow-radial)" />

        {/* Telemetria de Cabeçalho estilo Stripe/Dribbble */}
        <g className="vector-telemetry">
          <text x="24" y="28" className="telemetry-text">[SYS: ARCH-ECOSYSTEM v2.5]</text>
          <text x="516" y="28" textAnchor="end" className="telemetry-text telemetry-text--success">
            ● 99.98% OPERACIONAL
          </text>
        </g>

        {/* Circuitos Conectores Base (Trilhas de Circuito 2D Flat) */}
        <g className="vector-circuits-base">
          {/* Anel Perimetral Hexagonal */}
          <polygon
            points="270,42 435,135 435,335 270,430 105,335 105,135"
            fill="none"
            stroke="rgba(59, 130, 246, 0.18)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Raios Centrais conectando cada nó ao Hub */}
          <line x1="270" y1="92" x2="270" y2="185" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1.5" />
          <line x1="380" y1="165" x2="320" y2="210" stroke="rgba(0, 150, 136, 0.3)" strokeWidth="1.5" />
          <line x1="380" y1="310" x2="320" y2="260" stroke="rgba(51, 103, 145, 0.3)" strokeWidth="1.5" />
          <line x1="270" y1="380" x2="270" y2="285" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
          <line x1="160" y1="310" x2="220" y2="260" stroke="rgba(36, 150, 237, 0.3)" strokeWidth="1.5" />
          <line x1="160" y1="165" x2="220" y2="210" stroke="rgba(255, 109, 90, 0.3)" strokeWidth="1.5" />
        </g>

        {/* Linhas de Fluxo de Dados Animadas (Pulsos) */}
        <g className="vector-circuits-animated">
          <polygon
            points="270,42 435,135 435,335 270,430 105,335 105,135"
            fill="none"
            stroke="url(#grad-circuit)"
            strokeWidth="2"
            strokeDasharray="10 25"
            className="circuit-pulse"
          />

          {/* Pulsos de Dados Radiais */}
          <line x1="270" y1="92" x2="270" y2="185" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="380" y1="165" x2="320" y2="210" stroke="#009688" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="380" y1="310" x2="320" y2="260" stroke="#336791" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="270" y1="380" x2="270" y2="285" stroke="#10B981" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="160" y1="310" x2="220" y2="260" stroke="#2496ED" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="160" y1="165" x2="220" y2="210" stroke="#FF6D5A" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
        </g>

        {/* HUB CENTRAL: Núcleo de Governança & Engenharia */}
        <g className="vector-core-hub">
          {/* Anéis orbitais concêntricos */}
          <circle cx="270" cy="235" r="54" fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="270" cy="235" r="44" fill="none" stroke="url(#grad-core)" strokeWidth="1.5" className="core-orbit-ring" />

          {/* Cápsula Central Flat 2D */}
          <rect
            x="215"
            y="205"
            width="110"
            height="60"
            rx="12"
            fill="#0F172A"
            stroke="url(#grad-core)"
            strokeWidth="1.8"
            filter="url(#neon-glow)"
          />

          {/* Ícone Geométrico Central */}
          <circle cx="270" cy="223" r="5" fill="#38BDF8" />
          <circle cx="270" cy="223" r="10" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 2" />

          <text x="270" y="244" textAnchor="middle" className="hub-title">
            CHRISTIAN SOUSA
          </text>
          <text x="270" y="256" textAnchor="middle" className="hub-subtitle">
            GOVERNANÇA & DADOS
          </text>
        </g>

        {/* NÓS DA STACK REAL (Cards Vetoriais Flat 2D) */}
        {nodes.map((node) => {
          const isHovered = activeNode?.id === node.id;
          const cardWidth = 118;
          const cardHeight = 52;
          const left = node.x - cardWidth / 2;
          const top = node.y - cardHeight / 2;

          return (
            <g
              key={node.id}
              className={`vector-node-group ${isHovered ? "active" : ""}`}
              onMouseEnter={() => setActiveNode(node)}
              onMouseLeave={() => setActiveNode(null)}
              onClick={() => setActiveNode(activeNode?.id === node.id ? null : node)}
              tabIndex="0"
              role="button"
              aria-label={`${node.title}: ${node.subtitle}`}
            >
              {/* Sombra de destaque sutil no hover */}
              {isHovered && (
                <rect
                  x={left - 4}
                  y={top - 4}
                  width={cardWidth + 8}
                  height={cardHeight + 8}
                  rx="14"
                  fill={node.color}
                  fillOpacity="0.18"
                  filter="url(#neon-glow)"
                />
              )}

              {/* Fundo do Card 2D Flat */}
              <rect
                x={left}
                y={top}
                width={cardWidth}
                height={cardHeight}
                rx="10"
                className="vector-node-bg"
                stroke={isHovered ? node.color : "rgba(255, 255, 255, 0.12)"}
                strokeWidth={isHovered ? "2" : "1.2"}
              />

              {/* Tag / Categoria Superior */}
              <text x={left + 10} y={top + 16} fill={node.color} className="node-tag-text">
                {node.tag}
              </text>

              {/* Título da Stack */}
              <text x={left + 10} y={top + 31} className="node-title-text">
                {node.title}
              </text>

              {/* Subtítulo / Detalhe Técnico */}
              <text x={left + 10} y={top + 43} className="node-sub-text">
                {node.subtitle}
              </text>

              {/* Ponto indicador de status da ferramenta */}
              <circle cx={left + cardWidth - 12} cy={top + 14} r="3" fill={node.color} />
            </g>
          );
        })}

        {/* Rodapé / Painel de Inspeção Dinâmico no fundo do SVG */}
        <g className="vector-footer-strip">
          <line x1="20" y1="462" x2="520" y2="462" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

          {activeNode ? (
            <text x="270" y="482" textAnchor="middle" className="footer-inspect-text">
              <tspan fill={activeNode.color} fontWeight="700">
                {activeNode.title}:
              </tspan>{" "}
              {activeNode.desc}
            </text>
          ) : (
            <text x="270" y="482" textAnchor="middle" className="footer-default-text">
              Passe o mouse ou toque nos nós para inspecionar cada camada da arquitetura
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

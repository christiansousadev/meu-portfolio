// frontend/src/components/SkillsVectorDiagram.jsx
import { useState } from "react";

export default function SkillsVectorDiagram() {
  const [activeNodeId, setActiveNodeId] = useState(null);

  // 8 Pilares reais do README do Christian: Frontend, Backend, IA, Automação, Banco de Dados, BI, DevOps, Governança
  const nodes = [
    {
      id: "frontend",
      title: "React & Next.js",
      subtitle: "JavaScript · UI Reativa",
      tag: "Frontend",
      color: "#61DAFB",
      x: 60,
      y: 86,
      cx: 115,
      cy: 110,
    },
    {
      id: "ai",
      title: "LLMs & RAG",
      subtitle: "GPT · Gemini · Embeddings",
      tag: "Inteligência",
      color: "#8B5CF6",
      x: 215,
      y: 24,
      cx: 270,
      cy: 48,
    },
    {
      id: "backend",
      title: "Python / FastAPI",
      subtitle: "Node.js · PHP · Async APIs",
      tag: "Backend & APIs",
      color: "#009688",
      x: 370,
      y: 86,
      cx: 425,
      cy: 110,
    },
    {
      id: "automation",
      title: "n8n Workflows",
      subtitle: "Integrações & ERP/CRM",
      tag: "Automação",
      color: "#FF6D5A",
      x: 25,
      y: 226,
      cx: 80,
      cy: 250,
    },
    {
      id: "data",
      title: "PostgreSQL & SQL",
      subtitle: "MySQL · Firebird · CTEs",
      tag: "Banco de Dados",
      color: "#336791",
      x: 405,
      y: 226,
      cx: 460,
      cy: 250,
    },
    {
      id: "devops",
      title: "Docker & Linux",
      subtitle: "Git · Containers · Nginx",
      tag: "DevOps & Infra",
      color: "#2496ED",
      x: 60,
      y: 366,
      cx: 115,
      cy: 390,
    },
    {
      id: "governance",
      title: "ITIL® 4 & ISO",
      subtitle: "ISO 27001 · LGPD · SLAs",
      tag: "Governança & ITSM",
      color: "#10B981",
      x: 215,
      y: 428,
      cx: 270,
      cy: 452,
    },
    {
      id: "bi",
      title: "Metabase BI",
      subtitle: "Dashboards & Relatórios",
      tag: "Analytics & BI",
      color: "#509EE3",
      x: 370,
      y: 366,
      cx: 425,
      cy: 390,
    },
  ];

  return (
    <div className="skills-vector-wrapper" role="region" aria-label="Diagrama do Ecossistema de Habilidades Técnicas">
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="skills-vector-svg"
      >
        <defs>
          {/* Gradientes Neon dos Circuitos */}
          <linearGradient id="grad-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="grad-circuit-loop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#61DAFB" />
            <stop offset="25%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#009688" />
            <stop offset="75%" stopColor="#509EE3" />
            <stop offset="100%" stopColor="#FF6D5A" />
          </linearGradient>

          <linearGradient id="grad-glow-radial" x1="50%" y1="50%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </linearGradient>

          {/* Filtro Glow para nós ativos */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Grid Pontilhado Tecnológico */}
          <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#3B82F6" fillOpacity="0.12" />
          </pattern>
        </defs>

        {/* Fundo do Card com Grid */}
        <rect width="540" height="500" rx="20" className="vector-card-bg" />
        <rect width="540" height="500" rx="20" fill="url(#dot-grid)" />
        <rect width="540" height="500" rx="20" className="vector-card-border" />

        {/* Aura Central de Iluminação */}
        <circle cx="270" cy="250" r="170" fill="url(#grad-glow-radial)" />

        {/* Circuitos Base Conectores (Anel Octagonal) */}
        <g className="vector-circuits-base">
          <polygon
            points="270,48 425,110 460,250 425,390 270,452 115,390 80,250 115,110"
            fill="none"
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Trilhas Radiais conectando o Hub a cada um dos 8 nós */}
          <line x1="270" y1="215" x2="270" y2="72" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1.5" />
          <line x1="315" y1="225" x2="380" y2="134" stroke="rgba(0, 150, 136, 0.3)" strokeWidth="1.5" />
          <line x1="330" y1="250" x2="405" y2="250" stroke="rgba(51, 103, 145, 0.3)" strokeWidth="1.5" />
          <line x1="315" y1="275" x2="380" y2="366" stroke="rgba(80, 158, 227, 0.3)" strokeWidth="1.5" />
          <line x1="270" y1="285" x2="270" y2="428" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
          <line x1="225" y1="275" x2="160" y2="366" stroke="rgba(36, 150, 237, 0.3)" strokeWidth="1.5" />
          <line x1="210" y1="250" x2="135" y2="250" stroke="rgba(255, 109, 90, 0.3)" strokeWidth="1.5" />
          <line x1="225" y1="225" x2="160" y2="134" stroke="rgba(97, 218, 251, 0.3)" strokeWidth="1.5" />
        </g>

        {/* Linhas de Fluxo de Dados Animadas (Pulsos) */}
        <g className="vector-circuits-animated">
          <polygon
            points="270,48 425,110 460,250 425,390 270,452 115,390 80,250 115,110"
            fill="none"
            stroke="url(#grad-circuit-loop)"
            strokeWidth="2"
            strokeDasharray="10 24"
            className="circuit-pulse"
          />

          {/* Pulsos de Dados Radiais */}
          <line x1="270" y1="215" x2="270" y2="72" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="315" y1="225" x2="380" y2="134" stroke="#009688" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="330" y1="250" x2="405" y2="250" stroke="#336791" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="315" y1="275" x2="380" y2="366" stroke="#509EE3" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="270" y1="285" x2="270" y2="428" stroke="#10B981" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="225" y1="275" x2="160" y2="366" stroke="#2496ED" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="210" y1="250" x2="135" y2="250" stroke="#FF6D5A" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
          <line x1="225" y1="225" x2="160" y2="134" stroke="#61DAFB" strokeWidth="2" strokeDasharray="6 12" className="circuit-pulse" />
        </g>

        {/* NÚCLEO CENTRAL */}
        <g className="vector-core-hub">
          {/* Anéis orbitais concêntricos */}
          <circle cx="270" cy="250" r="54" fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="270" cy="250" r="44" fill="none" stroke="url(#grad-core)" strokeWidth="1.5" className="core-orbit-ring" />

          {/* Cápsula Central 2D Flat */}
          <rect
            x="212"
            y="222"
            width="116"
            height="56"
            rx="12"
            fill="#0F172A"
            stroke="url(#grad-core)"
            strokeWidth="1.8"
            filter="url(#neon-glow)"
          />

          {/* Indicador Central */}
          <circle cx="270" cy="238" r="4.5" fill="#38BDF8" />
          <circle cx="270" cy="238" r="9" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 2" />

          <text x="270" y="258" textAnchor="middle" className="hub-title">
            CHRISTIAN SOUSA
          </text>
          <text x="270" y="269" textAnchor="middle" className="hub-subtitle">
            SOFTWARE ENGINEER
          </text>
        </g>

        {/* 8 NÓS DAS HABILIDADES REAIS */}
        {nodes.map((node) => {
          const isHovered = activeNodeId === node.id;
          const cardWidth = 110;
          const cardHeight = 48;

          return (
            <g
              key={node.id}
              className={`vector-node-group ${isHovered ? "active" : ""}`}
              onMouseEnter={() => setActiveNodeId(node.id)}
              onMouseLeave={() => setActiveNodeId(null)}
              onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
              tabIndex="0"
              role="button"
              aria-label={`${node.title}: ${node.subtitle}`}
            >
              {/* Sombra de destaque no hover */}
              {isHovered && (
                <rect
                  x={node.x - 4}
                  y={node.y - 4}
                  width={cardWidth + 8}
                  height={cardHeight + 8}
                  rx="14"
                  fill={node.color}
                  fillOpacity="0.2"
                  filter="url(#neon-glow)"
                />
              )}

              {/* Fundo do Card 2D Flat */}
              <rect
                x={node.x}
                y={node.y}
                width={cardWidth}
                height={cardHeight}
                rx="10"
                className="vector-node-bg"
                stroke={isHovered ? node.color : "rgba(255, 255, 255, 0.14)"}
                strokeWidth={isHovered ? "2" : "1.2"}
              />

              {/* Tag Superior */}
              <text x={node.x + 9} y={node.y + 15} fill={node.color} className="node-tag-text">
                {node.tag}
              </text>

              {/* Título da Stack */}
              <text x={node.x + 9} y={node.y + 29} className="node-title-text">
                {node.title}
              </text>

              {/* Subtítulo das Tecnologias */}
              <text x={node.x + 9} y={node.y + 40} className="node-sub-text">
                {node.subtitle}
              </text>

              {/* Ponto indicador com a cor oficial */}
              <circle cx={node.x + cardWidth - 10} cy={node.y + 13} r="3" fill={node.color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

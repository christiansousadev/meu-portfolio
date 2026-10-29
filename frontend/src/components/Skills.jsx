// frontend/src/components/Skills.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  EASE_OUT,
  VIEWPORT_ONCE,
  revealContainer,
  revealItem,
  trackSpotlight,
} from "../utils/motion";

// Stack é igual nos dois idiomas; textos ficam em SKILLS_COPY
const ARCHITECTURAL_DOMAINS = [
  { id: "integration", stack: ["Python", "FastAPI", "Node.js", "n8n", "REST"] },
  { id: "data", stack: ["PostgreSQL", "SQL/CTEs", "Metabase", "RAG"] },
  { id: "governance", stack: ["Docker", "Linux", "Nginx", "ITIL® 4", "ISO 27001"] },
];

const SKILLS_COPY = {
  pt: {
    fallbackTitle: "Competências e entregas",
    deliverablesLabel: "Frentes de atuação",
    toolsLabel: "Tecnologias e ferramentas",
    flowLabel:
      "Fluxo de engenharia: ERPs, CRMs e APIs passam por integração, dados e IA e governança até chegar a painéis, assistentes e trilhas de auditoria.",
    loopLabel: "controles e evidências de auditoria",
    sources: ["ERPs", "CRMs", "APIs"],
    outputs: ["Painéis", "Assistentes", "Auditoria"],
    domains: {
      integration: {
        stage: "Integração",
        title: "Backend, APIs & Automação",
        description:
          "Desenvolvimento de microsserviços assíncronos, validação estrita de contratos e integração entre ERPs (SAP, TOTVS), CRMs e rotinas contábeis.",
      },
      data: {
        stage: "Dados & IA",
        title: "Engenharia de Dados & IA Aplicada",
        description:
          "Modelagem relacional, consultas analíticas para diagnóstico de causa-raiz, pipelines ETL e assistentes corporativos com recorte focado de contexto.",
      },
      governance: {
        stage: "Governança",
        title: "Governança, Infra & Segurança",
        description:
          "Topologias same-origin com Cloudflare Zero Trust, escrita atômica, mascaramento automático de PII (LGPD) e trilhas de auditoria padrão CIM.",
      },
    },
  },
  en: {
    fallbackTitle: "Skills and deliverables",
    deliverablesLabel: "Areas of focus",
    toolsLabel: "Technologies and tools",
    flowLabel:
      "Engineering flow: ERPs, CRMs and APIs pass through integration, data and AI, and governance before reaching dashboards, assistants and audit trails.",
    loopLabel: "audit controls & compliance evidence",
    sources: ["ERPs", "CRMs", "APIs"],
    outputs: ["Dashboards", "Assistants", "Auditing"],
    domains: {
      integration: {
        stage: "Integration",
        title: "Backend, APIs & Automation",
        description:
          "Asynchronous microservices, strict contract validation and integrations between ERPs (SAP, TOTVS), CRMs and accounting routines.",
      },
      data: {
        stage: "Data & AI",
        title: "Data Engineering & Applied AI",
        description:
          "Relational modeling, analytical queries for root-cause diagnosis, ETL pipelines and enterprise assistants with tightly scoped context.",
      },
      governance: {
        stage: "Governance",
        title: "Governance, Infrastructure & Security",
        description:
          "Same-origin topologies behind Cloudflare Zero Trust, atomic writes, automatic PII masking (LGPD) and CIM-standard audit trails.",
      },
    },
  },
};

// Geometria do diagrama (viewBox 1000 x 170)
const FLOW_Y = 96;
const NODE_X = { integration: 330, data: 500, governance: 670 };
const LANE_Y = [46, 96, 146];

const tagContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025 } },
};

const tagItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

function FlowPath({ d, hot = false, variant = "" }) {
  return (
    <>
      <path className="flow-base" d={d} />
      <path className={`flow-pulse ${variant} ${hot ? "is-hot" : ""}`} d={d} />
    </>
  );
}

function EngineeringFlow({ copy, activeId, onActivate }) {
  const ix = NODE_X.integration;
  const gx = NODE_X.governance;
  const sources = copy.sources.map((label, i) => ({ label, y: LANE_Y[i] }));
  const outputs = copy.outputs.map((label, i) => ({ label, y: LANE_Y[i] }));

  return (
    <svg className="flow-svg" viewBox="0 0 1000 170" role="img" aria-label={copy.flowLabel}>
      {sources.map((src) => (
        <FlowPath
          key={src.label}
          d={`M118,${src.y} C210,${src.y} 220,${FLOW_Y} ${ix - 22},${FLOW_Y}`}
          hot={activeId === "integration"}
        />
      ))}

      <FlowPath
        d={`M${ix + 22},${FLOW_Y} L${NODE_X.data - 22},${FLOW_Y}`}
        hot={activeId === "integration" || activeId === "data"}
      />
      <FlowPath
        d={`M${NODE_X.data + 22},${FLOW_Y} L${gx - 22},${FLOW_Y}`}
        hot={activeId === "data" || activeId === "governance"}
      />

      {outputs.map((out) => (
        <FlowPath
          key={out.label}
          d={`M${gx + 22},${FLOW_Y} C780,${FLOW_Y} 790,${out.y} 872,${out.y}`}
          hot={activeId === "governance"}
        />
      ))}

      {/* Laço de retorno: controles de governança realimentam a integração */}
      <FlowPath
        d={`M${gx},${FLOW_Y - 24} C${gx - 40},14 ${ix + 40},14 ${ix},${FLOW_Y - 24}`}
        hot={activeId === "governance"}
        variant="flow-pulse--loop"
      />
      <text className="flow-loop-label" x="500" y="20" textAnchor="middle">
        {copy.loopLabel}
      </text>

      {sources.map((src) => (
        <g key={src.label} className="flow-endpoint">
          <rect x="30" y={src.y - 13} width="88" height="26" rx="7" />
          <text x="74" y={src.y + 4} textAnchor="middle">
            {src.label}
          </text>
        </g>
      ))}

      {outputs.map((out) => (
        <g key={out.label} className="flow-endpoint">
          <rect x="872" y={out.y - 13} width="104" height="26" rx="7" />
          <text x="924" y={out.y + 4} textAnchor="middle">
            {out.label}
          </text>
        </g>
      ))}

      {ARCHITECTURAL_DOMAINS.map((domain) => {
        const x = NODE_X[domain.id];
        return (
          <g
            key={domain.id}
            className={`flow-node ${activeId === domain.id ? "is-active" : ""}`}
            onMouseEnter={() => onActivate(domain.id)}
            onMouseLeave={() => onActivate(null)}
          >
            <circle className="flow-node-halo" cx={x} cy={FLOW_Y} r="34" />
            <circle className="flow-node-ring" cx={x} cy={FLOW_Y} r="22" />
            <circle className="flow-node-core" cx={x} cy={FLOW_Y} r="5" />
            <text className="flow-node-label" x={x} y={FLOW_Y + 46} textAnchor="middle">
              {copy.domains[domain.id].stage}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Skills({ data, lang = "pt" }) {
  const [activeDomain, setActiveDomain] = useState(null);
  const copy = SKILLS_COPY[lang] || SKILLS_COPY.pt;

  const deliverables = (data?.items || []).map((item) =>
    item.replace(/^⚡\s*/, "").trim()
  );
  const tags = data?.tags || [];

  return (
    <section id="skills" className="section-block">
      <motion.div
        className="section-header"
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={revealContainer}
      >
        <motion.h2 className="section-title" variants={revealItem}>
          {data?.title || copy.fallbackTitle}
        </motion.h2>
        {data?.subtitle && (
          <motion.p className="section-subtitle" variants={revealItem}>
            {data.subtitle}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        className="skills-board"
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={revealContainer}
      >
        <motion.div className="skills-flow" variants={revealItem}>
          <EngineeringFlow copy={copy} activeId={activeDomain} onActivate={setActiveDomain} />
        </motion.div>

        <div className="skills-domains-grid">
          {ARCHITECTURAL_DOMAINS.map((domain) => {
            const text = copy.domains[domain.id];
            return (
              <motion.article
                key={domain.id}
                className={`domain-cell spotlight ${
                  activeDomain === domain.id ? "is-active" : ""
                }`}
                variants={revealItem}
                onPointerMove={trackSpotlight}
                onMouseEnter={() => setActiveDomain(domain.id)}
                onMouseLeave={() => setActiveDomain(null)}
              >
                <span className="domain-stage">
                  <span className="domain-stage-dot" aria-hidden="true" />
                  {text.stage}
                </span>
                <h3 className="domain-title">{text.title}</h3>
                <p className="domain-desc">{text.description}</p>
                <div className="tag-list domain-stack">
                  {domain.stack.map((tech) => (
                    <span key={tech} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.div>

      <div className="skills-detail-split">
        <motion.div
          className="skills-deliverables"
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          variants={revealContainer}
        >
          <motion.h3 className="subsection-label" variants={revealItem}>
            {copy.deliverablesLabel}
          </motion.h3>
          <ul className="deliverables-list">
            {deliverables.map((item, idx) => (
              <motion.li key={idx} className="deliverable-row" variants={revealItem}>
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {tags.length > 0 && (
          <motion.div
            className="skills-stack-panel"
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT_ONCE}
            variants={revealContainer}
          >
            <motion.h3 className="subsection-label" variants={revealItem}>
              {copy.toolsLabel}
            </motion.h3>
            <motion.div className="tag-list" variants={tagContainer}>
              {tags.map((tag, idx) => (
                <motion.span
                  key={`${tag}-${idx}`}
                  className="tech-tag"
                  variants={tagItem}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

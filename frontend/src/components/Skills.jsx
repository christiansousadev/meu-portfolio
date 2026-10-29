// frontend/src/components/Skills.jsx

const ARCHITECTURAL_DOMAINS = [
  {
    title: "Backend, APIs & Automação",
    stack: "Python · FastAPI · Node.js · n8n · REST",
    description:
      "Desenvolvimento de microsserviços assíncronos, validação estrita de contratos e integração entre ERPs (SAP, TOTVS), CRMs e rotinas contábeis.",
  },
  {
    title: "Engenharia de Dados & IA Aplicada",
    stack: "PostgreSQL · SQL/CTEs · Metabase · RAG",
    description:
      "Modelagem relacional, consultas analíticas para diagnóstico de causa-raiz, pipelines ETL e assistentes corporativos com recorte focado de contexto.",
  },
  {
    title: "Governança, Infra & Segurança",
    stack: "Docker · Linux · Nginx · ITIL® 4 · ISO 27001",
    description:
      "Topologias same-origin com Cloudflare Zero Trust, escrita atômica, mascaramento automático de PII (LGPD) e trilhas de auditoria padrão CIM.",
  },
];

export default function Skills({ data }) {
  const deliverables = (data?.items || []).map((item) =>
    item.replace(/^⚡\s*/, "").trim()
  );
  const tags = data?.tags || [];

  return (
    <section id="skills" className="section-block">
      <div className="section-header">
        {data?.subtitle && <span className="section-kicker">{data.subtitle}</span>}
        <h2 className="section-title">{data?.title || "Competências e entregas"}</h2>
      </div>

      <div className="skills-domains-grid">
        {ARCHITECTURAL_DOMAINS.map((domain) => (
          <article key={domain.title} className="domain-cell">
            <span className="domain-stack">{domain.stack}</span>
            <h3 className="domain-title">{domain.title}</h3>
            <p className="domain-desc">{domain.description}</p>
          </article>
        ))}
      </div>

      <div className="skills-detail-split">
        <div className="skills-deliverables">
          <h3 className="subsection-label">Frentes de atuação</h3>
          <ul className="deliverables-list">
            {deliverables.map((item, idx) => (
              <li key={idx} className="deliverable-row">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {tags.length > 0 && (
          <div className="skills-stack-panel">
            <h3 className="subsection-label">Tecnologias e ferramentas</h3>
            <div className="tag-list">
              {tags.map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="tech-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

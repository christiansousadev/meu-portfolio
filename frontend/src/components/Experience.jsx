// frontend/src/components/Experience.jsx
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Experience({ data }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 5;

  const items = data?.items || [];
  const displayedItems = showAll ? items : items.slice(0, INITIAL_COUNT);
  const hasMore = items.length > INITIAL_COUNT;

  return (
    <section id="experience" className="section-block">
      <div className="section-header">
        <span className="section-kicker">Trajetória profissional</span>
        <h2 className="section-title">{data?.title || "Experiência Profissional"}</h2>
        <p className="section-subtitle">
          Atuação contínua em arquitetura de automações, integração de ERPs, análise de riscos e sustentação de sistemas críticos.
        </p>
      </div>

      <div className="exp-ledger">
        {displayedItems.map((exp, idx) => (
          <article key={`${exp.company}-${exp.role}-${idx}`} className="exp-row">
            <div className="exp-period">
              {exp.time || "—"}
            </div>

            <div className="exp-content">
              <div className="exp-header">
                <h3 className="exp-role">{exp.role}</h3>
                <span className="exp-company">{exp.company}</span>
              </div>
              <p className="exp-desc">{exp.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="exp-toggle-row">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
          >
            {showAll ? (
              <>
                <span>Mostrar menos</span>
                <ChevronUp size={15} aria-hidden="true" />
              </>
            ) : (
              <>
                <span>Mostrar histórico completo ({items.length} experiências)</span>
                <ChevronDown size={15} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

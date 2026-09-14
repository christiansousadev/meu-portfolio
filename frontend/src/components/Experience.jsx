// frontend/src/components/Experience.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronUp, Building2 } from "lucide-react";

export default function Experience({ data }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 5;

  const displayedItems = showAll ? data.items : data.items.slice(0, INITIAL_COUNT);
  const hasMore = data.items.length > INITIAL_COUNT;

  return (
    <motion.section
      id="experience"
      className="section-block"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div className="section-header">
        <span className="eyebrow">CARREIRA & LIDERANÇA TÉCNICA</span>
        <h2 className="section-title">{data.title}</h2>
        <p className="section-subtitle">
          Trajetória consolidada em Engenharia de Software, Governança de TI e Automação de Processos Críticos.
        </p>
      </div>

      <div className="timeline-wrapper">
        {displayedItems.map((exp, i) => (
          <motion.div
            key={i}
            className="timeline-item"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            viewport={{ once: true }}
          >
            <div className="timeline-node" />

            <div className="glass-card timeline-card">
              <div className="timeline-card-head">
                <div>
                  <h3 className="timeline-company">
                    <Building2 size={20} className="icon-accent" />
                    {exp.company}
                  </h3>
                  <h4 className="timeline-role">{exp.role}</h4>
                </div>

                {exp.time && (
                  <span className="timeline-date">
                    <Calendar size={14} />
                    {exp.time}
                  </span>
                )}
              </div>

              <p className="timeline-desc">{exp.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div className="timeline-toggle-wrap">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                Recolher Histórico <ChevronUp size={18} />
              </>
            ) : (
              <>
                Ver Trajetória Completa (+{data.items.length - INITIAL_COUNT} experiências) <ChevronDown size={18} />
              </>
            )}
          </button>
        </div>
      )}
    </motion.section>
  );
}

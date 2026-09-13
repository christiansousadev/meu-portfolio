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
      style={{ padding: "80px 0" }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            marginBottom: "10px",
            letterSpacing: "-0.02em",
          }}
        >
          {data.title}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto" }}>
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

            <div
              className="glass-card"
              style={{
                padding: "24px 28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--text-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Building2 size={20} style={{ color: "var(--accent-color)" }} />
                    {exp.company}
                  </h3>
                  <h4
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      color: "var(--accent-color)",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {exp.role}
                  </h4>
                </div>

                {exp.time && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      background: "var(--accent-light)",
                      color: "var(--accent-color)",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <Calendar size={14} />
                    {exp.time}
                  </span>
                )}
              </div>

              <p
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  fontSize: "0.98rem",
                  margin: 0,
                }}
              >
                {exp.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowAll(!showAll)}
            style={{
              padding: "12px 28px",
              fontSize: "0.95rem",
            }}
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

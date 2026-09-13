// frontend/src/components/Skills.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Database, Shield, Terminal } from "lucide-react";

export default function Skills({ data }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "Todas as Stacks" },
    { id: "fullstack", label: "Fullstack & APIs", icon: Terminal },
    { id: "data_ai", label: "Dados & IA", icon: Database },
    { id: "governance", label: "Governança & Cloud", icon: Shield },
  ];

  const skillBadges = [
    { name: "Python", category: "fullstack" },
    { name: "FastAPI", category: "fullstack" },
    { name: "React", category: "fullstack" },
    { name: "Node.js", category: "fullstack" },
    { name: "PostgreSQL", category: "data_ai" },
    { name: "SQL Avançado & CTEs", category: "data_ai" },
    { name: "Metabase BI", category: "data_ai" },
    { name: "RAG & LLMs", category: "data_ai" },
    { name: "Docker", category: "governance" },
    { name: "Nginx", category: "governance" },
    { name: "n8n Automation", category: "governance" },
    { name: "ITIL® 4", category: "governance" },
    { name: "ISO 27001 / LGPD", category: "governance" },
    { name: "Linux", category: "governance" },
  ];

  const filteredBadges =
    selectedCategory === "all"
      ? skillBadges
      : skillBadges.filter((b) => b.category === selectedCategory);

  return (
    <motion.section
      id="skills"
      className="section-container"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div className="section-image">
        <img
          src="/images/skills_tech.png"
          alt="Stack Tecnológica e Arquitetura - Christian Sousa"
        />
      </div>

      <div className="section-text">
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          {data.title}
        </h2>
        <p
          style={{
            color: "var(--accent-color)",
            fontSize: "0.85rem",
            letterSpacing: "2px",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "25px",
          }}
        >
          {data.subtitle}
        </p>

        {/* Abas de Filtros de Categoria */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tags de Tecnologias Animadas */}
        <motion.div
          layout
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "9px",
            marginBottom: "32px",
            minHeight: "80px",
          }}
        >
          <AnimatePresence>
            {filteredBadges.map((badge) => (
              <motion.span
                layout
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="tech-tag"
                style={{
                  fontSize: "0.86rem",
                  padding: "7px 14px",
                  borderRadius: "20px",
                  cursor: "default",
                }}
              >
                {badge.name}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Itens de Entrega de Valor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {data.items.map((item, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                borderRadius: "12px",
              }}
            >
              <CheckCircle2
                size={20}
                style={{ color: "var(--accent-color)", marginTop: "2px", flexShrink: 0 }}
              />
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.5,
                  color: "var(--text-color)",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {item.replace(/^⚡\s*/, "")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

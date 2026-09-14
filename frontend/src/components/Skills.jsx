// frontend/src/components/Skills.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Database, Shield, Terminal, Layers } from "lucide-react";

export default function Skills({ data }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "Todas as Stacks", icon: Layers },
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
        <span className="eyebrow">{data.subtitle}</span>
        <h2 className="section-title">{data.title}</h2>

        {/* Abas de Filtros de Categoria */}
        <div className="filter-container filter-container--start">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={selectedCategory === cat.id}
              >
                <Icon size={14} style={{ marginRight: 6 }} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Tags de Tecnologias Animadas */}
        <motion.div layout className="tag-list tag-list--skills">
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
              >
                {badge.name}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Itens de Entrega de Valor */}
        <div className="value-list">
          {data.items.map((item, i) => (
            <div key={i} className="glass-card value-item">
              <CheckCircle2 size={20} className="value-icon" />
              <p className="value-text">{item.replace(/^⚡\s*/, "")}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

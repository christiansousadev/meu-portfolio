// frontend/src/components/Projects.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, FolderGit2, Info, X, CheckCircle } from "lucide-react";

export default function Projects({ data }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeModalProject, setActiveModalProject] = useState(null);

  if (!data || !data.items) {
    return null;
  }

  // Coleta categorias únicas
  const categories = [
    { id: "all", label: "Todos os Projetos" },
    { id: "Governança & Dados", label: "Governança & Dados" },
    { id: "IA & Automação", label: "IA & Automação" },
    { id: "Fullstack & Cloud", label: "Fullstack & Cloud" },
  ];

  const filteredItems =
    selectedCategory === "all"
      ? data.items
      : data.items.filter(
          (p) =>
            p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
            (selectedCategory === "all")
        );

  return (
    <motion.section
      id="projects"
      style={{ padding: "80px 0" }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
          Aplicações corporativas e microsserviços desenhados com foco em resiliência, escalabilidade e governança.
        </p>
      </div>

      {/* Filtros por Categoria */}
      <div className="filter-container">
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

      {/* Grid de Cards de Projetos */}
      <motion.div
        layout
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "28px",
        }}
      >
        <AnimatePresence>
          {filteredItems.map((project) => (
            <motion.div
              layout
              key={project.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="glass-card"
              style={{
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {/* Badge de Categoria */}
              {project.category && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--accent-color)",
                    background: "var(--accent-light)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    marginBottom: "14px",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  {project.category}
                </span>
              )}

              <div style={{ flexGrow: 1 }}>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "var(--text-color)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FolderGit2 size={20} style={{ color: "var(--accent-color)" }} />
                  {project.name}
                </h3>

                <p
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                    fontSize: "0.98rem",
                  }}
                >
                  {project.desc}
                </p>

                {/* Tags de Tecnologias */}
                {project.tags && project.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "25px",
                    }}
                  >
                    {project.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="tech-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações: Repositório e Detalhes */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginTop: "auto",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--card-border)",
                }}
              >
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                    }}
                  >
                    Repositório <ExternalLink size={14} />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setActiveModalProject(project)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-color)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer",
                    padding: "8px",
                  }}
                >
                  <Info size={16} /> Arquitetura
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modal de Arquitetura & Detalhes Técnicos */}
      <AnimatePresence>
        {activeModalProject && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: "20px",
            }}
            onClick={() => setActiveModalProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card"
              style={{
                width: "100%",
                maxWidth: "520px",
                padding: "32px",
                backgroundColor: "var(--card-bg)",
                maxHeight: "85vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>
                  {activeModalProject.name}
                </h3>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setActiveModalProject(null)}
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <span className="status-badge" style={{ marginBottom: "12px" }}>
                  <CheckCircle size={14} /> Produção & Código Auditado
                </span>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                  {activeModalProject.desc}
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", color: "var(--accent-color)", marginBottom: "10px" }}>
                  Tecnologias Envolvidas
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {activeModalProject.tags?.map((t, idx) => (
                    <span key={idx} className="tech-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModalProject(null)}
                >
                  Fechar
                </button>
                {activeModalProject.link && (
                  <a
                    href={activeModalProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ textDecoration: "none" }}
                  >
                    Ver no GitHub <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

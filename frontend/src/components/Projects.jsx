// frontend/src/components/Projects.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, FolderGit2, Info, X, CheckCircle } from "lucide-react";

export default function Projects({ data }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeModalProject, setActiveModalProject] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && activeModalProject) {
        setActiveModalProject(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalProject]);

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
      className="section-block"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div className="section-header">
        <span className="eyebrow">PORTFÓLIO & ARQUITETURA</span>
        <h2 className="section-title">{data.title}</h2>
        <p className="section-subtitle">
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

      {/* Grid de Cards de Projetos (Bento) */}
      <motion.div layout className="projects-grid">
        <AnimatePresence>
          {filteredItems.map((project, idx) => {
            const isFeatured = selectedCategory === "all" && idx === 0;
            return (
              <motion.div
                layout
                key={project.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`glass-card project-card ${isFeatured ? "is-featured" : ""}`}
              >
                {/* Topo do Card: Categoria & Badge Featured */}
                <div className="project-top-row">
                  {project.category && (
                    <span className="project-category">{project.category}</span>
                  )}
                  {isFeatured && (
                    <span className="project-featured-badge">★ Destaque de Arquitetura</span>
                  )}
                </div>

                <div className="project-body">
                  <h3 className="project-title">
                    <FolderGit2 size={20} className="icon-accent" />
                    {project.name}
                  </h3>

                  <p className="project-desc">{project.desc}</p>

                  {/* Tags de Tecnologias */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="tag-list project-tags">
                      {project.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="tech-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações: Repositório e Detalhes */}
                <div className="project-footer">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary btn-sm"
                    >
                      Repositório <ExternalLink size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveModalProject(project)}
                    className="project-detail-btn"
                  >
                    <Info size={16} /> Arquitetura
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Modal de Arquitetura & Detalhes Técnicos */}
      <AnimatePresence>
        {activeModalProject && (
          <div className="modal-overlay" onClick={() => setActiveModalProject(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-head">
                <h3 className="modal-title">{activeModalProject.name}</h3>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setActiveModalProject(null)}
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-section">
                <span className="status-badge">
                  <CheckCircle size={14} /> Produção & Código Auditado
                </span>
                <p className="modal-text">{activeModalProject.desc}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-label">Tecnologias Envolvidas</h4>
                <div className="tag-list">
                  {activeModalProject.tags?.map((t, idx) => (
                    <span key={idx} className="tech-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
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

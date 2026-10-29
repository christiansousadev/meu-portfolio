// frontend/src/components/Projects.jsx
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, FileText, X } from "lucide-react";

export default function Projects({ data }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeModalProject, setActiveModalProject] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && activeModalProject) {
        setActiveModalProject(null);
      }
    };
    if (activeModalProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModalProject]);

  const items = useMemo(() => data?.items || [], [data]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((p) => p.category?.trim()).filter(Boolean))
    );
    return [
      { id: "all", label: "Todos" },
      ...unique.map((cat) => ({ id: cat, label: cat })),
    ];
  }, [items]);

  if (!items.length) {
    return null;
  }

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter(
          (p) => p.category?.trim().toLowerCase() === selectedCategory.toLowerCase()
        );

  return (
    <section id="projects" className="section-block">
      <div className="section-header-split">
        <div className="section-header section-header--flush">
          <span className="section-kicker">Engenharia aplicada</span>
          <h2 className="section-title">{data.title}</h2>
          <p className="section-subtitle">
            Sistemas, pipelines de dados e plataformas construídas com foco em confiabilidade operacional e rastreabilidade.
          </p>
        </div>

        {categories.length > 2 && (
          <div className="underline-tabs" role="tablist" aria-label="Filtrar projetos por área">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`underline-tab ${isActive ? "is-active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="projects-grid">
        {filteredItems.map((project) => {
          const hasArch = Boolean(project.architecture && project.architecture.trim());
          return (
            <article key={project.name} className="surface-card project-card">
              <div className="project-body">
                {project.category && (
                  <span className="project-category">{project.category}</span>
                )}

                <h3 className="project-title">{project.name}</h3>
                <p className="project-desc">{project.desc}</p>

                {project.tags && project.tags.length > 0 && (
                  <div className="tag-list project-tags">
                    {project.tags.map((tag, tIdx) => (
                      <span key={`${tag}-${tIdx}`} className="tech-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="project-footer">
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    <span>Repositório GitHub</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}

                {hasArch && (
                  <button
                    type="button"
                    onClick={() => setActiveModalProject(project)}
                    className="project-detail-btn"
                  >
                    <FileText size={14} aria-hidden="true" />
                    <span>Especificação</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <AnimatePresence>
        {activeModalProject && (
          <div className="modal-overlay" onClick={() => setActiveModalProject(null)}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="surface-card modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-head">
                <div>
                  {activeModalProject.category && (
                    <span className="project-category">{activeModalProject.category}</span>
                  )}
                  <h3 id="project-modal-title" className="modal-title">
                    {activeModalProject.name}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setActiveModalProject(null)}
                  aria-label="Fechar especificação"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-label">Resumo</h4>
                <p className="modal-text">{activeModalProject.desc}</p>
              </div>

              {activeModalProject.architecture && (
                <div className="modal-section">
                  <h4 className="modal-section-label">Arquitetura e decisões técnicas</h4>
                  <p className="modal-text">{activeModalProject.architecture}</p>
                </div>
              )}

              {activeModalProject.tags?.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-label">Stack utilizada</h4>
                  <div className="tag-list">
                    {activeModalProject.tags.map((t, idx) => (
                      <span key={`${t}-${idx}`} className="tech-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setActiveModalProject(null)}
                >
                  Fechar
                </button>
                {activeModalProject.link && (
                  <a
                    href={activeModalProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-sm"
                  >
                    <span>Abrir repositório</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

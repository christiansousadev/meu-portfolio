// frontend/src/components/Projects.jsx
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight, FileText, X } from "lucide-react";
import {
  EASE_OUT,
  SPRING_INDICATOR,
  VIEWPORT_ONCE,
  revealContainer,
  revealItem,
  trackSpotlight,
} from "../utils/motion";

const CARD_TRANSITION = { duration: 0.45, ease: EASE_OUT };

const PROJ_COPY = {
  pt: {
    subtitle:
      "Sistemas, pipelines de dados e plataformas construídas com foco em confiabilidade operacional e rastreabilidade.",
    all: "Todos",
    filterLabel: "Filtrar projetos por área",
    repo: "Repositório GitHub",
    spec: "Especificação",
    closeSpec: "Fechar especificação",
    summary: "Resumo",
    architecture: "Arquitetura e decisões técnicas",
    stack: "Stack utilizada",
    close: "Fechar",
    openRepo: "Abrir repositório",
  },
  en: {
    subtitle:
      "Systems, data pipelines and platforms built for operational reliability and traceability.",
    all: "All",
    filterLabel: "Filter projects by area",
    repo: "GitHub repository",
    spec: "Specification",
    closeSpec: "Close specification",
    summary: "Summary",
    architecture: "Architecture and technical decisions",
    stack: "Tech stack",
    close: "Close",
    openRepo: "Open repository",
  },
};

const modalStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

const modalItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

export default function Projects({ data, lang = "pt" }) {
  const copy = PROJ_COPY[lang] || PROJ_COPY.pt;
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
      { id: "all", label: copy.all },
      ...unique.map((cat) => ({ id: cat, label: cat })),
    ];
  }, [items, copy.all]);

  if (!items.length) {
    return null;
  }

  // Categorias mudam de nome entre idiomas: se a seleção não existir mais, volta para "todos"
  const activeCategory = categories.some((cat) => cat.id === selectedCategory)
    ? selectedCategory
    : "all";

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter(
          (p) => p.category?.trim().toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <section id="projects" className="section-block">
      <motion.div
        className="section-header-split"
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={revealContainer}
      >
        <div className="section-header section-header--flush">
          <motion.h2 className="section-title" variants={revealItem}>
            {data.title}
          </motion.h2>
          <motion.p className="section-subtitle" variants={revealItem}>
            {copy.subtitle}
          </motion.p>
        </div>

        {categories.length > 2 && (
          <motion.div variants={revealItem}>
            <LayoutGroup id="projects-filter">
              <div className="underline-tabs" role="tablist" aria-label={copy.filterLabel}>
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`underline-tab ${isActive ? "is-active" : ""}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span className="underline-tab-label">{cat.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="underline-indicator"
                          className="underline-tab-indicator"
                          transition={SPRING_INDICATOR}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        className="projects-grid"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.7, ease: EASE_OUT }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredItems.map((project) => {
            const hasArch = Boolean(project.architecture && project.architecture.trim());
            return (
              <motion.article
                key={project.name}
                layout
                className="surface-card project-card spotlight"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                whileHover={{ y: -4 }}
                transition={CARD_TRANSITION}
                onPointerMove={trackSpotlight}
              >
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
                      <span>{copy.repo}</span>
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
                      <span>{copy.spec}</span>
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {activeModalProject && (
          <motion.div
            key="project-modal"
            className="modal-overlay"
            onClick={() => setActiveModalProject(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 340, damping: 30 },
              }}
              exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18 } }}
              className="surface-card modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div initial="hidden" animate="show" variants={modalStagger}>
                <motion.div className="modal-head" variants={modalItem}>
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
                    aria-label={copy.closeSpec}
                  >
                    <X size={18} />
                  </button>
                </motion.div>

                <motion.div className="modal-section" variants={modalItem}>
                  <h4 className="modal-section-label">{copy.summary}</h4>
                  <p className="modal-text">{activeModalProject.desc}</p>
                </motion.div>

                {activeModalProject.architecture && (
                  <motion.div className="modal-section" variants={modalItem}>
                    <h4 className="modal-section-label">{copy.architecture}</h4>
                    <p className="modal-text">{activeModalProject.architecture}</p>
                  </motion.div>
                )}

                {activeModalProject.tags?.length > 0 && (
                  <motion.div className="modal-section" variants={modalItem}>
                    <h4 className="modal-section-label">{copy.stack}</h4>
                    <div className="tag-list">
                      {activeModalProject.tags.map((t, idx) => (
                        <span key={`${t}-${idx}`} className="tech-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.div className="modal-actions" variants={modalItem}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setActiveModalProject(null)}
                  >
                    {copy.close}
                  </button>
                  {activeModalProject.link && (
                    <a
                      href={activeModalProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary btn-sm"
                    >
                      <span>{copy.openRepo}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

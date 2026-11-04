// frontend/src/components/Projects.jsx
//
// Casos em coluna única: resumo, arquitetura e stack ficam no corpo do
// projeto. Sem filtros nem modal: com poucos projetos, cada clique a mais
// esconde o conteúdo mais forte da página.

import { projectAnchor } from "../content/engineering";

const PROJ_COPY = {
  pt: {
    fallbackTitle: "Projetos",
    lede: "Sistemas e pipelines publicados, com a arquitetura de cada um.",
    architecture: "Arquitetura e decisões técnicas",
    stack: "Stack",
    code: "Código no GitHub",
    codeLabel: (name) => `Código de ${name} no GitHub (abre em nova aba)`,
  },
  en: {
    fallbackTitle: "Projects",
    lede: "Published systems and pipelines, each with its architecture.",
    architecture: "Architecture and technical decisions",
    stack: "Stack",
    code: "Code on GitHub",
    codeLabel: (name) => `${name} source code on GitHub (opens in a new tab)`,
  },
};

const paragraphs = (text) =>
  String(text || "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

export default function Projects({ data, lang = "pt" }) {
  const copy = PROJ_COPY[lang] || PROJ_COPY.pt;
  const items = data?.items || [];
  if (!items.length) return null;

  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <header className="section-head">
        <h2 id="projects-title" className="section-title">
          {data.title || copy.fallbackTitle}
        </h2>
        <p className="section-lede">{copy.lede}</p>
      </header>

      <div className="cases">
        {items.map((project) => {
          const architecture = paragraphs(project.architecture);
          const isGithub = /github\.com/i.test(project.link || "");
          return (
            <article
              key={project.name}
              id={projectAnchor(project.name)}
              className="case"
              aria-labelledby={`${projectAnchor(project.name)}-title`}
            >
              <header className="case-head">
                {project.category && <p className="case-category">{project.category}</p>}
                <h3 id={`${projectAnchor(project.name)}-title`} className="case-title">
                  {project.name}
                </h3>
                {project.link && (
                  <a
                    className="case-link"
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={copy.codeLabel(project.name)}
                  >
                    {isGithub ? copy.code : project.link.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </header>

              <div className="case-body">
                {paragraphs(project.desc).map((p, idx) => (
                  <p key={idx} className="case-summary">
                    {p}
                  </p>
                ))}

                {architecture.length > 0 && (
                  <div className="case-architecture">
                    <h4 className="case-label">{copy.architecture}</h4>
                    {architecture.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}

                {project.tags?.length > 0 && (
                  <p className="case-stack">
                    <span className="case-label">{copy.stack}</span>
                    {project.tags.join(", ")}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

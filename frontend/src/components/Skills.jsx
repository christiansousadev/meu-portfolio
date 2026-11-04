// frontend/src/components/Skills.jsx
//
// "O que entrego": um ledger com as três etapas do esquema do Hero.
// Entregas vêm de skills.items (prefixo "Etapa: texto") e sistemas de
// skills.tags, ambos editáveis no /admin.

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  STAGES,
  STAGE_COPY,
  projectAnchor,
  splitStageItem,
  stageForTag,
} from "../content/engineering";
import { LEDGER_FOCUS_EVENT } from "./EngineeringSchematic";

const SKILLS_COPY = {
  pt: {
    fallbackTitle: "O que entrego",
    caption: "Entregas por etapa do fluxo de engenharia",
    stage: "Etapa",
    deliveries: "Entregas",
    systems: "Sistemas e ferramentas",
    evidence: "Evidência",
    other: "Outras frentes",
    alsoUse: "Também no dia a dia",
    experience: "na trajetória",
  },
  en: {
    fallbackTitle: "What I deliver",
    caption: "Deliverables by engineering stage",
    stage: "Stage",
    deliveries: "Deliverables",
    systems: "Systems and tools",
    evidence: "Evidence",
    other: "Other work",
    alsoUse: "Also in daily use",
    experience: "in my track record",
  },
};

const TARGET_FLASH_MS = 1800;

export default function Skills({ data, projects = [], lang = "pt" }) {
  const copy = SKILLS_COPY[lang] || SKILLS_COPY.pt;
  const stageCopy = STAGE_COPY[lang] || STAGE_COPY.pt;
  const prefersReducedMotion = useReducedMotion();
  const [target, setTarget] = useState(null);

  const { rows, looseTags } = useMemo(() => {
    const items = (data?.items || []).map(splitStageItem);
    const tags = data?.tags || [];
    const projectNames = new Set(projects.map((p) => p.name));

    const built = STAGES.map((stage) => ({
      id: stage.id,
      anchor: stage.anchor,
      number: stage.number,
      label: stageCopy[stage.id].label,
      deliveries: items.filter((i) => i.stageId === stage.id).map((i) => i.text),
      systems: [
        ...(stage.systems[lang] || stage.systems.pt),
        ...tags.filter((t) => stageForTag(t) === stage.id),
      ],
      projects: stage.evidence.projects.filter((name) => projectNames.has(name)),
      companies: stage.evidence.companies,
    }));

    const orphanItems = items.filter((i) => !i.stageId).map((i) => i.text);
    if (orphanItems.length) {
      built.push({
        id: "other",
        anchor: "entrega-outras",
        number: null,
        label: copy.other,
        deliveries: orphanItems,
        systems: [],
        projects: [],
        companies: [],
      });
    }

    return { rows: built, looseTags: tags.filter((t) => !stageForTag(t)) };
  }, [data, projects, lang, stageCopy, copy.other]);

  // clique num nó do esquema do Hero leva à linha correspondente
  useEffect(() => {
    const handleFocus = (e) => {
      const row = document.getElementById(e.detail);
      if (!row) return;
      row.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      row.focus({ preventScroll: true });
      setTarget(e.detail);
    };
    window.addEventListener(LEDGER_FOCUS_EVENT, handleFocus);
    return () => window.removeEventListener(LEDGER_FOCUS_EVENT, handleFocus);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!target) return undefined;
    const id = window.setTimeout(() => setTarget(null), TARGET_FLASH_MS);
    return () => window.clearTimeout(id);
  }, [target]);

  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <header className="section-head">
        <h2 id="skills-title" className="section-title">
          {data?.title || copy.fallbackTitle}
        </h2>
        {data?.subtitle && <p className="section-lede">{data.subtitle}</p>}
      </header>

      <table className="ledger ledger--deliverables">
        <caption className="visually-hidden">{copy.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.stage}</th>
            <th scope="col">{copy.deliveries}</th>
            <th scope="col">{copy.systems}</th>
            <th scope="col">{copy.evidence}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              id={row.anchor}
              tabIndex={-1}
              className={target === row.anchor ? "is-target" : undefined}
            >
              <th scope="row" className="ledger-stage">
                {row.number && <span className="ledger-num">{row.number}</span>}
                {row.label}
              </th>
              <td data-label={copy.deliveries}>
                <ul className="ledger-list">
                  {row.deliveries.map((text, idx) => (
                    <li key={idx}>{text}</li>
                  ))}
                </ul>
              </td>
              <td data-label={copy.systems} className="ledger-systems">
                {row.systems.length ? row.systems.join(", ") : "—"}
              </td>
              <td data-label={copy.evidence}>
                {row.projects.length + row.companies.length > 0 ? (
                  <ul className="ledger-list ledger-list--evidence">
                    {row.projects.map((name) => (
                      <li key={name}>
                        <a className="evidence-link" href={`#${projectAnchor(name)}`}>
                          {name}
                        </a>
                      </li>
                    ))}
                    {row.companies.map((name) => (
                      <li key={name}>
                        <a className="evidence-link" href="#experience">
                          {name}
                        </a>{" "}
                        <span className="ledger-note">{copy.experience}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {looseTags.length > 0 && (
        <p className="ledger-footnote">
          <span className="ledger-footnote-label">{copy.alsoUse}:</span> {looseTags.join(", ")}
        </p>
      )}
    </section>
  );
}

// frontend/src/components/Experience.jsx
//
// Ledger cronológico: o período é estruturado a partir do texto livre de
// `time`, as funções ficam na ordem cadastrada no /admin e a trajetória é
// separada em engenharia e carreira corporativa em ERPs.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "../utils/motion";
import {
  formatDuration,
  formatPoint,
  parsePeriod,
  periodMonths,
  startYear,
} from "../utils/period";

// Ano em que a carreira passou da operação de ERPs para a engenharia de integrações
const ENGINEERING_SINCE_YEAR = 2022;

const EXP_COPY = {
  pt: {
    fallbackTitle: "Trajetória",
    lede:
      "Da implantação de SAP e TOTVS do lado do negócio à engenharia das integrações que conectam esses sistemas.",
    engineering: "Engenharia e automação",
    corporate: "Trajetória corporativa em ERPs",
    roles: (n) => `${n} ${n === 1 ? "função" : "funções"}`,
    showCorporate: (n, range) => `Mostrar trajetória corporativa em ERPs (${n} funções, ${range})`,
    hideCorporate: "Ocultar trajetória corporativa",
    present: "hoje",
  },
  en: {
    fallbackTitle: "Track record",
    lede:
      "From rolling out SAP and TOTVS on the business side to engineering the integrations that connect them.",
    engineering: "Engineering and automation",
    corporate: "Corporate ERP track record",
    roles: (n) => `${n} ${n === 1 ? "role" : "roles"}`,
    showCorporate: (n, range) => `Show corporate ERP track record (${n} roles, ${range})`,
    hideCorporate: "Hide corporate track record",
    present: "today",
  },
};

function yearRange(entries, copy) {
  const periods = entries.map((e) => e.period).filter(Boolean);
  if (!periods.length) return "";
  const first = Math.min(...periods.map((p) => p.start.y));
  const hasPresent = periods.some((p) => p.end === "present");
  const last = hasPresent ? null : Math.max(...periods.map((p) => p.end.y));
  return `${first}–${last ?? copy.present}`;
}

function LedgerRows({ entries, lang }) {
  return (
    <ol className="exp-ledger">
      {entries.map(({ item, period, key }) => (
        <li key={key} className="exp-row">
          <p className="exp-period">
            {period ? (
              <>
                <span className="exp-dates">
                  {formatPoint(period.start, lang)} – {formatPoint(period.end, lang)}
                </span>
                <span className="exp-duration">{formatDuration(periodMonths(period), lang)}</span>
              </>
            ) : (
              <span className="exp-dates">{item.time || "—"}</span>
            )}
          </p>
          <h4 className="exp-role">
            {item.role}
            <span className="exp-company">{item.company}</span>
          </h4>
          <p className="exp-desc">{item.desc}</p>
        </li>
      ))}
    </ol>
  );
}

export default function Experience({ data, lang = "pt" }) {
  const copy = EXP_COPY[lang] || EXP_COPY.pt;
  const [showCorporate, setShowCorporate] = useState(false);

  const { engineering, corporate } = useMemo(() => {
    const entries = (data?.items || []).map((item, idx) => ({
      item,
      period: parsePeriod(item.time),
      key: `${item.company}-${item.role}-${idx}`,
    }));
    return {
      engineering: entries.filter((e) => (startYear(e.period) ?? 9999) >= ENGINEERING_SINCE_YEAR),
      corporate: entries.filter((e) => (startYear(e.period) ?? 9999) < ENGINEERING_SINCE_YEAR),
    };
  }, [data]);

  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <header className="section-head">
        <h2 id="experience-title" className="section-title">
          {data?.title || copy.fallbackTitle}
        </h2>
        <p className="section-lede">{copy.lede}</p>
      </header>

      {engineering.length > 0 && (
        <div className="exp-group">
          <h3 className="exp-group-title">
            {copy.engineering}
            <span className="exp-group-meta">
              {yearRange(engineering, copy)}, {copy.roles(engineering.length)}
            </span>
          </h3>
          <LedgerRows entries={engineering} lang={lang} />
        </div>
      )}

      {corporate.length > 0 && (
        <div className="exp-group exp-group--corporate">
          <button
            type="button"
            className="btn-secondary exp-toggle"
            aria-expanded={showCorporate}
            aria-controls="exp-corporate"
            onClick={() => setShowCorporate((prev) => !prev)}
          >
            {showCorporate
              ? copy.hideCorporate
              : copy.showCorporate(corporate.length, yearRange(corporate, copy))}
          </button>

          <AnimatePresence initial={false}>
            {showCorporate && (
              <motion.div
                id="exp-corporate"
                key="exp-corporate"
                className="exp-collapse"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                <h3 className="exp-group-title">
                  {copy.corporate}
                  <span className="exp-group-meta">
                    {yearRange(corporate, copy)}, {copy.roles(corporate.length)}
                  </span>
                </h3>
                <LedgerRows entries={corporate} lang={lang} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

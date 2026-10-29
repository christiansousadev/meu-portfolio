// frontend/src/components/Experience.jsx
import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  EASE_OUT,
  SPRING_INDICATOR,
  VIEWPORT_ONCE,
  revealContainer,
  revealItem,
} from "../utils/motion";

const INITIAL_COUNT = 5;

// Faixa central da viewport que "acende" o marcador durante a rolagem
const ACTIVE_BAND = { amount: "some", margin: "-42% 0px -52% 0px" };

function ExperienceRow({ exp, idx, isActive, onActivate, ...motionProps }) {
  return (
    <motion.article
      className={`exp-row ${isActive ? "is-active" : ""}`}
      onMouseEnter={() => onActivate(idx)}
      {...motionProps}
    >
      <span className="exp-node" aria-hidden="true" />
      <div className="exp-period">{exp.time || "—"}</div>

      <motion.div
        className="exp-content"
        onViewportEnter={() => onActivate(idx)}
        viewport={ACTIVE_BAND}
      >
        {isActive && (
          <motion.span
            layoutId="exp-highlight"
            className="exp-highlight"
            transition={SPRING_INDICATOR}
          />
        )}
        <div className="exp-header">
          <h3 className="exp-role">{exp.role}</h3>
          <span className="exp-company">{exp.company}</span>
        </div>
        <p className="exp-desc">{exp.desc}</p>
      </motion.div>
    </motion.article>
  );
}

export default function Experience({ data }) {
  const [showAll, setShowAll] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);
  const timelineRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 55%"],
  });
  const railProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  const items = data?.items || [];
  const initialItems = items.slice(0, INITIAL_COUNT);
  const extraItems = items.slice(INITIAL_COUNT);
  const hasMore = extraItems.length > 0;

  const toggleHistory = () => {
    if (showAll) {
      document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" });
    }
    setShowAll((prev) => !prev);
  };

  return (
    <section id="experience" className="section-block">
      <motion.div
        className="section-header"
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={revealContainer}
      >
        <motion.h2 className="section-title" variants={revealItem}>
          {data?.title || "Experiência Profissional"}
        </motion.h2>
        <motion.p className="section-subtitle" variants={revealItem}>
          Atuação contínua em arquitetura de automações, integração de ERPs, análise de riscos e sustentação de sistemas críticos.
        </motion.p>
      </motion.div>

      <motion.div
        ref={timelineRef}
        className="exp-timeline"
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={revealContainer}
      >
        <div className="exp-rail" aria-hidden="true">
          <motion.span className="exp-rail-fill" style={{ scaleY: railProgress }} />
        </div>

        {initialItems.map((exp, idx) => (
          <ExperienceRow
            key={`${exp.company}-${exp.role}-${idx}`}
            exp={exp}
            idx={idx}
            isActive={activeIdx === idx}
            onActivate={setActiveIdx}
            variants={revealItem}
          />
        ))}

        <AnimatePresence initial={false}>
          {showAll && hasMore && (
            <motion.div
              key="exp-more"
              className="exp-more"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            >
              {extraItems.map((exp, extraIdx) => {
                const idx = INITIAL_COUNT + extraIdx;
                return (
                  <ExperienceRow
                    key={`${exp.company}-${exp.role}-${idx}`}
                    exp={exp}
                    idx={idx}
                    isActive={activeIdx === idx}
                    onActivate={setActiveIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      ease: EASE_OUT,
                      delay: 0.08 + Math.min(extraIdx, 8) * 0.04,
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {hasMore && (
        <div className="exp-toggle-row">
          <motion.button
            type="button"
            className="btn-secondary btn-sm"
            onClick={toggleHistory}
            aria-expanded={showAll}
            whileTap={{ scale: 0.97 }}
          >
            <span>
              {showAll
                ? "Mostrar menos"
                : `Mostrar histórico completo (${items.length} experiências)`}
            </span>
            <ChevronDown size={15} aria-hidden="true" />
          </motion.button>
        </div>
      )}
    </section>
  );
}

// frontend/src/components/Hero.jsx
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Mail, ArrowUpRight, Terminal, User } from "lucide-react";
import { EASE_OUT, trackSpotlight } from "../utils/motion";

const CONTACT_EMAIL = "christiansousadev@gmail.com";

const HERO_COPY = {
  pt: {
    status: "Disponível para novos projetos e liderança técnica",
    emailLabel: `Enviar e-mail para ${CONTACT_EMAIL}`,
    terminalTitle: "pipeline — bash",
    terminalLabel:
      "Terminal demonstrativo: pipeline corporativo com FastAPI, n8n, PostgreSQL, LGPD e RAG.",
    terminalTab: "Terminal",
    profileTab: "Perfil",
    avatarAlt: "Christian Sousa - Engenheiro de Software",
    terminal: [
      { kind: "cmd", user: "christian@srv-prod:~$", text: "python -m app.pipeline --mode=production" },
      { kind: "step", tag: "INFO", tagColor: "info", label: "FastAPI Engine v2.4 initialized (workers: 2)" },
      { kind: "step", tag: "SYNC", tagColor: "sync", label: "n8n Webhook: recebendo lote ERP TOTVS", badge: "1.420 msgs", statusType: "sync" },
      { kind: "step", tag: "DATA", tagColor: "data", label: "Validação Pydantic + PostgreSQL UPSERT", leader: true, badge: "[OK] 1420/1420", statusType: "ok" },
      { kind: "step", tag: "LGPD", tagColor: "lgpd", label: "Anonimização de PII (Lei 13.709)", leader: true, badge: "[CONFORME]", statusType: "ok" },
      { kind: "step", tag: "RAG", tagColor: "rag", label: "Embeddings indexados no ChatContábil", leader: true, badge: "[SINC]", statusType: "signal" },
      { kind: "step", tag: "AUDIT", tagColor: "audit", label: "Trilha ISO 27001 registrada (audit.jsonl)", leader: true, badge: "[SUCESSO]", statusType: "ok" },
      { kind: "meta", items: [["Latência", "412ms"], ["Erros", "0"], ["SLA ITIL", "99.98%"]] },
    ],
    credentialsLabel: "Resumo de qualificações",
    credentials: [
      { value: "+6 anos", label: "Trajetória dedicada em TI, ERPs e automação" },
      { value: "ITIL® 4", label: "Gestão de serviços, incidentes e mudanças (Axelos)" },
      { value: "ISO 27001 & LGPD", label: "Auditoria estruturada, segurança e minimização" },
      { value: "Python & SQL", label: "FastAPI, PostgreSQL, integrações n8n e RAG" },
    ],
  },
  en: {
    status: "Available for new projects and technical leadership",
    emailLabel: `Send an email to ${CONTACT_EMAIL}`,
    terminalTitle: "pipeline — bash",
    terminalLabel:
      "Demonstrative terminal: enterprise pipeline with FastAPI, n8n, PostgreSQL, LGPD and RAG.",
    terminalTab: "Terminal",
    profileTab: "Profile",
    avatarAlt: "Christian Sousa - Software Engineer",
    terminal: [
      { kind: "cmd", user: "christian@srv-prod:~$", text: "python -m app.pipeline --mode=production" },
      { kind: "step", tag: "INFO", tagColor: "info", label: "FastAPI Engine v2.4 initialized (workers: 2)" },
      { kind: "step", tag: "SYNC", tagColor: "sync", label: "n8n Webhook: receiving TOTVS ERP batch", badge: "1,420 msgs", statusType: "sync" },
      { kind: "step", tag: "DATA", tagColor: "data", label: "Pydantic validation + PostgreSQL UPSERT", leader: true, badge: "[OK] 1420/1420", statusType: "ok" },
      { kind: "step", tag: "LGPD", tagColor: "lgpd", label: "PII Anonymization (Law 13,709)", leader: true, badge: "[COMPLIANT]", statusType: "ok" },
      { kind: "step", tag: "RAG", tagColor: "rag", label: "Embeddings indexed in ChatContabil", leader: true, badge: "[SYNC]", statusType: "signal" },
      { kind: "step", tag: "AUDIT", tagColor: "audit", label: "ISO 27001 audit trail logged (audit.jsonl)", leader: true, badge: "[SUCCESS]", statusType: "ok" },
      { kind: "meta", items: [["Latency", "412ms"], ["Errors", "0"], ["ITIL SLA", "99.98%"]] },
    ],
    credentialsLabel: "Qualifications summary",
    credentials: [
      { value: "6+ years", label: "Dedicated track record in IT, ERPs and automation" },
      { value: "ITIL® 4", label: "Service, incident and change management (Axelos)" },
      { value: "ISO 27001 & LGPD", label: "Structured auditing, security and data minimization" },
      { value: "Python & SQL", label: "FastAPI, PostgreSQL, n8n integrations and RAG" },
    ],
  },
};

const copyContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const copyItem = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

const mediaReveal = {
  hidden: { opacity: 0, scale: 0.94, y: 18 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 1.1, ease: EASE_OUT, delay: 0.25 },
  },
};

const credentialsContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
};

const credentialItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

// As linhas do terminal entram em sequência depois que a moldura aparece
const terminalLines = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 1 } },
};

const terminalLine = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

const TILT_SPRING = { stiffness: 140, damping: 18, mass: 0.6 };

function TerminalLine({ line }) {
  if (line.kind === "cmd") {
    return (
      <>
        <span className="terminal-user">{line.user || "$"}</span>
        <span className="terminal-cmd">{line.text}</span>
      </>
    );
  }
  if (line.kind === "step") {
    return (
      <>
        <span className={`terminal-tag terminal-tag--${line.tagColor || "info"}`}>
          [{line.tag}]
        </span>
        <span className="terminal-key">{line.label}</span>
        {line.leader && <span className="terminal-leader" />}
        {line.badge && (
          <span className={`terminal-status terminal-status--${line.statusType || "ok"}`}>
            {line.badge}
          </span>
        )}
      </>
    );
  }
  if (line.kind === "meta") {
    return (
      <div className="terminal-summary">
        <span className="terminal-accent">==&gt;</span>
        {line.items.map(([key, value]) => (
          <span key={key} className="terminal-pair">
            <span className="terminal-muted">{key}:</span>
            <span className="terminal-signal">{value}</span>
          </span>
        ))}
      </div>
    );
  }
  return <span className="terminal-muted">{line.text}</span>;
}

function PortraitFrame({ copy }) {
  const [activeView, setActiveView] = useState("terminal");
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [5, -5]), TILT_SPRING);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-7, 7]), TILT_SPRING);

  const handlePointerMove = (e) => {
    if (prefersReducedMotion || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      className="hero-media"
      variants={mediaReveal}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div className="hero-portrait">
        <div className="hero-portrait-halo" aria-hidden="true" />
        <motion.figure className="hero-portrait-frame" style={{ rotateX, rotateY }}>
          <div className="hero-terminal" role="region" aria-label={copy.terminalLabel}>
            <div className="terminal-bar">
              <div className="terminal-bar-left">
                <span className="terminal-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="terminal-title">{copy.terminalTitle}</span>
              </div>

              <div className="terminal-tabs" role="tablist" aria-label="Modo de visualização">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === "terminal"}
                  className={`terminal-tab ${activeView === "terminal" ? "is-active" : ""}`}
                  onClick={() => setActiveView("terminal")}
                >
                  <Terminal size={12} aria-hidden="true" />
                  <span>{copy.terminalTab}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === "profile"}
                  className={`terminal-tab ${activeView === "profile" ? "is-active" : ""}`}
                  onClick={() => setActiveView("profile")}
                >
                  <User size={12} aria-hidden="true" />
                  <span>{copy.profileTab}</span>
                </button>
              </div>
            </div>

            <div className="hero-frame-body">
              <AnimatePresence mode="wait">
                {activeView === "terminal" ? (
                  <motion.div
                    key="terminal-content"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.ol
                      className="terminal-body"
                      aria-hidden="true"
                      variants={terminalLines}
                      initial="hidden"
                      animate="show"
                    >
                      {copy.terminal.map((line, idx) => (
                        <motion.li
                          key={idx}
                          className={`terminal-line terminal-line--${line.kind}`}
                          variants={terminalLine}
                        >
                          <TerminalLine line={line} />
                        </motion.li>
                      ))}
                      <motion.li className="terminal-line terminal-line--cmd" variants={terminalLine}>
                        <span className="terminal-user">christian@srv-prod:~$</span>
                        <span className="terminal-cursor" />
                      </motion.li>
                    </motion.ol>
                  </motion.div>
                ) : (
                  <motion.div
                    key="profile-content"
                    className="hero-avatar-wrapper"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img
                      src="/images/hero_developer.png"
                      alt={copy.avatarAlt}
                      className="hero-avatar"
                      loading="eager"
                    />
                    <div className="hero-avatar-badge">
                      <span className="hero-avatar-badge-dot" aria-hidden="true" />
                      <span>Christian Sousa</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.figure>
      </div>
    </motion.div>
  );
}

export default function Hero({ data, lang = "pt" }) {
  const copy = HERO_COPY[lang] || HERO_COPY.pt;

  return (
    <section className="hero-section">
      <div className="hero-atmosphere" aria-hidden="true">
        <motion.div
          className="hero-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE_OUT }}
        />
        <div className="hero-blueprint" />
      </div>

      <motion.div
        className="hero-grid"
        initial="hidden"
        animate="show"
        variants={copyContainer}
      >
        <div className="hero-copy">
          <motion.p className="hero-status" variants={copyItem}>
            <span className="status-dot" aria-hidden="true" />
            <span>{copy.status}</span>
          </motion.p>

          <motion.h1 className="hero-title" variants={copyItem}>
            {data.greeting}
          </motion.h1>

          <motion.p className="hero-subtitle" variants={copyItem}>
            {data.subtitle}
          </motion.p>

          <motion.div className="hero-actions" variants={copyItem}>
            <motion.a
              href={`mailto:${CONTACT_EMAIL}`}
              className="btn-primary"
              aria-label={copy.emailLabel}
              whileTap={{ scale: 0.97 }}
            >
              <Mail size={16} aria-hidden="true" />
              <span>{data.contactBtn}</span>
            </motion.a>

            <motion.a
              href="#experience"
              className="btn-secondary"
              whileTap={{ scale: 0.97 }}
            >
              <span>{data.resumeBtn}</span>
            </motion.a>

            <div className="hero-external-links">
              <a
                href="https://github.com/christiansousadev"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-text-link"
              >
                GitHub <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/in/christiansousasilva/"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-text-link"
              >
                LinkedIn <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        </div>

        <PortraitFrame copy={copy} />
      </motion.div>

      <motion.dl
        className="hero-credentials-bar"
        aria-label={copy.credentialsLabel}
        initial="hidden"
        animate="show"
        variants={credentialsContainer}
      >
        {copy.credentials.map((item) => (
          <motion.div
            key={item.value}
            className="credential-cell spotlight"
            variants={credentialItem}
            onPointerMove={trackSpotlight}
          >
            <dt className="credential-value">{item.value}</dt>
            <dd className="credential-label">{item.label}</dd>
          </motion.div>
        ))}
      </motion.dl>
    </section>
  );
}

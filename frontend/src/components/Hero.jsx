// frontend/src/components/Hero.jsx
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Mail, ArrowUpRight } from "lucide-react";
import { EASE_OUT, trackSpotlight } from "../utils/motion";

const CONTACT_EMAIL = "christiansousadev@gmail.com";

const HERO_COPY = {
  pt: {
    status: "Disponível para novos projetos e liderança técnica",
    emailLabel: `Enviar e-mail para ${CONTACT_EMAIL}`,
    terminalTitle: "erp-sync — bash",
    terminalLabel:
      "Terminal ilustrativo: sincronização de lançamentos de um ERP TOTVS para PostgreSQL com validação de contratos, conciliação contábil, mascaramento de dados pessoais e registro de auditoria.",
    terminal: [
      { kind: "cmd", text: "python -m erp_sync --origem totvs" },
      { kind: "log", text: "lote 2026-11  1.284 lançamentos lidos" },
      { kind: "check", key: "contratos pydantic", value: "ok" },
      { kind: "check", key: "conciliação contábil", value: "1284/1284" },
      { kind: "check", key: "pii mascarada (lgpd)", value: "ok" },
      { kind: "event", name: "audit.file_write", field: "status", value: "success" },
      { kind: "meta", items: [["trace", "9f3c2a1b"], ["sla", "842 ms"]] },
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
    terminalTitle: "erp-sync — bash",
    terminalLabel:
      "Illustrative terminal: syncing ledger entries from a TOTVS ERP into PostgreSQL with contract validation, accounting reconciliation, personal data masking and an audit record.",
    terminal: [
      { kind: "cmd", text: "python -m erp_sync --source totvs" },
      { kind: "log", text: "batch 2026-11  1,284 entries read" },
      { kind: "check", key: "pydantic contracts", value: "ok" },
      { kind: "check", key: "ledger reconciliation", value: "1284/1284" },
      { kind: "check", key: "pii masked (lgpd)", value: "ok" },
      { kind: "event", name: "audit.file_write", field: "status", value: "success" },
      { kind: "meta", items: [["trace", "9f3c2a1b"], ["sla", "842 ms"]] },
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
        <span className="terminal-prompt">$</span>
        <span className="terminal-cmd">{line.text}</span>
      </>
    );
  }
  if (line.kind === "check") {
    return (
      <>
        <span className="terminal-key">{line.key}</span>
        <span className="terminal-leader" />
        <span className="terminal-ok">{line.value}</span>
      </>
    );
  }
  if (line.kind === "event") {
    return (
      <>
        <span className="terminal-accent">{line.name}</span>
        <span className="terminal-muted">{line.field}=</span>
        <span className="terminal-ok">{line.value}</span>
      </>
    );
  }
  if (line.kind === "meta") {
    return line.items.map(([key, value]) => (
      <span key={key} className="terminal-pair">
        <span className="terminal-muted">{key}</span>
        <span className="terminal-signal">{value}</span>
      </span>
    ));
  }
  return <span className="terminal-muted">{line.text}</span>;
}

function TerminalWindow({ copy }) {
  return (
    <div className="hero-terminal" role="img" aria-label={copy.terminalLabel}>
      <div className="terminal-bar" aria-hidden="true">
        <span className="terminal-dots">
          <span />
          <span />
          <span />
        </span>
        <span className="terminal-title">{copy.terminalTitle}</span>
      </div>
      <motion.ol className="terminal-body" aria-hidden="true" variants={terminalLines}>
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
          <span className="terminal-prompt">$</span>
          <span className="terminal-cursor" />
        </motion.li>
      </motion.ol>
    </div>
  );
}

function PortraitFrame({ copy }) {
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
          <TerminalWindow copy={copy} />
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

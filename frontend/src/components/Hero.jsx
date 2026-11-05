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
import { Mail, Download, ArrowUpRight, Terminal, User, MapPin } from "lucide-react";
import { EASE_OUT, trackSpotlight } from "../utils/motion";
import ContactModal from "./ContactModal";

const CONTACT_EMAIL = "christiansousadev@gmail.com";

function GithubIcon({ size = 14, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function LinkedinIcon({ size = 14, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

const HERO_COPY = {
  pt: {
    status: "Disponível para novos projetos e liderança técnica",
    contactBtn: "Entrar em contato",
    resumeBtn: "Download do currículo",
    contactModalOpenLabel: "Abrir opções de contato",
    downloadResumeLabel: "Baixar Currículo de Christian Sousa em PDF",
    terminalTitle: "stack — bash",
    terminalLabel:
      "Terminal demonstrativo: stack técnica com Python, FastAPI, PostgreSQL, n8n, LGPD e Docker.",
    terminalTab: "Terminal",
    profileTab: "Perfil",
    avatarAlt: "Christian Sousa - Engenheiro de Software",
    terminal: [
      { kind: "cmd", user: "christian@srv-prod:~$", text: "python -m stack.status" },
      { kind: "step", tag: "STACK", tagColor: "stack", label: "Python · FastAPI · AsyncIO", leader: true, badge: "[OK]", statusType: "ok" },
      { kind: "step", tag: "DATA", tagColor: "data", label: "PostgreSQL · SQLAlchemy · SQL", leader: true, badge: "[OK]", statusType: "ok" },
      { kind: "step", tag: "FLOW", tagColor: "flow", label: "n8n Engine · Webhooks REST", leader: true, badge: "[READY]", statusType: "sync" },
      { kind: "step", tag: "SEC", tagColor: "sec", label: "LGPD · Anonimização PII · ISO 27001", leader: true, badge: "[CONFORME]", statusType: "ok" },
      { kind: "step", tag: "AI", tagColor: "ai", label: "RAG Pipeline · Vector Embeddings", leader: true, badge: "[ATIVO]", statusType: "signal" },
      { kind: "step", tag: "OPS", tagColor: "ops", label: "Docker Container · Nginx Proxy", leader: true, badge: "[UP]", statusType: "ok" },
      { kind: "meta", items: [["Latência", "12ms"], ["Erros", "0"], ["SLA ITIL", "99.98%"]] },
    ],
    profile: {
      name: "Christian Sousa",
      role: "Engenheiro de Software & Governança",
      location: "Fortaleza, CE · Remoto",
      status: "Disponível",
      summary: "Especialista em integrações ERP, automação de fluxos críticos e arquiteturas seguras sob práticas ITIL® 4 e LGPD.",
      skills: ["Python & FastAPI", "PostgreSQL", "n8n Automations", "ITIL® 4", "LGPD & ISO 27001", "Docker"],
      socials: [
        { name: "GitHub", handle: "@christiansousadev", url: "https://github.com/christiansousadev", type: "github" },
        { name: "LinkedIn", handle: "in/christiansousasilva", url: "https://www.linkedin.com/in/christiansousasilva/", type: "linkedin" },
        { name: "E-mail", handle: CONTACT_EMAIL, url: `mailto:${CONTACT_EMAIL}`, type: "mail" },
      ],
    },
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
    contactBtn: "Get in touch",
    resumeBtn: "Download Resume",
    contactModalOpenLabel: "Open contact options",
    downloadResumeLabel: "Download Christian Sousa Resume (PDF)",
    terminalTitle: "stack — bash",
    terminalLabel:
      "Demonstrative terminal: technical stack with Python, FastAPI, PostgreSQL, n8n, LGPD and Docker.",
    terminalTab: "Terminal",
    profileTab: "Profile",
    avatarAlt: "Christian Sousa - Software Engineer",
    terminal: [
      { kind: "cmd", user: "christian@srv-prod:~$", text: "python -m stack.status" },
      { kind: "step", tag: "STACK", tagColor: "stack", label: "Python · FastAPI · AsyncIO", leader: true, badge: "[OK]", statusType: "ok" },
      { kind: "step", tag: "DATA", tagColor: "data", label: "PostgreSQL · SQLAlchemy · SQL", leader: true, badge: "[OK]", statusType: "ok" },
      { kind: "step", tag: "FLOW", tagColor: "flow", label: "n8n Engine · REST Webhooks", leader: true, badge: "[READY]", statusType: "sync" },
      { kind: "step", tag: "SEC", tagColor: "sec", label: "LGPD · PII Anonymization · ISO 27001", leader: true, badge: "[COMPLIANT]", statusType: "ok" },
      { kind: "step", tag: "AI", tagColor: "ai", label: "RAG Pipeline · Vector Embeddings", leader: true, badge: "[ACTIVE]", statusType: "signal" },
      { kind: "step", tag: "OPS", tagColor: "ops", label: "Docker Container · Nginx Proxy", leader: true, badge: "[UP]", statusType: "ok" },
      { kind: "meta", items: [["Latency", "12ms"], ["Errors", "0"], ["ITIL SLA", "99.98%"]] },
    ],
    profile: {
      name: "Christian Sousa",
      role: "Software Engineer & IT Governance",
      location: "Fortaleza, CE · Remote",
      status: "Available",
      summary: "Specialist in ERP integrations, critical workflow automation and secure architectures under ITIL® 4 and LGPD.",
      skills: ["Python & FastAPI", "PostgreSQL", "n8n Automations", "ITIL® 4", "LGPD & ISO 27001", "Docker"],
      socials: [
        { name: "GitHub", handle: "@christiansousadev", url: "https://github.com/christiansousadev", type: "github" },
        { name: "LinkedIn", handle: "in/christiansousasilva", url: "https://www.linkedin.com/in/christiansousasilva/", type: "linkedin" },
        { name: "Email", handle: CONTACT_EMAIL, url: `mailto:${CONTACT_EMAIL}`, type: "mail" },
      ],
    },
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

const terminalLines = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.9 } },
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

function ProfileCard({ profile, avatarAlt }) {
  return (
    <div className="profile-card-content">
      <div className="profile-card-header">
        <div className="profile-avatar-slot">
          <img
            src="/images/hero_developer.png"
            alt={avatarAlt}
            className="profile-avatar-img"
            loading="eager"
          />
          <span className="profile-status-ring" title={profile.status} />
        </div>
        <div className="profile-card-identity">
          <div className="profile-name-row">
            <span className="profile-card-name">{profile.name}</span>
            <span className="profile-badge-available">
              <span className="profile-dot-pulse" aria-hidden="true" />
              {profile.status}
            </span>
          </div>
          <span className="profile-card-role">{profile.role}</span>
          <span className="profile-card-location">
            <MapPin size={12} aria-hidden="true" />
            <span>{profile.location}</span>
          </span>
        </div>
      </div>

      <p className="profile-card-summary">{profile.summary}</p>

      <div className="profile-card-skills" aria-label="Habilidades e tecnologias principais">
        {profile.skills.map((skill) => (
          <span key={skill} className="profile-skill-chip">
            {skill}
          </span>
        ))}
      </div>

      <div className="profile-card-socials" aria-label="Redes e canais de contato">
        {profile.socials.map((social) => {
          const Icon =
            social.type === "github"
              ? GithubIcon
              : social.type === "linkedin"
              ? LinkedinIcon
              : Mail;
          return (
            <a
              key={social.name}
              href={social.url}
              target={social.type === "mail" ? undefined : "_blank"}
              rel={social.type === "mail" ? undefined : "noopener noreferrer"}
              className="profile-social-item"
              aria-label={`${social.name}: ${social.handle}`}
            >
              <span className="profile-social-left">
                <Icon size={14} className="profile-social-icon" />
                <span className="profile-social-meta">
                  <span className="profile-social-name">{social.name}</span>
                  <span className="profile-social-handle">{social.handle}</span>
                </span>
              </span>
              <ArrowUpRight size={13} className="profile-social-arrow" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </div>
  );
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
                    className="hero-profile-wrapper"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProfileCard profile={copy.profile} avatarAlt={copy.avatarAlt} />
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
  const [isContactOpen, setIsContactOpen] = useState(false);
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
            <motion.button
              type="button"
              className="btn-primary"
              onClick={() => setIsContactOpen(true)}
              aria-label={copy.contactModalOpenLabel}
              whileTap={{ scale: 0.97 }}
            >
              <Mail size={16} aria-hidden="true" />
              <span>{data.contactBtn || copy.contactBtn}</span>
            </motion.button>

            <motion.a
              href="/curriculo-christian-sousa.pdf"
              download="Curriculo_Christian_Sousa.pdf"
              className="btn-secondary btn-download-cv"
              aria-label={copy.downloadResumeLabel}
              whileTap={{ scale: 0.97 }}
            >
              <Download size={16} aria-hidden="true" />
              <span>{data.resumeBtn || copy.resumeBtn}</span>
            </motion.a>
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

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        lang={lang}
      />
    </section>
  );
}

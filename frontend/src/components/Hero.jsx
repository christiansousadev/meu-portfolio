// frontend/src/components/Hero.jsx
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Mail, ArrowUpRight, MapPin } from "lucide-react";
import { EASE_OUT, trackSpotlight } from "../utils/motion";

const CONTACT_EMAIL = "christiansousadev@gmail.com";

const CREDENTIALS = [
  {
    value: "+6 anos",
    label: "Trajetória dedicada em TI, ERPs e automação",
  },
  {
    value: "ITIL® 4",
    label: "Gestão de serviços, incidentes e mudanças (Axelos)",
  },
  {
    value: "ISO 27001 & LGPD",
    label: "Auditoria estruturada, segurança e minimização",
  },
  {
    value: "Python & SQL",
    label: "FastAPI, PostgreSQL, integrações n8n e RAG",
  },
];

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

const TILT_SPRING = { stiffness: 140, damping: 18, mass: 0.6 };

function PortraitFrame() {
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
          <img
            src="/images/hero_developer.png"
            alt="Ilustração autoral de Christian Sousa em seu ambiente de desenvolvimento"
            className="hero-avatar"
          />
          <figcaption className="hero-portrait-caption">
            <MapPin size={13} aria-hidden="true" />
            <span>Fortaleza, CE</span>
          </figcaption>
        </motion.figure>
      </div>
    </motion.div>
  );
}

export default function Hero({ data }) {
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
            <span>Disponível para novos projetos e liderança técnica</span>
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
              aria-label={`Enviar e-mail para ${CONTACT_EMAIL}`}
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

        <PortraitFrame />
      </motion.div>

      <motion.dl
        className="hero-credentials-bar"
        aria-label="Resumo de qualificações"
        initial="hidden"
        animate="show"
        variants={credentialsContainer}
      >
        {CREDENTIALS.map((item) => (
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

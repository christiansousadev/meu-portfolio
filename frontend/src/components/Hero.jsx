// frontend/src/components/Hero.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, FileText, ArrowRight, Sparkles } from "lucide-react";

const CONTACT_EMAIL = "christiansousadev@gmail.com";
const RESUME_URL = "/cv.pdf";

const ROLES = [
  "Software Engineer & Tech Lead",
  "Especialista em Governança de TI & ITIL",
  "Arquiteto de Microsserviços Python / FastAPI",
  "Engenheiro de Soluções com IA & RAG",
];

export default function Hero({ data }) {
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section-container" style={{ minHeight: "88vh", paddingTop: "40px" }}>
      <motion.div
        className="section-text"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Badge de Disponibilidade */}
        <div className="status-badge">
          <span className="status-dot" />
          <span>Disponível para novos projetos & liderança técnica</span>
        </div>

        {/* Título Principal */}
        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "16px",
            letterSpacing: "-0.03em",
          }}
        >
          {data.greeting}{" "}
          <span className="wave" role="img" aria-label="acenando">
            👋
          </span>
        </h1>

        {/* Ticker Rotativo de Especialidades */}
        <div
          style={{
            height: "42px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={roleIndex}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                fontSize: "clamp(1.1rem, 2.5vw, 1.45rem)",
                fontWeight: 700,
                color: "var(--accent-color)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={20} />
              <span>{ROLES[roleIndex]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtítulo Descritivo */}
        <p
          style={{
            fontSize: "1.12rem",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            marginBottom: "32px",
            maxWidth: "580px",
          }}
        >
          {data.subtitle}
        </p>

        {/* Botões de Chamada para Ação (CTAs) */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="btn-primary"
            style={{ textDecoration: "none" }}
            aria-label={`Enviar email para ${CONTACT_EMAIL}`}
          >
            <Mail size={18} aria-hidden="true" /> {data.contactBtn}
          </a>

          <a
            href={RESUME_URL}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ textDecoration: "none" }}
            aria-label="Baixar curriculo em pdf"
          >
            <FileText size={18} aria-hidden="true" /> {data.resumeBtn}
          </a>

          <a
            href="#projects"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "6px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.color = "var(--accent-color)")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
          >
            Ver Portfólio <ArrowRight size={16} />
          </a>
        </div>

        {/* Grid de Métricas Rápidas */}
        <div className="metrics-grid">
          <div className="metric-pill">
            <span className="metric-value">+6 Anos</span>
            <span className="metric-label">Trajetória em TI</span>
          </div>
          <div className="metric-pill">
            <span className="metric-value">ITIL / ISO</span>
            <span className="metric-label">Governança & SLA</span>
          </div>
          <div className="metric-pill">
            <span className="metric-value">+20 Soluções</span>
            <span className="metric-label">Pipelines & ERPs</span>
          </div>
          <div className="metric-pill">
            <span className="metric-value">Same-Origin</span>
            <span className="metric-label">Docker Zero-Trust</span>
          </div>
        </div>
      </motion.div>

      {/* Imagem com Aura Glassmorphism */}
      <motion.div
        className="section-image"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <img
          src="/images/hero_developer.png"
          alt="Christian Sousa - Workspace de Desenvolvimento e Governança"
        />
      </motion.div>
    </section>
  );
}

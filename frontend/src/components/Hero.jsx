// frontend/src/components/Hero.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, FileText, ArrowRight } from "lucide-react";

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
    <section className="section-container hero-section">
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

        {/* Eyebrow de Especialidade */}
        <span className="eyebrow" style={{ display: "block", marginBottom: "8px" }}>
          Engenharia de Software · Governança · Cloud
        </span>

        {/* Título Principal */}
        <h1 className="hero-title">
          {data.greeting}{" "}
          <span className="wave" role="img" aria-label="acenando">
            👋
          </span>
        </h1>

        {/* Ticker de Especialidades */}
        <div className="hero-ticker">
          <span className="hero-ticker-prefix">Foco de Atuação:</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={roleIndex}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="hero-ticker-role"
            >
              <span>{ROLES[roleIndex]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtítulo Descritivo */}
        <p className="hero-subtitle">{data.subtitle}</p>

        {/* Botões de Chamada para Ação (CTAs) */}
        <div className="hero-actions">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="btn-primary"
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
            aria-label="Baixar curriculo em pdf"
          >
            <FileText size={18} aria-hidden="true" /> {data.resumeBtn}
          </a>

          <a href="#projects" className="hero-link-more">
            Ver Portfólio <ArrowRight size={16} />
          </a>
        </div>

        {/* Grid de Métricas Rápidas (Bento) */}
        <div className="metrics-grid">
          <div className="metric-pill">
            <span className="metric-value">+6 Anos</span>
            <span className="metric-label">Trajetória em TI</span>
          </div>
          <div className="metric-pill">
            <span className="metric-value">ITIL® 4</span>
            <span className="metric-label">Governança & ISO</span>
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

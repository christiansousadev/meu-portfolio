// frontend/src/components/Hero.jsx
import { motion } from "framer-motion";
import { Mail, FileText } from "lucide-react";

// destinos dos ctas; mantidos como constantes para facilitar manutencao
// sem depender de schema adicional no backend
const CONTACT_EMAIL = "christiansousadev@gmail.com";
const RESUME_URL = "/cv.pdf";

// RENDERIZA A SECAO PRINCIPAL DE APRESENTACAO
export default function Hero({ data }) {
  return (
    <section className="section-container" style={{ minHeight: "85vh" }}>
      <motion.div
        className="section-text"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h1
          className="hero-title"
          style={{
            fontSize: "4rem",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: "20px"
          }}
        >
          {data.greeting}{" "}
          <span className="wave" role="img" aria-label="acenando">
            👋
          </span>
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "30px"
          }}
        >
          {data.subtitle}
        </p>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          {/* cta de contato: dispara o cliente de email padrao do usuario */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="btn-primary"
            style={{ textDecoration: "none" }}
            aria-label={`Enviar email para ${CONTACT_EMAIL}`}
          >
            <Mail size={18} aria-hidden="true" /> {data.contactBtn}
          </a>

          {/* cta de download: arquivo estatico servido a partir de /public */}
          <a
            href={RESUME_URL}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              backgroundColor: "var(--card-bg)",
              color: "var(--text-color)",
              border: "1px solid var(--card-border)",
              backdropFilter: "blur(10px)",
              textDecoration: "none"
            }}
            aria-label="Baixar curriculo em pdf"
          >
            <FileText size={18} aria-hidden="true" /> {data.resumeBtn}
          </a>
        </div>
      </motion.div>
      <motion.div
        className="section-image"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <img src="/images/hero_developer.png" alt="Developer Workspace" />
      </motion.div>
    </section>
  );
}

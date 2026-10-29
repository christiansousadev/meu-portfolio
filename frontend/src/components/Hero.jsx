// frontend/src/components/Hero.jsx
import { Mail, ArrowUpRight } from "lucide-react";

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

export default function Hero({ data }) {
  return (
    <section className="hero-section">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            Engenharia de Software · Automação & Governança de TI
          </p>

          <h1 className="hero-title">{data.greeting}</h1>

          <p className="hero-subtitle">{data.subtitle}</p>

          <div className="hero-actions">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="btn-primary"
              aria-label={`Enviar e-mail para ${CONTACT_EMAIL}`}
            >
              <Mail size={16} aria-hidden="true" />
              <span>{data.contactBtn}</span>
            </a>

            <a href="#experience" className="btn-secondary">
              <span>{data.resumeBtn}</span>
            </a>

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
          </div>
        </div>

        <div className="hero-media">
          <figure className="hero-portrait-frame">
            <img
              src="/images/hero_developer.png"
              alt="Ilustração autoral de Christian Sousa em seu ambiente de desenvolvimento"
              className="hero-avatar"
            />
          </figure>
        </div>
      </div>

      <dl className="hero-credentials-bar" aria-label="Resumo de qualificações">
        {CREDENTIALS.map((item) => (
          <div key={item.value} className="credential-cell">
            <dt className="credential-value">{item.value}</dt>
            <dd className="credential-label">{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

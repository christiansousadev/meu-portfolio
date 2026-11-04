// frontend/src/components/Hero.jsx
import { useEffect, useState } from "react";
import EngineeringSchematic from "./EngineeringSchematic";

export const CONTACT_EMAIL = "christiansousadev@gmail.com";

const HERO_COPY = {
  pt: {
    copyEmail: "Copiar e-mail",
    copied: "Copiado",
    emailLabel: `Enviar e-mail para ${CONTACT_EMAIL}`,
    links: "Perfis externos",
  },
  en: {
    copyEmail: "Copy email",
    copied: "Copied",
    emailLabel: `Send an email to ${CONTACT_EMAIL}`,
    links: "External profiles",
  },
};

export default function Hero({ data, lang = "pt" }) {
  const copy = HERO_COPY[lang] || HERO_COPY.pt;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch (error) {
      console.warn("clipboard indisponível; o e-mail segue selecionável", error);
    }
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">
          {data.greeting}
        </h1>

        <div className="hero-aside">
          <p className="hero-byline">{data.subtitle}</p>

          <div className="hero-contact">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="btn-primary"
              aria-label={copy.emailLabel}
            >
              {data.contactBtn}
            </a>
            <span className="hero-email">
              <span className="hero-email-address">{CONTACT_EMAIL}</span>
              <button type="button" className="btn-text" onClick={copyEmail}>
                {copied ? copy.copied : copy.copyEmail}
              </button>
              <span className="visually-hidden" role="status">
                {copied ? copy.copied : ""}
              </span>
            </span>
          </div>

          <nav className="hero-links" aria-label={copy.links}>
            <a href="#experience">{data.resumeBtn}</a>
            <a href="https://github.com/christiansousadev" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/christiansousasilva/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </nav>
        </div>
      </div>

      <EngineeringSchematic lang={lang} />
    </section>
  );
}

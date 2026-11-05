// frontend/src/components/Certifications.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, GraduationCap } from "lucide-react";
import {
  VIEWPORT_ONCE,
  revealContainer,
  revealItem,
  trackSpotlight,
} from "../utils/motion";

const VERIFY_LABEL = { pt: "Verificar credencial", en: "Verify credential" };

export default function Certifications({ data, lang = "pt" }) {
  const [hasInView, setHasInView] = useState(false);

  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  return (
    <section id="certifications" className="section-block">
      <motion.div
        className="section-header"
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={revealContainer}
      >
        <motion.h2 className="section-title" variants={revealItem}>
          {data.title}
        </motion.h2>
        {data.subtitle && (
          <motion.p className="section-subtitle" variants={revealItem}>
            {data.subtitle}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        className="cert-grid"
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        onViewportEnter={() => setHasInView(true)}
        animate={hasInView ? "show" : undefined}
        variants={revealContainer}
      >
        {data.items.map((cert, index) => (
          <motion.article
            key={index}
            className="surface-card cert-card spotlight"
            variants={revealItem}
            whileHover={{ y: -3 }}
            onPointerMove={trackSpotlight}
          >
            <div className="cert-top-layout">
              {cert.badge_url ? (
                <div className="cert-badge-wrapper">
                  <img
                    src={cert.badge_url}
                    alt=""
                    className="cert-badge-img"
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="cert-badge-placeholder" aria-hidden="true">
                  {cert.credential_url ? (
                    <BadgeCheck size={24} />
                  ) : (
                    <GraduationCap size={24} />
                  )}
                </div>
              )}

              <div className="cert-header-text">
                <div className="cert-meta-row">
                  <span className="cert-issuer">
                    {!cert.badge_url && (
                      cert.credential_url ? (
                        <span className="cert-seal" aria-hidden="true">
                          <BadgeCheck size={14} />
                        </span>
                      ) : (
                        <span className="cert-seal cert-seal--neutral" aria-hidden="true">
                          <GraduationCap size={14} />
                        </span>
                      )
                    )}
                    {cert.issuer}
                  </span>
                  {cert.year && <span className="cert-year">{cert.year}</span>}
                </div>
                <h3 className="cert-name">{cert.name}</h3>
              </div>
            </div>

            <div className="cert-body">
              {cert.description && <p className="cert-desc">{cert.description}</p>}
            </div>

            {cert.credential_url && (
              <div className="cert-link-row">
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cert-link"
                >
                  <span>{VERIFY_LABEL[lang] || VERIFY_LABEL.pt}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            )}
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

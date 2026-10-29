// frontend/src/components/Certifications.jsx
import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import {
  VIEWPORT_ONCE,
  revealContainer,
  revealItem,
  trackSpotlight,
} from "../utils/motion";

export default function Certifications({ data }) {
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
        variants={revealContainer}
      >
        {data.items.map((cert, index) => (
          <motion.article
            key={`${cert.name}-${index}`}
            className="surface-card cert-card spotlight"
            variants={revealItem}
            whileHover={{ y: -3 }}
            onPointerMove={trackSpotlight}
          >
            <div className="cert-body">
              <div className="cert-meta-row">
                <span className="cert-issuer">
                  <span className="cert-seal" aria-hidden="true">
                    <BadgeCheck size={14} />
                  </span>
                  {cert.issuer}
                </span>
                {cert.year && <span className="cert-year">{cert.year}</span>}
              </div>

              <h3 className="cert-name">{cert.name}</h3>
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
                  <span>Verificar credencial</span>
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

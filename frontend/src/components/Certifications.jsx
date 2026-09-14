// frontend/src/components/Certifications.jsx
import { motion } from "framer-motion";
import { Award, ShieldCheck, ExternalLink } from "lucide-react";

export default function Certifications({ data }) {
  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  return (
    <motion.section
      id="certifications"
      className="section-block"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div className="section-header">
        <span className="eyebrow">{data.subtitle}</span>
        <h2 className="section-title">{data.title}</h2>
        <p className="section-subtitle">
          Credenciais reconhecidas em gestão de serviços de TI, padrões internacionais de segurança e arquitetura de software.
        </p>
      </div>

      <div className="cert-grid">
        {data.items.map((cert, index) => (
          <motion.div
            key={index}
            className="glass-card cert-card"
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div>
              <div className="cert-card-top">
                <div className="cert-icon">
                  <Award size={22} />
                </div>
                {cert.year && <span className="cert-year">{cert.year}</span>}
              </div>

              <h3 className="cert-name">{cert.name}</h3>

              <div className="cert-issuer">
                <ShieldCheck size={16} />
                <span>{cert.issuer}</span>
              </div>

              <p className="cert-desc">{cert.description}</p>
            </div>

            {cert.credential_url && (
              <div className="cert-link-row">
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cert-link"
                >
                  Verificar Credencial <ExternalLink size={14} />
                </a>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

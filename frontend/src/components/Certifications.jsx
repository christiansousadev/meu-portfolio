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
      style={{ padding: "80px 0" }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            marginBottom: "10px",
            letterSpacing: "-0.02em",
          }}
        >
          {data.title}
        </h2>
        <p
          style={{
            color: "var(--accent-color)",
            fontSize: "0.85rem",
            letterSpacing: "2px",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "15px",
          }}
        >
          {data.subtitle}
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto" }}>
          Credenciais reconhecidas em gestão de serviços de TI, padrões internacionais de segurança e arquitetura de software.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {data.items.map((cert, index) => (
          <motion.div
            key={index}
            className="glass-card"
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "var(--accent-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-color)",
                  }}
                >
                  <Award size={24} />
                </div>

                {cert.year && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      background: "var(--card-border)",
                      padding: "4px 10px",
                      borderRadius: "12px",
                    }}
                  >
                    {cert.year}
                  </span>
                )}
              </div>

              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  marginBottom: "8px",
                  lineHeight: 1.3,
                }}
              >
                {cert.name}
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--accent-color)",
                  marginBottom: "14px",
                }}
              >
                <ShieldCheck size={16} />
                <span>{cert.issuer}</span>
              </div>

              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.92rem",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {cert.description}
              </p>
            </div>

            {cert.credential_url && (
              <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--card-border)" }}>
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent-color)",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--text-color)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--accent-color)")}
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

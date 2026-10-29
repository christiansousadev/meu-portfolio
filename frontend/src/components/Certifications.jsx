// frontend/src/components/Certifications.jsx
import { ArrowUpRight } from "lucide-react";

export default function Certifications({ data }) {
  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  return (
    <section id="certifications" className="section-block">
      <div className="section-header">
        {data.subtitle && <span className="section-kicker">{data.subtitle}</span>}
        <h2 className="section-title">{data.title}</h2>
      </div>

      <div className="cert-grid">
        {data.items.map((cert, index) => (
          <article key={`${cert.name}-${index}`} className="surface-card cert-card">
            <div className="cert-body">
              <div className="cert-meta-row">
                <span className="cert-issuer">{cert.issuer}</span>
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
          </article>
        ))}
      </div>
    </section>
  );
}

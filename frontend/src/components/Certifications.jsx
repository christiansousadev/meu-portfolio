// frontend/src/components/Certifications.jsx
//
// Distinção honesta: só credencial com emissor e link externo recebe o
// carimbo de conferência. O restante aparece como formação técnica, sem selo.

const CERT_COPY = {
  pt: {
    verified: "Credenciais verificáveis",
    training: "Especializações e formação técnica",
    stamp: "conferível",
    check: "Consultar no emissor",
    checkLabel: (name) => `Consultar ${name} no site do emissor (abre em nova aba)`,
  },
  en: {
    verified: "Verifiable credentials",
    training: "Specializations and technical training",
    stamp: "verifiable",
    check: "Check with the issuer",
    checkLabel: (name) => `Check ${name} on the issuer's website (opens in a new tab)`,
  },
};

const isVerifiable = (cert) => /^https?:\/\//i.test(String(cert.credential_url || "").trim());

export default function Certifications({ data, lang = "pt" }) {
  const copy = CERT_COPY[lang] || CERT_COPY.pt;
  const items = data?.items || [];
  if (!items.length) return null;

  const verified = items.filter(isVerifiable);
  const training = items.filter((c) => !isVerifiable(c));

  return (
    <section id="certifications" className="section" aria-labelledby="certifications-title">
      <header className="section-head">
        <h2 id="certifications-title" className="section-title">
          {data.title}
        </h2>
        {data.subtitle && <p className="section-lede">{data.subtitle}</p>}
      </header>

      {verified.length > 0 && (
        <div className="cred-group">
          <h3 className="cred-group-title">{copy.verified}</h3>
          <ul className="cred-list">
            {verified.map((cert, idx) => (
              <li key={`${cert.name}-${idx}`} className="cred-row cred-row--verified">
                <p className="cred-meta">
                  <span className="stamp-mark">{copy.stamp}</span>
                  <span>{cert.issuer}</span>
                  {cert.year && <span className="tnum">{cert.year}</span>}
                </p>
                <h4 className="cred-name">{cert.name}</h4>
                {cert.description && <p className="cred-desc">{cert.description}</p>}
                <a
                  className="evidence-link"
                  href={cert.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={copy.checkLabel(cert.name)}
                >
                  {copy.check}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {training.length > 0 && (
        <div className="cred-group">
          <h3 className="cred-group-title">{copy.training}</h3>
          <ul className="cred-list">
            {training.map((cert, idx) => (
              <li key={`${cert.name}-${idx}`} className="cred-row">
                <p className="cred-meta">
                  <span>{cert.issuer}</span>
                  {cert.year && <span className="tnum">{cert.year}</span>}
                </p>
                <h4 className="cred-name">{cert.name}</h4>
                {cert.description && <p className="cred-desc">{cert.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// frontend/src/components/Projects.jsx
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

// RENDERIZA A SEÇÃO DE PROJETOS EM DESTAQUE
export default function Projects({ data }) {
  // validação defensiva para evitar quebra de ui caso o payload falhe
  if (!data || !data.items) {
    console.warn(
      "dados de projetos ausentes, abortando renderização do componente"
    );
    return null;
  }

  return (
    <motion.section 
      id="projects" 
      style={{ padding: "50px 0" }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <h2
        style={{
          fontSize: "2.5rem",
          marginBottom: "40px",
          color: "var(--text-color)"
        }}
      >
        {data.title}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "25px"
        }}
      >
        {data.items.map((project, index) => (
          <motion.div
            key={index}
            className="glass-card"
            style={{
              padding: "30px",
              display: "flex",
              flexDirection: "column"
            }}
            whileHover={{ y: -5 }}
          >
            <div style={{ flexGrow: 1 }}>
              <h3
                style={{
                  fontSize: "1.4rem",
                  marginBottom: "15px",
                  color: "var(--text-color)"
                }}
              >
                {project.name}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "25px",
                  fontSize: "1rem"
                }}
              >
                {project.desc}
              </p>
            </div>

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--accent-color)",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  marginTop: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={e => e.target.style.color = "var(--text-color)"}
                onMouseLeave={e => e.target.style.color = "var(--accent-color)"}
              >
                Ver Repositório <ExternalLink size={16} />
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

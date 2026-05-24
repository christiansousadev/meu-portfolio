// frontend/src/components/Skills.jsx
import { motion } from "framer-motion";

// RENDERIZA AS HABILIDADES E TECNOLOGIAS
export default function Skills({ data }) {
  return (
    <motion.section 
      id="skills" 
      className="section-container"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="section-image">
        <img
          src="/images/skills_tech.png"
          alt="Skills and Tech Stack"
        />
      </div>
      <div className="section-text">
        <h1 style={{ fontSize: "3rem", marginBottom: "10px" }}>{data.title}</h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1rem",
            letterSpacing: "1px",
            marginBottom: "30px"
          }}
        >
          {data.subtitle}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "30px"
          }}
        >
          {data.tags.map((tag, i) => (
            <motion.span
              key={i}
              whileHover={{ scale: 1.05 }}
              style={{
                background: "var(--accent-color)",
                color: "#FFF",
                padding: "8px 15px",
                borderRadius: "20px",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "default"
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {data.items.map((item, i) => (
            <p
              key={i}
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.5,
                color: "var(--text-secondary)"
              }}
            >
              {item}
            </p>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// frontend/src/components/Experience.jsx
import { motion } from "framer-motion";

// RENDERIZA OS CARDS DE EXPERIENCIA PROFISSIONAL
export default function Experience({ data }) {
  return (
    <motion.section 
      id="experience" 
      style={{ padding: "80px 0" }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <h1
        style={{ fontSize: "3rem", textAlign: "center", marginBottom: "50px" }}
      >
        {data.title}
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px"
        }}
      >
        {data.items.map((exp, i) => (
          <motion.div
            key={i}
            className="glass-card"
            style={{
              padding: "30px"
            }}
            whileHover={{ y: -5 }}
          >
            <h3
              style={{
                fontSize: "1.5rem",
                color: "var(--accent-color)",
                marginBottom: "10px"
              }}
            >
              {exp.company}
            </h3>

            {/* empilha cargo e data para evitar quebra de layout em strings longas */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "15px"
              }}
            >
              <h4 style={{ fontSize: "1.2rem", margin: 0, lineHeight: "1.3" }}>
                {exp.role}
              </h4>
              {exp.time && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    fontSize: "0.82rem",
                    color: "var(--text-color)",
                    fontWeight: "bold",
                    background: "var(--accent-color)",
                    padding: "4px 10px",
                    borderRadius: "12px"
                  }}
                >
                  {exp.time}
                </span>
              )}
            </div>

            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {exp.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

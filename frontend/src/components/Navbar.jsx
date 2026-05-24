// frontend/src/components/Navbar.jsx
import { motion } from "framer-motion";
import { Sun, Moon, Globe, LogIn } from "lucide-react";

// RENDERIZA O CABECALHO E BOTOES DE TEMA/IDIOMA
export default function Navbar({ t, theme, setTheme, lang, setLang }) {
  const nextLang = lang === "pt" ? "en" : "pt";
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <motion.nav
      className="glass-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        padding: "20px 5%"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto"
        }}
      >
        <h2
          className="text-gradient"
          style={{
            fontSize: "1.8rem",
            margin: 0,
            fontWeight: "900",
            letterSpacing: "-1px"
          }}
        >
          &lt;Christian /&gt;
        </h2>
        <div
          style={{ display: "flex", alignItems: "center", gap: "20px" }}
          className="navbar-links"
        >
          <a
            href="#skills"
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color 0.2s ease"
            }}
            onMouseEnter={e => (e.target.style.color = "var(--accent-color)")}
            onMouseLeave={e => (e.target.style.color = "var(--text-color)")}
          >
            {t.nav.skills}
          </a>
          <a
            href="#experience"
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color 0.2s ease"
            }}
            onMouseEnter={e => (e.target.style.color = "var(--accent-color)")}
            onMouseLeave={e => (e.target.style.color = "var(--text-color)")}
          >
            {t.nav.exp}
          </a>
          <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setLang(nextLang)}
              title="Trocar Idioma"
              aria-label={`Trocar idioma para ${nextLang.toUpperCase()}`}
            >
              <Globe size={20} aria-hidden="true" />
              <span
                style={{
                  fontSize: "0.8rem",
                  marginLeft: "5px",
                  fontWeight: "bold"
                }}
              >
                {nextLang.toUpperCase()}
              </span>
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setTheme(nextTheme)}
              title="Alternar Tema"
              aria-label={`Alternar para tema ${nextTheme}`}
              aria-pressed={theme === "dark"}
            >
              {theme === "dark" ? (
                <Sun size={20} aria-hidden="true" />
              ) : (
                <Moon size={20} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className="btn-icon"
              onClick={() => (window.location.href = "/admin")}
              title="Login Admin"
              aria-label="Acessar area administrativa"
              style={{ marginLeft: "10px" }}
            >
              <LogIn size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

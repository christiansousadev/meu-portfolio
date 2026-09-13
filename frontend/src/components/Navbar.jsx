// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Globe, LogIn, Menu, X, Award, Briefcase, Code, FolderGit2 } from "lucide-react";

export default function Navbar({ t, theme, setTheme, lang, setLang }) {
  const nextLang = lang === "pt" ? "en" : "pt";
  const nextTheme = theme === "dark" ? "light" : "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Rastreia a seção visível para destacar no menu
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["skills", "experience", "projects", "certifications"];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#skills", label: t.nav.skills, id: "skills", icon: Code },
    { href: "#experience", label: t.nav.exp, id: "experience", icon: Briefcase },
    { href: "#projects", label: t.nav.proj, id: "projects", icon: FolderGit2 },
    { href: "#certifications", label: t.nav.certs || "Certificações", id: "certifications", icon: Award },
  ];

  return (
    <>
      <motion.nav
        className="glass-nav"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          padding: "16px 5%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Logo */}
          <a
            href="#"
            style={{ textDecoration: "none" }}
            aria-label="Ir para o topo"
          >
            <h2
              className="text-gradient"
              style={{
                fontSize: "1.75rem",
                margin: 0,
                fontWeight: "900",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>&lt;Christian</span>
              <span style={{ color: "var(--accent-color)" }}>/&gt;</span>
            </h2>
          </a>

          {/* Links Desktop */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
            className="navbar-desktop"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    style={{
                      color: isActive ? "var(--accent-color)" : "var(--text-color)",
                      textDecoration: "none",
                      fontWeight: isActive ? "700" : "500",
                      fontSize: "0.95rem",
                      transition: "all 0.2s ease",
                      position: "relative",
                      padding: "4px 0",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "var(--accent-color)")}
                    onMouseLeave={(e) => (e.target.style.color = isActive ? "var(--accent-color)" : "var(--text-color)")}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          left: 0,
                          right: 0,
                          height: "2px",
                          background: "var(--accent-color)",
                          borderRadius: "2px",
                        }}
                      />
                    )}
                  </a>
                );
              })}
            </div>

            {/* Controles: Idioma, Tema, Admin */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingLeft: "16px",
                borderLeft: "1px solid var(--card-border)",
              }}
            >
              <button
                type="button"
                className="btn-icon"
                onClick={() => setLang(nextLang)}
                title={`Mudar para ${nextLang.toUpperCase()}`}
                aria-label={`Trocar idioma para ${nextLang.toUpperCase()}`}
              >
                <Globe size={18} aria-hidden="true" />
                <span
                  style={{
                    fontSize: "0.78rem",
                    marginLeft: "4px",
                    fontWeight: "700",
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
                  <Sun size={18} aria-hidden="true" />
                ) : (
                  <Moon size={18} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                className="btn-icon"
                onClick={() => (window.location.href = "/admin")}
                title="Painel de Governança / Admin"
                aria-label="Acessar painel de governança de TI"
              >
                <LogIn size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Botão Hambúrguer Mobile */}
          <div className="navbar-mobile-toggle" style={{ display: "none" }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Drawer Mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                overflow: "hidden",
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: "1px solid var(--card-border)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.id}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        color: activeSection === link.id ? "var(--accent-color)" : "var(--text-color)",
                        textDecoration: "none",
                        fontWeight: "600",
                        padding: "10px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: activeSection === link.id ? "var(--accent-light)" : "transparent",
                      }}
                    >
                      <Icon size={18} />
                      {link.label}
                    </a>
                  );
                })}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    paddingTop: "10px",
                    borderTop: "1px solid var(--card-border)",
                  }}
                >
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      setLang(nextLang);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Globe size={18} />
                    <span style={{ marginLeft: "6px", fontWeight: "700" }}>
                      {nextLang.toUpperCase()}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      setTheme(nextTheme);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => (window.location.href = "/admin")}
                  >
                    <LogIn size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @media (max-width: 768px) {
            .navbar-desktop { display: none !important; }
            .navbar-mobile-toggle { display: block !important; }
          }
        `}</style>
      </motion.nav>
    </>
  );
}

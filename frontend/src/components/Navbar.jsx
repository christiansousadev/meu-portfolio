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
    <motion.nav
      className="glass-nav navbar"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="navbar-inner">
        {/* Logo */}
        <a href="#" className="navbar-logo" aria-label="Ir para o topo">
          <h2 className="text-gradient navbar-logo-title">
            <span>&lt;Christian</span>
            <span className="navbar-logo-bracket">/&gt;</span>
          </h2>
        </a>

        {/* Links Desktop */}
        <div className="navbar-desktop">
          <div className="navbar-links">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`navbar-link ${isActive ? "is-active" : ""}`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div layoutId="navIndicator" className="navbar-link-indicator" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Controles: Idioma, Tema, Admin */}
          <div className="navbar-controls">
            <button
              type="button"
              className="btn-icon btn-icon--labeled"
              onClick={() => setLang(nextLang)}
              title={`Mudar para ${nextLang.toUpperCase()}`}
              aria-label={`Trocar idioma para ${nextLang.toUpperCase()}`}
            >
              <Globe size={18} aria-hidden="true" />
              <span className="navbar-lang-code">{nextLang.toUpperCase()}</span>
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
        <div className="mobile-toggle">
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
            className="mobile-drawer"
          >
            <div className="mobile-drawer-links">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-drawer-link ${isActive ? "is-active" : ""}`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </a>
                );
              })}

              <div className="mobile-drawer-controls">
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => {
                    setLang(nextLang);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Globe size={18} />
                  <span className="navbar-lang-code">{nextLang.toUpperCase()}</span>
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
    </motion.nav>
  );
}

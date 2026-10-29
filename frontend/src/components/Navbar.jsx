// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Globe, Lock, Menu, X } from "lucide-react";

export default function Navbar({ t, theme, setTheme, lang, setLang }) {
  const nextLang = lang === "pt" ? "en" : "pt";
  const nextTheme = theme === "dark" ? "light" : "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["skills", "experience", "projects", "certifications"];
      const scrollPos = window.scrollY + 180;

      if (window.scrollY < 200) {
        setActiveSection("");
        return;
      }

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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#skills", label: t.nav.skills, id: "skills" },
    { href: "#experience", label: t.nav.exp, id: "experience" },
    { href: "#projects", label: t.nav.proj, id: "projects" },
    { href: "#certifications", label: t.nav.certs || "Certificações", id: "certifications" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="#" className="navbar-logo" aria-label="Ir para o início">
          <span className="navbar-brand-name">Christian Sousa</span>
          <span className="navbar-brand-sep" aria-hidden="true">/</span>
          <span className="navbar-brand-role">Engenharia & Governança</span>
        </a>

        <div className="navbar-desktop">
          <nav className="navbar-links" aria-label="Seções principais">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`navbar-link ${isActive ? "is-active" : ""}`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="navbar-controls">
            <button
              type="button"
              className="btn-icon btn-icon--labeled"
              onClick={() => setLang(nextLang)}
              title={`Mudar idioma para ${nextLang.toUpperCase()}`}
              aria-label={`Mudar idioma para ${nextLang.toUpperCase()}`}
            >
              <Globe size={15} aria-hidden="true" />
              <span className="navbar-lang-code">{nextLang.toUpperCase()}</span>
            </button>

            <button
              type="button"
              className="btn-icon"
              onClick={() => setTheme(nextTheme)}
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              aria-label={`Alternar para tema ${nextTheme}`}
              aria-pressed={theme === "dark"}
            >
              {theme === "dark" ? (
                <Sun size={16} aria-hidden="true" />
              ) : (
                <Moon size={16} aria-hidden="true" />
              )}
            </button>

            <a
              href="/admin"
              className="btn-icon"
              title="Console de Governança"
              aria-label="Acessar console de governança"
            >
              <Lock size={15} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mobile-toggle">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-drawer"
          >
            <nav className="mobile-drawer-links" aria-label="Menu móvel">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-drawer-link ${isActive ? "is-active" : ""}`}
                  >
                    {link.label}
                  </a>
                );
              })}

              <div className="mobile-drawer-controls">
                <button
                  type="button"
                  className="btn-icon btn-icon--labeled"
                  onClick={() => {
                    setLang(nextLang);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Globe size={16} />
                  <span className="navbar-lang-code">{nextLang.toUpperCase()}</span>
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => {
                    setTheme(nextTheme);
                    setMobileMenuOpen(false);
                  }}
                  aria-label="Alternar tema"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <a href="/admin" className="btn-icon" aria-label="Console de Governança">
                  <Lock size={16} />
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

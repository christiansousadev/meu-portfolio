// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Globe, Lock, Menu, X } from "lucide-react";
import { EASE_OUT, SPRING_INDICATOR } from "../utils/motion";

const NAV_COPY = {
  pt: {
    home: "Ir para o início",
    role: "Engenharia & Governança",
    sections: "Seções principais",
    certsFallback: "Certificações",
    switchLang: "Mudar idioma para inglês",
    lightTheme: "Ativar tema claro",
    darkTheme: "Ativar tema escuro",
    console: "Acessar console de governança",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    mobileMenu: "Menu móvel",
  },
  en: {
    home: "Go to top",
    role: "Engineering & Governance",
    sections: "Main sections",
    certsFallback: "Certifications",
    switchLang: "Switch language to Portuguese",
    lightTheme: "Switch to light theme",
    darkTheme: "Switch to dark theme",
    console: "Open governance console",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mobileMenu: "Mobile menu",
  },
};

// Mostra os dois idiomas com o atual destacado: o visitante sabe onde está
// e para onde o clique leva, sem depender de ícone ou bandeira.
function LangToggle({ lang, onToggle, label }) {
  return (
    <button
      type="button"
      className="btn-icon btn-icon--labeled lang-toggle"
      onClick={onToggle}
      title={label}
      aria-label={label}
    >
      <Globe size={15} aria-hidden="true" />
      <span className="lang-toggle-options" aria-hidden="true">
        {["pt", "en"].map((code) => (
          <span
            key={code}
            className={`lang-toggle-option ${lang === code ? "is-current" : ""}`}
          >
            {code.toUpperCase()}
          </span>
        ))}
      </span>
    </button>
  );
}

export default function Navbar({ t, theme, setTheme, lang, setLang }) {
  const nextLang = lang === "pt" ? "en" : "pt";
  const nextTheme = theme === "dark" ? "light" : "dark";
  const copy = NAV_COPY[lang] || NAV_COPY.pt;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);

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

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#skills", label: t.nav.skills, id: "skills" },
    { href: "#experience", label: t.nav.exp, id: "experience" },
    { href: "#projects", label: t.nav.proj, id: "projects" },
    { href: "#certifications", label: t.nav.certs || copy.certsFallback, id: "certifications" },
  ];

  const themeLabel = theme === "dark" ? copy.lightTheme : copy.darkTheme;

  return (
    <header className={`navbar ${isScrolled || mobileMenuOpen ? "is-scrolled" : ""}`}>
      <div className="navbar-inner">
        <a href="#" className="navbar-logo" aria-label={copy.home}>
          <span className="navbar-mark" aria-hidden="true">
            <img
              src="/images/logo.png"
              alt=""
              className="navbar-logo-img"
              width={18}
              height={18}
            />
          </span>
          <span className="navbar-brand-name">Christian Sousa</span>
          <span className="navbar-brand-sep" aria-hidden="true">/</span>
          <span className="navbar-brand-role">{copy.role}</span>
        </a>

        <div className="navbar-desktop">
          <nav
            className="navbar-links"
            aria-label={copy.sections}
            onMouseLeave={() => setHoveredLink(null)}
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`navbar-link ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "location" : undefined}
                  onMouseEnter={() => setHoveredLink(link.id)}
                  onFocus={() => setHoveredLink(link.id)}
                >
                  {hoveredLink === link.id && (
                    <motion.span
                      layoutId="navbar-hover"
                      className="navbar-link-hover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={SPRING_INDICATOR}
                    />
                  )}
                  <span className="navbar-link-label">{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active"
                      className="navbar-link-indicator"
                      transition={SPRING_INDICATOR}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="navbar-controls">
            <LangToggle lang={lang} onToggle={() => setLang(nextLang)} label={copy.switchLang} />

            <button
              type="button"
              className="btn-icon"
              onClick={() => setTheme(nextTheme)}
              title={themeLabel}
              aria-label={themeLabel}
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
              title={copy.console}
              aria-label={copy.console}
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
            aria-label={mobileMenuOpen ? copy.closeMenu : copy.openMenu}
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
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="mobile-drawer"
          >
            <nav className="mobile-drawer-links" aria-label={copy.mobileMenu}>
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
                <LangToggle
                  lang={lang}
                  onToggle={() => {
                    setLang(nextLang);
                    setMobileMenuOpen(false);
                  }}
                  label={copy.switchLang}
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => {
                    setTheme(nextTheme);
                    setMobileMenuOpen(false);
                  }}
                  aria-label={themeLabel}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <a href="/admin" className="btn-icon" aria-label={copy.console}>
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

// frontend/src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { EASE_OUT, SPRING_INDICATOR } from "../utils/motion";
import useDialog from "../hooks/useDialog";

const SECTION_IDS = ["skills", "experience", "projects", "certifications"];

const NAV_COPY = {
  pt: {
    home: "Christian Sousa, ir para o início",
    sections: "Seções",
    certsFallback: "Credenciais",
    language: "Idioma",
    langNames: { pt: "Português", en: "English" },
    theme: "Tema",
    toLight: "Usar tema claro",
    toDark: "Usar tema escuro",
    light: "Claro",
    dark: "Escuro",
    menu: "Menu",
    closeMenu: "Fechar menu",
    menuTitle: "Navegação",
  },
  en: {
    home: "Christian Sousa, go to top",
    sections: "Sections",
    certsFallback: "Credentials",
    language: "Language",
    langNames: { pt: "Português", en: "English" },
    theme: "Theme",
    toLight: "Use light theme",
    toDark: "Use dark theme",
    light: "Light",
    dark: "Dark",
    menu: "Menu",
    closeMenu: "Close menu",
    menuTitle: "Navigation",
  },
};

function LangSwitch({ lang, setLang, copy }) {
  return (
    <div className="lang-switch" role="group" aria-label={copy.language}>
      {["pt", "en"].map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          className="lang-switch-option"
          aria-pressed={lang === code}
          aria-label={`${code.toUpperCase()}, ${copy.langNames[code]}`}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Navbar({ t, theme, setTheme, lang, setLang }) {
  const copy = NAV_COPY[lang] || NAV_COPY.pt;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const themeLabel = theme === "dark" ? copy.toLight : copy.toDark;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const sheetRef = useRef(null);

  useDialog({
    open: sheetOpen,
    containerRef: sheetRef,
    onClose: () => setSheetOpen(false),
    lockScroll: true,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    // seção ativa = a primeira, em ordem do documento, que cruza a faixa logo
    // abaixo da navbar; o Hero na faixa limpa o destaque
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id || "hero";
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        });
        if (visible.has("hero")) {
          setActiveSection("");
          return;
        }
        const current = SECTION_IDS.find((id) => visible.has(id));
        if (current) setActiveSection(current);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    const hero = document.querySelector(".hero");
    if (hero) observer.observe(hero);
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { href: "#skills", label: t.nav.skills, id: "skills" },
    { href: "#experience", label: t.nav.exp, id: "experience" },
    { href: "#projects", label: t.nav.proj, id: "projects" },
    { href: "#certifications", label: t.nav.certs || copy.certsFallback, id: "certifications" },
  ];

  return (
    <header className={`navbar ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="navbar-inner">
        <a href="#top" className="navbar-brand" aria-label={copy.home}>
          <img src="/images/logo-64.webp" alt="" className="navbar-logo" width={24} height={24} />
          <span className="navbar-name">Christian Sousa</span>
        </a>

        <nav className="navbar-links" aria-label={copy.sections}>
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                className={`navbar-link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "location" : undefined}
              >
                {link.label}
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
          <LangSwitch lang={lang} setLang={setLang} copy={copy} />
          <button
            type="button"
            className="btn-icon"
            onClick={() => setTheme(nextTheme)}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost navbar-menu"
          aria-expanded={sheetOpen}
          aria-controls="nav-sheet"
          onClick={() => setSheetOpen(true)}
        >
          <Menu size={18} aria-hidden="true" />
          <span>{copy.menu}</span>
        </button>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="sheet-backdrop"
              className="sheet-backdrop"
              onClick={() => setSheetOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              key="sheet"
              id="nav-sheet"
              ref={sheetRef}
              className="sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="nav-sheet-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              <div className="sheet-head">
                <h2 id="nav-sheet-title" className="sheet-title">
                  {copy.menuTitle}
                </h2>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setSheetOpen(false)}
                  aria-label={copy.closeMenu}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <nav className="sheet-links" aria-label={copy.sections}>
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    className={`sheet-link ${activeSection === link.id ? "is-active" : ""}`}
                    aria-current={activeSection === link.id ? "location" : undefined}
                    onClick={() => setSheetOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <dl className="sheet-settings">
                <div className="sheet-setting">
                  <dt>{copy.language}</dt>
                  <dd>
                    <LangSwitch lang={lang} setLang={setLang} copy={copy} />
                  </dd>
                </div>
                <div className="sheet-setting">
                  <dt>{copy.theme}</dt>
                  <dd>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setTheme(nextTheme)}
                      aria-label={themeLabel}
                    >
                      {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
                      <span>{theme === "dark" ? copy.light : copy.dark}</span>
                    </button>
                  </dd>
                </div>
              </dl>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

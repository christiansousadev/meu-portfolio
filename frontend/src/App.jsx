// frontend/src/App.jsx

import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Certifications from "./components/Certifications";
import ChatWidget from "./components/ChatWidget";
import {
  initGoogleTranslate,
  readGoogleTranslateLanguage,
  setGoogleTranslateLanguage,
} from "./utils/googleTranslate";

// O console só é baixado por quem acessa /admin
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));

const LANG_STORAGE_KEY = "portfolio_lang";
const THEME_STORAGE_KEY = "portfolio_theme";
const SUPPORTED_LANGS = ["pt", "en"];
const THEME_COLORS = { light: "#EEF2EC", dark: "#0E1713" };
const REPO_URL = "https://github.com/christiansousadev/meu-portfolio";

const SHELL_COPY = {
  pt: {
    loadError: "O conteúdo do portfólio não carregou porque a API não respondeu. Recarregue a página em instantes.",
    retry: "Recarregar",
    skip: "Pular para o conteúdo",
    role: "Engenheiro de software, integração de ERPs e governança de TI",
    contact: "Contato",
    source: "Código-fonte deste site",
    backToTop: "Voltar ao topo",
    console: "Console administrativo",
  },
  en: {
    loadError: "The portfolio content did not load because the API did not respond. Reload the page in a moment.",
    retry: "Reload",
    skip: "Skip to content",
    role: "Software engineer, ERP integration and IT governance",
    contact: "Contact",
    source: "Source code of this site",
    backToTop: "Back to top",
    console: "Admin console",
  },
};

const readInitialLang = () => {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    // storage indisponível (modo privado/bloqueado): segue para o cookie
  }
  const fromCookie = readGoogleTranslateLanguage();
  return SUPPORTED_LANGS.includes(fromCookie) ? fromCookie : "pt";
};

const readStoredTheme = () => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
};

// O script inline do index.html já aplicou o tema antes do primeiro paint;
// aqui o React só assume o mesmo valor.
const readInitialTheme = () => {
  const applied = document.documentElement.getAttribute("data-theme");
  if (applied === "light" || applied === "dark") return applied;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function App() {
  const [theme, setThemeState] = useState(readInitialTheme);
  const [lang, setLang] = useState(readInitialLang);
  const [isAdminRoute] = useState(() => window.location.pathname.startsWith("/admin"));
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(!isAdminRoute);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);

  // sem escolha explícita, acompanha o sistema operacional
  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return undefined;
    const follow = (e) => {
      if (!readStoredTheme()) setThemeState(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", follow);
    return () => mql.removeEventListener("change", follow);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // a escolha vale para a sessão atual mesmo sem storage
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "pt-BR");
  }, [lang]);

  useEffect(() => {
    if (portfolioData && !portfolioData[lang]) initGoogleTranslate();
  }, [portfolioData, lang]);

  const handleLangChange = (nextLang) => {
    setLang(nextLang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {
      // preferência não persiste, mas a troca na sessão atual continua válida
    }
    if (portfolioData && !portfolioData[nextLang]) setGoogleTranslateLanguage(nextLang);
  };

  useEffect(() => {
    if (isAdminRoute) return;

    const fetchPortfolio = async () => {
      try {
        const res = await fetch("/api/portfolio");
        if (!res.ok) throw new Error(`http ${res.status}`);
        setPortfolioData(await res.json());
      } catch (error) {
        console.error("Failed to load portfolio:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const trackAccess = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "page_view",
            path: window.location.pathname,
            browser: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.warn("telemetry failed, skipping to preserve ux", error);
      }
    };

    fetchPortfolio();
    trackAccess();
  }, [isAdminRoute]);

  const copy = SHELL_COPY[lang] || SHELL_COPY.pt;

  if (isAdminRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <Suspense
          fallback={
            <div className="full-screen-center">
              <div className="skeleton" style={{ width: "180px", height: "14px" }} />
            </div>
          }
        >
          <AdminDashboard theme={theme} setTheme={setTheme} />
        </Suspense>
      </MotionConfig>
    );
  }

  if (isLoading) {
    return (
      <div className="full-screen-center" aria-busy="true">
        <div className="skeleton" style={{ width: "200px", height: "14px" }} />
        <div className="skeleton" style={{ width: "140px", height: "12px" }} />
      </div>
    );
  }

  if (!portfolioData || !portfolioData.pt) {
    return (
      <div className="full-screen-center">
        <p className="error-text">{copy.loadError}</p>
        <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
          {copy.retry}
        </button>
      </div>
    );
  }

  const t = portfolioData[lang] || portfolioData.pt;

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell" id="top">
        <a className="skip-link" href="#conteudo">
          {copy.skip}
        </a>
        <div id="google_translate_element" className="google-translate-anchor" aria-hidden="true" />

        <Navbar t={t} theme={theme} setTheme={setTheme} lang={lang} setLang={handleLangChange} />

        <main className="container" id="conteudo" tabIndex={-1}>
          <Hero data={t.hero} lang={lang} />
          <Skills data={t.skills} projects={t.proj?.items} lang={lang} />
          <Experience data={t.exp} lang={lang} />
          <Projects data={t.proj} lang={lang} />
          {t.cert && <Certifications data={t.cert} lang={lang} />}
        </main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-identity">
              <p className="footer-name">Christian Sousa</p>
              <p className="footer-role">{copy.role}</p>
            </div>

            <nav className="footer-links" aria-label={copy.contact}>
              <a href="mailto:christiansousadev@gmail.com">christiansousadev@gmail.com</a>
              <a href="https://github.com/christiansousadev" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/christiansousasilva/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </nav>

            <div className="footer-meta">
              <p>© {new Date().getFullYear()} Christian Sousa</p>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                {copy.source}
              </a>
              <a href="/admin">{copy.console}</a>
              <a href="#top">{copy.backToTop}</a>
            </div>
          </div>
        </footer>

        <ChatWidget data={t.chat} lang={lang} />
      </div>
    </MotionConfig>
  );
}

// frontend/src/App.jsx

import { useState, useEffect } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Certifications from "./components/Certifications";
import ChatWidget from "./components/ChatWidget";
import AdminDashboard from "./components/AdminDashboard";
import {
  initGoogleTranslate,
  readGoogleTranslateLanguage,
  setGoogleTranslateLanguage,
} from "./utils/googleTranslate";

export default function App() {
  const [theme, setTheme] = useState("dark");
  // "pt" é a fonte de verdade única do conteúdo; este estado reflete o idioma
  // exibido pelo Google Website Translator, inicializado a partir do cookie.
  const [lang, setLang] = useState(() => readGoogleTranslateLanguage());
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleLangChange = (nextLang) => {
    setLang(nextLang);
    setGoogleTranslateLanguage(nextLang);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 520);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/admin") {
      setIsAdminRoute(true);
      setIsLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        const res = await fetch("/api/portfolio");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setPortfolioData(data);
      } catch (error) {
        console.error("Failed to load portfolio:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();

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

    trackAccess();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isAdminRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <AdminDashboard theme={theme} setTheme={setTheme} />
      </MotionConfig>
    );
  }

  if (isLoading) {
    return (
      <div className="full-screen-center">
        <div className="skeleton" style={{ width: "200px", height: "14px" }} />
        <div className="skeleton" style={{ width: "140px", height: "12px" }} />
      </div>
    );
  }

  if (!portfolioData || !portfolioData.pt) {
    return (
      <div className="full-screen-center">
        <p className="error-text">
          Não foi possível carregar os dados do portfólio. Verifique a conexão com a API.
        </p>
      </div>
    );
  }

  const t = portfolioData.pt;

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <div id="google_translate_element" className="google-translate-anchor" aria-hidden="true" />

        <Navbar
          t={t}
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={handleLangChange}
        />

        <main className="container">
          <Hero data={t.hero} />
          <Skills data={t.skills} />
          <Experience data={t.exp} />
          <Projects data={t.proj} />
          {t.cert && <Certifications data={t.cert} />}
        </main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-identity">
              <span className="footer-brand-name">Christian Sousa</span>
              <span className="footer-brand-role">
                Engenheiro de Software & Governança de TI · Fortaleza, CE
              </span>
            </div>

            <nav className="footer-links" aria-label="Links externos">
              <a
                href="https://github.com/christiansousadev"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/christiansousasilva/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
              <a href="mailto:christiansousadev@gmail.com">
                christiansousadev@gmail.com
              </a>
            </nav>

            <div className="footer-meta">
              <span>Arquitetura Same-Origin · Cloudflare Zero Trust · Conformidade LGPD & ISO 27001</span>
              <span>© {new Date().getFullYear()} Christian Sousa</span>
            </div>
          </div>
        </footer>

        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.92 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              type="button"
              className="back-to-top"
              onClick={scrollToTop}
              aria-label="Voltar ao topo"
            >
              <ChevronUp size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        <ChatWidget data={t.chat} />
      </div>
    </MotionConfig>
  );
}

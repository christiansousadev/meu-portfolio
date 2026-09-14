// frontend/src/App.jsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, Shield } from "lucide-react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Certifications from "./components/Certifications";
import ChatWidget from "./components/ChatWidget";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("pt");
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Barra de progresso de rolagem e botão voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}%`;
      setScrollProgress(scroll);

      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
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

    if (window.location.pathname === "/admin") setIsAdminRoute(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isAdminRoute) {
    return <AdminDashboard theme={theme} />;
  }

  if (isLoading) {
    return (
      <div className="full-screen-center">
        <div className="skeleton" style={{ width: "220px", height: "16px" }} />
        <div className="skeleton" style={{ width: "160px", height: "12px" }} />
      </div>
    );
  }

  if (!portfolioData || !portfolioData[lang]) {
    return (
      <div className="full-screen-center">
        <p className="error-text">Falha ao carregar dados do portfólio. Verifique a API.</p>
      </div>
    );
  }

  const t = portfolioData[lang];

  return (
    <div className="app-shell">
      {/* Barra de Progresso de Leitura */}
      <div className="scroll-progress-bar" style={{ width: scrollProgress }} />

      {/* Navbar Superior */}
      <Navbar
        t={t}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
      />

      {/* Conteúdo Principal */}
      <main className="container">
        <Hero data={t.hero} />
        <Skills data={t.skills} />
        <Experience data={t.exp} />
        <Projects data={t.proj} />
        {t.cert && <Certifications data={t.cert} />}
      </main>

      {/* Rodapé Executivo */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <h3 className="text-gradient footer-brand-name">Christian Sousa</h3>
            <p className="footer-brand-role">
              Software Engineer & Governança de TI · Fortaleza, CE
            </p>
          </div>

          <div className="footer-note">
            <Shield size={16} className="icon-accent" />
            <span>Arquitetura Same-Origin · Docker · LGPD & ISO 27001</span>
          </div>

          <div className="footer-copy">
            © {new Date().getFullYear()} Christian Sousa. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Botão Voltar ao Topo */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            className="back-to-top"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
          >
            <ChevronUp size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Assistente de Chat com IA */}
      <ChatWidget data={t.chat} theme={theme} />
    </div>
  );
}

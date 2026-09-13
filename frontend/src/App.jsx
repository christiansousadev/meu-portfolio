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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--bg-color)",
        }}
      >
        <div className="skeleton" style={{ width: "220px", height: "16px" }}></div>
        <div className="skeleton" style={{ width: "160px", height: "12px" }}></div>
      </div>
    );
  }

  if (!portfolioData || !portfolioData[lang]) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--bg-color)",
          color: "var(--text-color)",
          fontSize: "1.1rem",
        }}
      >
        Falha ao carregar dados do portfólio. Verifique a API.
      </div>
    );
  }

  const t = portfolioData[lang];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
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
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5%" }}>
        <Hero data={t.hero} />
        <Skills data={t.skills} />
        <Experience data={t.exp} />
        <Projects data={t.proj} />
        {t.cert && <Certifications data={t.cert} />}
      </main>

      {/* Rodapé Executivo */}
      <footer
        style={{
          padding: "50px 5% 40px",
          marginTop: "80px",
          borderTop: "1px solid var(--card-border)",
          backgroundColor: "var(--card-bg)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div>
            <h3 className="text-gradient" style={{ margin: "0 0 6px 0", fontSize: "1.2rem" }}>
              Christian Sousa
            </h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Software Engineer & Governança de TI · Fortaleza, CE
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
            }}
          >
            <Shield size={16} style={{ color: "var(--accent-color)" }} />
            <span>Arquitetura Same-Origin · Docker · LGPD & ISO 27001</span>
          </div>

          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
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

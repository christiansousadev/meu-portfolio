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
import {
  initGoogleTranslate,
  readGoogleTranslateLanguage,
  setGoogleTranslateLanguage,
} from "./utils/googleTranslate";

export default function App() {
  const [theme, setTheme] = useState("dark");
  // "pt" é a fonte de verdade única do conteúdo (ver comentário abaixo, junto
  // ao cálculo de `t`); este estado reflete apenas o idioma exibido pelo
  // Google Website Translator, inicializado a partir do cookie existente
  // para manter a preferência do visitante entre visitas.
  const [lang, setLang] = useState(() => readGoogleTranslateLanguage());
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // injeta o widget do Google Translate uma única vez; a troca de idioma em
  // si é disparada explicitamente pelo clique no botão PT/EN da navbar
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  // troca o idioma exibido: atualiza o rótulo PT/EN da navbar e aciona a
  // tradução (ou restauração) via Google Website Translator
  const handleLangChange = nextLang => {
    setLang(nextLang);
    setGoogleTranslateLanguage(nextLang);
  };

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

  if (!portfolioData || !portfolioData.pt) {
    return (
      <div className="full-screen-center">
        <p className="error-text">Falha ao carregar dados do portfólio. Verifique a API.</p>
      </div>
    );
  }

  // `pt` é a fonte de verdade única do conteúdo — a versão em inglês nunca é
  // lida de `portfolioData.en` (isso eliminaria a necessidade de duplicar
  // cada experiência/projeto em dois idiomas); em vez disso o Google Website
  // Translator traduz o DOM já renderizado quando o visitante escolhe "EN".
  const t = portfolioData.pt;

  return (
    <div className="app-shell">
      {/* Ancora do widget do Google Translate — nunca exibida diretamente;
          o próprio Google injeta seu combo de idioma escondido aqui dentro */}
      <div id="google_translate_element" className="google-translate-anchor" aria-hidden="true" />

      {/* Barra de Progresso de Leitura */}
      <div className="scroll-progress-bar" style={{ width: scrollProgress }} />

      {/* Navbar Superior */}
      <Navbar
        t={t}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={handleLangChange}
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
            <h3 className="footer-brand-name">Christian Sousa</h3>
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

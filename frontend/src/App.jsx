// frontend/src/App.jsx

import { useState, useEffect } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects.jsx";
import ChatWidget from "./components/ChatWidget";
import AdminDashboard from "./components/AdminDashboard";

// INICIA COMPONENTE PRINCIPAL APP
export default function App() {
  const [theme, setTheme] = useState("dark"); // Mudando o default para dark (Roxo Escuro) a pedido do usuario
  const [lang, setLang] = useState("pt");
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/portfolio`);
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


    // dispara telemetria com tratamento de falhas e fallback
    const trackAccess = async () => {
      try {

        await fetch(`${apiUrl}/api/analytics/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "page_view",
            path: window.location.pathname,
            browser: navigator.userAgent
          })
        });
      } catch (error) {
        console.warn("telemetry failed, skipping to preserve ux", error);
      }
    };

    trackAccess();

    if (window.location.pathname === "/admin") setIsAdminRoute(true);
  }, []);

  if (isAdminRoute) {
    return <AdminDashboard theme={theme} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="skeleton" style={{ width: '200px' }}></div>
      </div>
    );
  }

  if (!portfolioData || !portfolioData[lang]) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Falha ao carregar dados. Verifique a API.
      </div>
    );
  }

  const t = portfolioData[lang];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar
        t={t}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
      />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5%" }}>
        <Hero data={t.hero} />
        <Skills data={t.skills} />
        <Experience data={t.exp} />
        <Projects data={t.proj} />
      </main>

      <ChatWidget data={t.chat} theme={theme} />
    </div>
  );
}

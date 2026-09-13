// frontend/src/components/AdminDashboard.jsx

import { useState, useEffect, useRef } from "react";
import { 
  Download, Search, AlertTriangle, ShieldCheck, Trash2, 
  BarChart3, Clock, MessageSquare, Eye, LogOut
} from "lucide-react";
import JsonEditor from "./JsonEditor";

// helper de fetch same-origin com envio de cookies HttpOnly
const adminFetch = (path, options = {}) =>
  fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

// formatador de timestamps iso do backend
const FORMAT_TIMESTAMP = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  return sameDay
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const ROW_KEY = (record, idx) => record?.trace_id ?? `row-${idx}`;

// Mini Sparkline SVG puro
const Sparkline = ({ points = [8, 14, 12, 19, 16, 24, 21], color = "var(--accent-color)", width = 110, height = 28 }) => {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coordinates = points
    .map((val, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coordinates}
      />
    </svg>
  );
};

// Componente dedicado do Cloudflare Turnstile com ciclo de vida isolado e auto-carregamento
const TurnstileWidget = ({ onVerify, onExpire, resetSignal }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  const [loadError, setLoadError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let intervalId = null;
    let isCancelled = false;

    const obtainSiteKeyAndRender = async () => {
      let siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
      if (!siteKey) {
        try {
          const res = await fetch("/api/admin/turnstile-key");
          if (res.ok) {
            const data = await res.json();
            siteKey = data.site_key || "";
          }
        } catch {
          // ignora
        }
      }

      if (isCancelled) return;

      if (!siteKey) {
        // Se nao houver Turnstile configurado no .env, libera o acesso para desenvolvimento
        setIsInitializing(false);
        onVerifyRef.current("bypass_dev");
        return;
      }

      const renderWidget = () => {
        if (isCancelled || !containerRef.current) return;
        if (widgetIdRef.current) return;
        if (!window.turnstile) return;

        try {
          containerRef.current.innerHTML = "";
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: "dark",
            size: "normal",
            callback: (token) => {
              if (!isCancelled) {
                onVerifyRef.current(token);
                setIsInitializing(false);
              }
            },
            "expired-callback": () => {
              if (!isCancelled) onExpireRef.current();
            },
            "error-callback": (errorCode) => {
              console.warn("Turnstile error-callback:", errorCode);
              if (!isCancelled) {
                onExpireRef.current();
                setIsInitializing(false);
                setLoadError(
                  `Aviso Turnstile (${errorCode || "erro"}). Verifique a autorização do domínio.`
                );
              }
            },
          });
          setIsInitializing(false);
        } catch (err) {
          console.warn("Falha ao inicializar Turnstile:", err);
          if (!isCancelled) setIsInitializing(false);
        }
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        intervalId = setInterval(() => {
          if (window.turnstile && containerRef.current) {
            clearInterval(intervalId);
            intervalId = null;
            renderWidget();
          }
        }, 120);
      }
    };

    // Garante que o script da Cloudflare está inserido e ativo
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => obtainSiteKeyAndRender();
      script.onerror = () => {
        if (!isCancelled) {
          setIsInitializing(false);
          setLoadError("Não foi possível carregar a biblioteca do Cloudflare Turnstile.");
        }
      };
      document.head.appendChild(script);
    } else {
      obtainSiteKeyAndRender();
    }

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignora
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  // Reseta o Turnstile quando o signal for disparado (ex: falha de senha)
  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // ignora
      }
    }
  }, [resetSignal]);

  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "65px",
        }}
      >
        {isInitializing && !loadError && (
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            Carregando desafio de segurança...
          </span>
        )}
      </div>
      {loadError && (
        <p style={{ color: "#EF4444", fontSize: "0.8rem", margin: "6px 0 0 0", lineHeight: 1.4 }}>
          {loadError}
        </p>
      )}
    </div>
  );
};

export default function AdminDashboard() {

  const styles = {
    bg: "var(--bg-color)",
    text: "var(--text-color)",
    textSecondary: "var(--text-secondary)",
    accent: "var(--accent-color)",
    cardBg: "var(--card-bg)",
    cardShadow: "0 8px 32px var(--shadow-color)",
    navBg: "var(--nav-bg)",
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetTurnstileSignal, setResetTurnstileSignal] = useState(0);
  const [isLogged, setIsLogged] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlySlaBreaches, setOnlySlaBreaches] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);
  const [isPurging, setIsPurging] = useState(false);
  const [activeInterpreter, setActiveInterpreter] = useState("gemini");
  const [interpreterStatus, setInterpreterStatus] = useState("");
  const [isChangingInterpreter, setIsChangingInterpreter] = useState(false);

  const [stats, setStats] = useState({
    total_chats: 0,
    total_views: 0,
    avg_response_ms: 0,
    recent_events: [],
  });

  useEffect(() => {
    (async () => {
      await FETCH_DATA({ silent: true });
      setBootChecked(true);
    })();
  }, []);

  const HANDLE_LOGIN = async () => {
    setError("");
    if (!turnstileToken) {
      setError("Por favor, conclua o desafio do Cloudflare Turnstile antes de continuar.");
      return;
    }
    try {
      const res = await adminFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ 
          username, 
          password,
          turnstile_token: turnstileToken,
        }),
      });

      if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Falha na verificação de segurança.");
      }
      if (res.status === 401) throw new Error("Credenciais inválidas.");
      if (!res.ok) throw new Error("Falha no serviço de autenticação.");

      setIsLogged(true);
      setPassword("");
      setTurnstileToken("");
      await FETCH_DATA();
    } catch (e) {
      setError(e.message);
      // Reseta o Turnstile para permitir nova tentativa
      setTurnstileToken("");
      setResetTurnstileSignal((prev) => prev + 1);
    }
  };

  const FETCH_DATA = async ({ silent = false } = {}) => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        adminFetch("/api/admin/logs"),
        adminFetch("/api/admin/stats"),
      ]);

      if ([401, 403].includes(logsRes.status) || [401, 403].includes(statsRes.status)) {
        setIsLogged(false);
        return;
      }

      if (!logsRes.ok || !statsRes.ok) {
        throw new Error("Falha ao carregar dados administrativos.");
      }

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();
      setLogs(logsData.logs || []);
      setStats(statsData);
      if (statsData.active_interpreter) {
        setActiveInterpreter(statsData.active_interpreter);
      }
      setIsLogged(true);
    } catch (e) {
      if (!silent) console.error("erro ao carregar kpis:", e);
      setIsLogged(false);
    }
  };

  const CHANGE_INTERPRETER = async (provider) => {
    setIsChangingInterpreter(true);
    setInterpreterStatus("Salvando alteração...");
    try {
      const res = await adminFetch("/api/admin/interpreter", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });

      if ([401, 403].includes(res.status)) {
        setIsLogged(false);
        return;
      }
      if (!res.ok) throw new Error("Falha ao alterar provedor.");

      const data = await res.json();
      const updated = data.active || provider;
      setActiveInterpreter(updated);
      setInterpreterStatus(`✓ Provedor alterado para: ${updated === "gemini" ? "Google Gemini" : updated === "json_only" ? "JSON Local" : updated}`);
      setTimeout(() => setInterpreterStatus(""), 4000);
    } catch (e) {
      console.error("falha ao trocar interprete", e);
      setInterpreterStatus("❌ Erro ao atualizar intérprete.");
      setTimeout(() => setInterpreterStatus(""), 4000);
    } finally {
      setIsChangingInterpreter(false);
    }
  };

  const HANDLE_LOGOUT = async () => {
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch (e) {
      console.warn("falha ao notificar logout no servidor", e);
    }
    setIsLogged(false);
    window.location.href = "/";
  };

  const exportAuditReport = () => {
    const dataToExport = {
      sistema: "Portfólio Christian Sousa - Auditoria de Governança",
      gerado_em: new Date().toISOString(),
      padrao_conformidade: "ISO 27001 A.12.4 / LGPD Art. 6",
      metricas: stats,
      historico_chat: logs,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_auditoria_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const executePurge = async () => {
    setIsPurging(true);
    try {
      const res = await adminFetch("/api/admin/retention/purge", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao executar purga.");
      const data = await res.json();
      setPurgeResult(data);
      await FETCH_DATA();
    } catch (e) {
      alert("Erro na purga: " + e.message);
    } finally {
      setIsPurging(false);
    }
  };

  // Filtragem de Logs por busca ou SLA
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.user_prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ai_response?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.trace_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSla = !onlySlaBreaches || log.response_time_ms > 2000;
    return matchesSearch && matchesSla;
  });

  if (!bootChecked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: styles.bg,
          color: styles.text,
        }}
      >
        <div className="skeleton" style={{ width: "200px" }}></div>
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: styles.bg,
          color: styles.text,
          padding: "20px",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: "45px 35px",
            textAlign: "center",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "var(--accent-light)",
              color: "var(--accent-color)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" }}>
            Governança de TI
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "25px" }}>
            Acesso administrativo restrito com autenticação por cookie seguro.
          </p>

          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuário"
            style={{
              width: "100%",
              padding: "12px 14px",
              marginBottom: "14px",
              borderRadius: "8px",
              border: `1px solid var(--card-border)`,
              background: styles.bg,
              color: styles.text,
              fontSize: "0.95rem",
              outline: "none",
            }}
          />

          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && HANDLE_LOGIN()}
            placeholder="Senha"
            style={{
              width: "100%",
              padding: "12px 14px",
              marginBottom: "16px",
              borderRadius: "8px",
              border: `1px solid var(--card-border)`,
              background: styles.bg,
              color: styles.text,
              fontSize: "0.95rem",
              outline: "none",
            }}
          />

          {/* Cloudflare Turnstile Anti-bot */}
          <TurnstileWidget
            onVerify={(token) => {
              setTurnstileToken(token);
              setError("");
            }}
            onExpire={() => setTurnstileToken("")}
            resetSignal={resetTurnstileSignal}
          />

          <button
            type="button"
            className="btn-primary"
            onClick={HANDLE_LOGIN}
            disabled={!turnstileToken}
            style={{ 
              width: "100%", 
              justifyContent: "center", 
              padding: "12px",
              opacity: turnstileToken ? 1 : 0.65,
              cursor: turnstileToken ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
          >
            Acessar Painel Executivo
          </button>

          {error && (
            <p style={{ color: "#EF4444", marginTop: "14px", fontSize: "0.88rem", fontWeight: 600 }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: "24px" }}>
            <a
              href="/"
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              ← Voltar ao Portfólio
            </a>
          </div>
        </div>
      </div>
    );
  }

  const KpiCard = ({ title, value, unit, sparkPoints, icon: Icon }) => {
    const display = value === null || value === undefined ? 0 : value;
    return (
      <div
        className="glass-card"
        style={{
          flex: "1 1 220px",
          minWidth: "220px",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              color: styles.textSecondary,
              fontSize: "0.74rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
          {Icon && <Icon size={18} style={{ color: styles.accent }} />}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                lineHeight: 1,
                color: styles.accent,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {display}
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: styles.textSecondary }}>
              {unit}
            </span>
          </div>

          {sparkPoints && <Sparkline points={sparkPoints} color={styles.accent} />}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "40px 5%", minHeight: "100vh", backgroundColor: styles.bg, color: styles.text }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header do Painel */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginBottom: "35px",
            paddingBottom: "20px",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0 }}>
              Dashboard de Governança
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
              Monitoramento de telemetria, integridade de RAG e gestão em tempo real.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={exportAuditReport}
              title="Exportar Relatório de Auditoria em JSON"
              style={{ padding: "9px 16px", fontSize: "0.85rem" }}
            >
              <Download size={16} /> Exportar JSON
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsPurgeModalOpen(true)}
              title="Executar Purga de Retenção (LGPD 90 dias)"
              style={{ padding: "9px 16px", fontSize: "0.85rem", color: "#EF4444" }}
            >
              <Trash2 size={16} /> Purga LGPD
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={HANDLE_LOGOUT}
              style={{ padding: "9px 18px", fontSize: "0.85rem" }}
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </header>

        {/* Abas */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
          <button
            type="button"
            className={`category-pill ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <BarChart3 size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
            KPIs, Logs & Telemetria
          </button>
          <button
            type="button"
            className={`category-pill ${activeTab === "editor" ? "active" : ""}`}
            onClick={() => setActiveTab("editor")}
          >
            Editor de Configurações (JSON)
          </button>
        </div>

        {activeTab === "stats" ? (
          <>
            {/* Seletor do Provedor de IA */}
            <div
              className="glass-card"
              style={{
                padding: "20px 24px",
                marginBottom: "30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                    Intérprete Ativo (Runtime)
                  </h3>
                  {activeInterpreter === "gemini" && (
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                      }}
                    >
                      ● Gemini 1.5 Flash (Ativo)
                    </span>
                  )}
                  {activeInterpreter === "json_only" && (
                    <span
                      style={{
                        background: "rgba(245, 158, 11, 0.15)",
                        color: "#F59E0B",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                      }}
                    >
                      ● JSON Local (Custo Zero / Sem LLM)
                    </span>
                  )}
                  {activeInterpreter !== "gemini" && activeInterpreter !== "json_only" && (
                    <span
                      style={{
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#6366F1",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                      }}
                    >
                      ● {activeInterpreter}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Alterne entre o Gemini (LLM inteligente) e o modo Local (zero custo de tokens).
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <select
                  id="interpreter-select"
                  aria-label="Selecionar intérprete de IA"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: styles.bg,
                    color: styles.text,
                    border: "1px solid var(--card-border)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    outline: "none",
                    cursor: isChangingInterpreter ? "not-allowed" : "pointer",
                    opacity: isChangingInterpreter ? 0.7 : 1,
                  }}
                  value={activeInterpreter}
                  disabled={isChangingInterpreter}
                  onChange={(e) => CHANGE_INTERPRETER(e.target.value)}
                >
                  <option value="gemini">Google Gemini 1.5 Flash (RAG Focado)</option>
                  <option value="json_only">Apenas JSON Local (Determinístico / Custo Zero)</option>
                  <option value="openai">OpenAI GPT-4o (Precisão)</option>
                  <option value="ollama">Llama 3 Local (Privacidade Total)</option>
                </select>
                {interpreterStatus && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: interpreterStatus.startsWith("✓")
                        ? "#10B981"
                        : interpreterStatus.startsWith("❌")
                        ? "#EF4444"
                        : "var(--text-secondary)",
                    }}
                  >
                    {interpreterStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Cards de KPIs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "20px",
                marginBottom: "35px",
              }}
            >
              <KpiCard
                title="Interações IA"
                value={stats.total_chats}
                unit="msgs"
                icon={MessageSquare}
                sparkPoints={[stats.total_chats * 0.4, stats.total_chats * 0.6, stats.total_chats * 0.8, stats.total_chats]}
              />
              <KpiCard
                title="Visualizações"
                value={stats.total_views}
                unit="views"
                icon={Eye}
                sparkPoints={[stats.total_views * 0.3, stats.total_views * 0.5, stats.total_views * 0.7, stats.total_views]}
              />
              <KpiCard
                title="SLA Médio de Resposta"
                value={stats.avg_response_ms}
                unit="ms"
                icon={Clock}
                sparkPoints={[stats.avg_response_ms * 1.1, stats.avg_response_ms * 0.95, stats.avg_response_ms]}
              />
            </div>

            {/* Seções de Histórico e Telemetria */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "25px",
              }}
            >
              {/* Histórico com Busca e Filtro SLA */}
              <section>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                    Histórico de Diálogos ({filteredLogs.length})
                  </h3>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={14}
                        style={{
                          position: "absolute",
                          left: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-secondary)",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Buscar pergunta ou trace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          padding: "6px 10px 6px 30px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          border: "1px solid var(--card-border)",
                          background: styles.bg,
                          color: styles.text,
                          outline: "none",
                        }}
                      />
                    </div>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.8rem",
                        color: styles.textSecondary,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={onlySlaBreaches}
                        onChange={(e) => setOnlySlaBreaches(e.target.checked)}
                      />
                      SLA &gt; 2s
                    </label>
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    maxHeight: "440px",
                    overflowY: "auto",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "var(--accent-gradient)", color: "#fff" }}>
                      <tr>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem" }}>
                          Pergunta / Prompt
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", width: "110px" }}>
                          SLA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={2} style={{ padding: "20px", textAlign: "center", color: styles.textSecondary }}>
                            Nenhum registro encontrado para este filtro.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log, idx) => (
                          <tr
                            key={ROW_KEY(log, idx)}
                            style={{
                              borderBottom: `1px solid var(--card-border)`,
                            }}
                          >
                            <td style={{ padding: "12px 16px", fontSize: "0.88rem" }}>
                              <div style={{ fontWeight: 600, color: styles.text, marginBottom: "2px" }}>
                                {log.user_prompt}
                              </div>
                              <small style={{ color: styles.textSecondary, fontSize: "0.75rem" }}>
                                Fonte: {log.source} · Trace: {log.trace_id?.slice(0, 8)}...
                              </small>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  color: log.response_time_ms > 2000 ? "#EF4444" : "#22C55E",
                                  fontWeight: "bold",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {log.response_time_ms}ms
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Telemetria Ao Vivo */}
              <section>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "14px" }}>
                  Telemetria Ao Vivo
                </h3>
                <div
                  className="glass-card"
                  style={{
                    padding: "16px 20px",
                    borderRadius: "12px",
                    maxHeight: "440px",
                    overflowY: "auto",
                  }}
                >
                  {stats.recent_events?.map((ev, idx) => (
                    <div
                      key={ROW_KEY(ev, idx)}
                      style={{
                        padding: "10px 0",
                        borderBottom: `1px solid var(--card-border)`,
                        fontSize: "0.84rem",
                      }}
                    >
                      <span style={{ color: styles.accent, fontWeight: 700 }}>
                        [{ev.event_type}]
                      </span>{" "}
                      acessou {ev.page_path}
                      <br />
                      <small style={{ color: styles.textSecondary, fontSize: "0.75rem" }}>
                        {FORMAT_TIMESTAMP(ev.timestamp)} · IP: {ev.client_ip || "Proxy"}
                      </small>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <JsonEditor styles={styles} onSessionLost={() => setIsLogged(false)} />
        )}
      </div>

      {/* Modal de Confirmação de Purga */}
      {isPurgeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "30px",
              backgroundColor: "var(--card-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#EF4444", marginBottom: "15px" }}>
              <AlertTriangle size={26} />
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
                Confirmar Purga LGPD
              </h3>
            </div>

            <p style={{ color: styles.textSecondary, fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "20px" }}>
              Esta operação expurga permanentemente de forma atômica todos os registros de <code>chat_logs.jsonl</code> e <code>analytics.jsonl</code> anteriores à janela de <strong>90 dias</strong> (Art. 6º LGPD).
            </p>

            {purgeResult && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#22C55E",
                  fontSize: "0.85rem",
                  marginBottom: "15px",
                }}
              >
                Purga concluída! Logs removidos: {purgeResult.chat_logs_deleted} chats, {purgeResult.analytics_deleted} telemetrias.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsPurgeModalOpen(false);
                  setPurgeResult(null);
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={executePurge}
                disabled={isPurging}
                style={{ background: "#EF4444" }}
              >
                {isPurging ? "Expurgando..." : "Confirmar Purga"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

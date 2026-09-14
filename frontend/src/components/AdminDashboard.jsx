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
    <div className="turnstile-wrap">
      {isInitializing && !loadError && (
        <div className="turnstile-loading">
          <span>Carregando desafio de segurança...</span>
        </div>
      )}
      {/*
        IMPORTANTE: este container é gerenciado exclusivamente pelo script do
        Cloudflare Turnstile (innerHTML/render acima). Não adicionar nós
        filhos via React aqui — isso quebra o unmount do widget e causa o
        erro "Failed to execute 'removeChild' on 'Node'".
      */}
      <div ref={containerRef} className="turnstile-slot" />
      {loadError && <p className="turnstile-error">{loadError}</p>}
    </div>
  );
};

export default function AdminDashboard() {
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
      <div className="full-screen-center">
        <div className="skeleton" style={{ width: "200px", height: "16px" }} />
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className="login-wrap">
        <div className="glass-card login-card">
          <div className="login-icon">
            <ShieldCheck size={28} />
          </div>

          <h2 className="login-title">Governança de TI</h2>
          <p className="login-desc">
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
            className="form-input"
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
            className="form-input"
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
            className="btn-primary btn-primary--full"
            onClick={HANDLE_LOGIN}
            disabled={!turnstileToken}
          >
            Acessar Painel Executivo
          </button>

          {error && <p className="login-error">{error}</p>}

          <div className="login-footer-link">
            <a href="/">← Voltar ao Portfólio</a>
          </div>
        </div>
      </div>
    );
  }

  const KpiCard = ({ title, value, unit, sparkPoints, icon: Icon }) => {
    const display = value === null || value === undefined ? 0 : value;
    return (
      <div className="glass-card kpi-card">
        <div className="kpi-card-head">
          <span className="kpi-title">{title}</span>
          {Icon && <Icon size={18} className="kpi-icon" />}
        </div>

        <div className="kpi-value-row">
          <div className="kpi-value-group">
            <span className="kpi-value">{display}</span>
            <span className="kpi-unit">{unit}</span>
          </div>

          {sparkPoints && <Sparkline points={sparkPoints} color="var(--accent-color)" />}
        </div>
      </div>
    );
  };

  const providerBadgeClass =
    activeInterpreter === "gemini"
      ? "provider-badge--gemini"
      : activeInterpreter === "json_only"
      ? "provider-badge--json"
      : "provider-badge--other";

  const providerStatusClass = interpreterStatus.startsWith("✓")
    ? "provider-status--ok"
    : interpreterStatus.startsWith("❌")
    ? "provider-status--err"
    : "";

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header do Painel */}
        <header className="admin-header">
          <div>
            <h1 className="admin-header-title">Dashboard de Governança</h1>
            <p className="admin-header-desc">
              Monitoramento de telemetria, integridade de RAG e gestão em tempo real.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={exportAuditReport}
              title="Exportar Relatório de Auditoria em JSON"
            >
              <Download size={16} /> Exportar JSON
            </button>

            <button
              type="button"
              className="btn-secondary btn-sm btn-secondary--danger"
              onClick={() => setIsPurgeModalOpen(true)}
              title="Executar Purga de Retenção (LGPD 90 dias)"
            >
              <Trash2 size={16} /> Purga LGPD
            </button>

            <button type="button" className="btn-primary btn-sm" onClick={HANDLE_LOGOUT}>
              <LogOut size={16} /> Sair
            </button>
          </div>
        </header>

        {/* Abas */}
        <div className="admin-tabs">
          <button
            type="button"
            className={`category-pill ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <BarChart3 size={16} className="admin-tab-icon" />
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
            <div className="glass-card provider-card">
              <div>
                <div className="provider-heading">
                  <h3 className="provider-title">Intérprete Ativo (Runtime)</h3>
                  <span className={`provider-badge ${providerBadgeClass}`}>
                    {activeInterpreter === "gemini" && "● Gemini 1.5 Flash (Ativo)"}
                    {activeInterpreter === "json_only" && "● JSON Local (Custo Zero / Sem LLM)"}
                    {activeInterpreter !== "gemini" && activeInterpreter !== "json_only" && `● ${activeInterpreter}`}
                  </span>
                </div>
                <p className="provider-desc">
                  Alterne entre o Gemini (LLM inteligente) e o modo Local (zero custo de tokens).
                </p>
              </div>

              <div className="provider-controls">
                <select
                  id="interpreter-select"
                  aria-label="Selecionar intérprete de IA"
                  className="provider-select"
                  value={activeInterpreter}
                  disabled={isChangingInterpreter}
                  onChange={(e) => CHANGE_INTERPRETER(e.target.value)}
                >
                  <option value="gemini">Google Gemini 1.5 Flash (LLM com RAG)</option>
                  <option value="json_only">Apenas JSON Local (Teste Local / Custo Zero)</option>
                </select>
                {interpreterStatus && (
                  <span className={`provider-status ${providerStatusClass}`}>{interpreterStatus}</span>
                )}
              </div>
            </div>

            {/* Cards de KPIs */}
            <div className="kpi-grid">
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
            <div className="dashboard-columns">
              {/* Histórico com Busca e Filtro SLA */}
              <section>
                <div className="panel-head">
                  <h3 className="panel-title">Histórico de Diálogos ({filteredLogs.length})</h3>

                  <div className="panel-controls">
                    <div className="search-field">
                      <Search size={14} className="search-field-icon" />
                      <input
                        type="text"
                        placeholder="Buscar pergunta ou trace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                      />
                    </div>

                    <label className="sla-toggle">
                      <input
                        type="checkbox"
                        checked={onlySlaBreaches}
                        onChange={(e) => setOnlySlaBreaches(e.target.checked)}
                      />
                      SLA &gt; 2s
                    </label>
                  </div>
                </div>

                <div className="glass-card glass-card--static data-panel">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Pergunta / Prompt</th>
                        <th className="logs-table-col-sla">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="logs-empty-cell">
                            Nenhum registro encontrado para este filtro.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log, idx) => (
                          <tr key={ROW_KEY(log, idx)}>
                            <td>
                              <div className="log-question">{log.user_prompt}</div>
                              <small className="log-meta">
                                Fonte: {log.source} · Trace: {log.trace_id?.slice(0, 8)}...
                              </small>
                            </td>
                            <td>
                              <span className={`log-sla ${log.response_time_ms > 2000 ? "log-sla--bad" : "log-sla--good"}`}>
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
                <h3 className="panel-title panel-title--spaced">
                  Telemetria Ao Vivo
                </h3>
                <div className="glass-card glass-card--static data-panel telemetry-panel">
                  {stats.recent_events?.map((ev, idx) => (
                    <div key={ROW_KEY(ev, idx)} className="telemetry-item">
                      <span className="telemetry-event">[{ev.event_type}]</span> acessou {ev.page_path}
                      <span className="telemetry-meta">
                        {FORMAT_TIMESTAMP(ev.timestamp)} · IP: {ev.client_ip || "Proxy"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <JsonEditor
            styles={{
              bg: "var(--bg-color)",
              text: "var(--text-color)",
              textSecondary: "var(--text-secondary)",
              accent: "var(--accent-color)",
              cardBg: "var(--card-bg)",
              cardShadow: "0 8px 32px var(--shadow-color)",
              navBg: "var(--nav-bg)",
            }}
            onSessionLost={() => setIsLogged(false)}
          />
        )}
      </div>

      {/* Modal de Confirmação de Purga */}
      {isPurgeModalOpen && (
        <div className="purge-modal-overlay">
          <div className="glass-card purge-modal">
            <div className="purge-modal-head">
              <AlertTriangle size={26} />
              <h3>Confirmar Purga LGPD</h3>
            </div>

            <p className="purge-modal-text">
              Esta operação expurga permanentemente de forma atômica todos os registros de <code>chat_logs.jsonl</code> e <code>analytics.jsonl</code> anteriores à janela de <strong>90 dias</strong> (Art. 6º LGPD).
            </p>

            {purgeResult && (
              <div className="purge-result">
                Purga concluída! Logs removidos: {purgeResult.chat_logs_deleted} chats, {purgeResult.analytics_deleted} telemetrias.
              </div>
            )}

            <div className="purge-actions">
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
                className="btn-primary btn-primary--danger"
                onClick={executePurge}
                disabled={isPurging}
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

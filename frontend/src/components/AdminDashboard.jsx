// frontend/src/components/AdminDashboard.jsx

import { useState, useEffect, useRef } from "react";
import {
  Download,
  Search,
  AlertTriangle,
  Trash2,
  LogOut,
  Sun,
  Moon,
  ArrowLeft,
} from "lucide-react";
import JsonEditor from "./JsonEditor";

const adminFetch = (path, options = {}) =>
  fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

const formatTimestamp = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  return sameDay
    ? d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const rowKey = (record, idx) => record?.trace_id ?? `row-${idx}`;

// Widget isolado do Cloudflare Turnstile (container sem filhos React)
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
                  `Verificação Turnstile indisponível (${errorCode || "erro"}). Confira o domínio autorizado.`
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

    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => obtainSiteKeyAndRender();
      script.onerror = () => {
        if (!isCancelled) {
          setIsInitializing(false);
          setLoadError(
            "Não foi possível carregar o script do Cloudflare Turnstile."
          );
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
          <span>Carregando verificação de segurança...</span>
        </div>
      )}
      <div ref={containerRef} className="turnstile-slot" />
      {loadError && <p className="turnstile-error">{loadError}</p>}
    </div>
  );
};

export default function AdminDashboard({ theme = "dark", setTheme }) {
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
  const [interpreterStatus, setInterpreterStatus] = useState(null);
  const [isChangingInterpreter, setIsChangingInterpreter] = useState(false);

  const [stats, setStats] = useState({
    total_chats: 0,
    total_views: 0,
    avg_response_ms: 0,
    recent_events: [],
  });

  useEffect(() => {
    (async () => {
      await fetchData({ silent: true });
      setBootChecked(true);
    })();
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!turnstileToken) {
      setError("Conclua a verificação de segurança antes de entrar.");
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
      if (res.status === 401) throw new Error("Usuário ou senha incorretos.");
      if (!res.ok) throw new Error("Serviço de autenticação indisponível.");

      setIsLogged(true);
      setPassword("");
      setTurnstileToken("");
      await fetchData();
    } catch (e) {
      setError(e.message);
      setTurnstileToken("");
      setResetTurnstileSignal((prev) => prev + 1);
    }
  };

  const fetchData = async ({ silent = false } = {}) => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        adminFetch("/api/admin/logs"),
        adminFetch("/api/admin/stats"),
      ]);

      if (
        [401, 403].includes(logsRes.status) ||
        [401, 403].includes(statsRes.status)
      ) {
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

  const changeInterpreter = async (provider) => {
    setIsChangingInterpreter(true);
    setInterpreterStatus({ type: "pending", text: "Aplicando..." });
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
      setInterpreterStatus({
        type: "ok",
        text: `Ativo: ${updated === "gemini" ? "Gemini 1.5 Flash" : "JSON Local"}`,
      });
      setTimeout(() => setInterpreterStatus(null), 3500);
    } catch (e) {
      console.error("falha ao trocar interprete", e);
      setInterpreterStatus({
        type: "err",
        text: "Não foi possível alterar o motor.",
      });
      setTimeout(() => setInterpreterStatus(null), 4000);
    } finally {
      setIsChangingInterpreter(false);
    }
  };

  const handleLogout = async () => {
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
      sistema: "Portfólio Christian Sousa - Relatório de Auditoria",
      gerado_em: new Date().toISOString(),
      padrao_conformidade: "ISO 27001 A.12.4 / LGPD Art. 6",
      metricas: stats,
      historico_chat: logs,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
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
      const res = await adminFetch("/api/admin/retention/purge", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao executar expurgo.");
      const data = await res.json();
      setPurgeResult(data);
      await fetchData();
    } catch (e) {
      setPurgeResult({ error: e.message });
    } finally {
      setIsPurging(false);
    }
  };

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
        <div className="skeleton" style={{ width: "180px", height: "14px" }} />
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className="login-wrap notranslate" translate="no">
        <div className="surface-card login-card">
          <div className="login-header">
            <span className="login-kicker">christiansousa.dev</span>
            <h1 className="login-title">Console de Governança</h1>
            <p className="login-desc">
              Autenticação administrativa protegida por cookie HttpOnly e Cloudflare Turnstile.
            </p>
          </div>

          <div className="login-fields">
            <label className="field-group" htmlFor="admin-username">
              <span className="field-label">Usuário</span>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@christiansousa.dev"
                className="form-input"
              />
            </label>

            <label className="field-group" htmlFor="admin-password">
              <span className="field-label">Senha</span>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className="form-input"
              />
            </label>
          </div>

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
            onClick={handleLogin}
            disabled={!turnstileToken}
          >
            Entrar no console
          </button>

          {error && <p className="login-error">{error}</p>}

          <div className="login-footer-link">
            <a href="/">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Voltar ao portfólio</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const slaHealthy = (stats.avg_response_ms || 0) <= 2000;

  return (
    <div className="admin-page notranslate" translate="no">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="admin-breadcrumb">
              <a href="/">christiansousa.dev</a>
              <span aria-hidden="true">/</span>
              <span>admin</span>
            </div>
            <h1 className="admin-header-title">Console de Governança</h1>
          </div>

          <div className="admin-header-actions">
            {typeof setTheme === "function" && (
              <button
                type="button"
                className="btn-icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Alternar tema"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={exportAuditReport}
              title="Exportar relatório de auditoria em JSON"
            >
              <Download size={14} />
              <span>Exportar auditoria</span>
            </button>

            <button
              type="button"
              className="btn-secondary btn-sm btn-secondary--danger"
              onClick={() => setIsPurgeModalOpen(true)}
              title="Expurgar registros anteriores a 90 dias (LGPD)"
            >
              <Trash2 size={14} />
              <span>Expurgo 90d</span>
            </button>

            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        <nav className="underline-tabs admin-nav-tabs" aria-label="Áreas do console">
          <button
            type="button"
            className={`underline-tab ${activeTab === "stats" ? "is-active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            Telemetria & Auditoria
          </button>
          <button
            type="button"
            className={`underline-tab ${activeTab === "editor" ? "is-active" : ""}`}
            onClick={() => setActiveTab("editor")}
          >
            Conteúdo & Base RAG
          </button>
        </nav>

        {activeTab === "stats" ? (
          <>
            <section className="kpi-strip" aria-label="Indicadores operacionais">
              <div className="kpi-cell">
                <span className="kpi-label">Diálogos processados</span>
                <div className="kpi-metric-row">
                  <span className="kpi-number">{stats.total_chats ?? 0}</span>
                  <span className="kpi-unit">msgs</span>
                </div>
                <span className="kpi-sub">Janela de retenção: 90 dias</span>
              </div>

              <div className="kpi-cell">
                <span className="kpi-label">Visualizações de página</span>
                <div className="kpi-metric-row">
                  <span className="kpi-number">{stats.total_views ?? 0}</span>
                  <span className="kpi-unit">views</span>
                </div>
                <span className="kpi-sub">Eventos page_view registrados</span>
              </div>

              <div className="kpi-cell">
                <span className="kpi-label">Latência média do chat</span>
                <div className="kpi-metric-row">
                  <span className="kpi-number">{stats.avg_response_ms ?? 0}</span>
                  <span className="kpi-unit">ms</span>
                </div>
                <span className={`kpi-sub ${slaHealthy ? "kpi-sub--ok" : "kpi-sub--warn"}`}>
                  {slaHealthy ? "Dentro do SLA (< 2.000 ms)" : "Acima do SLA (> 2.000 ms)"}
                </span>
              </div>

              <div className="kpi-cell kpi-cell--control">
                <label htmlFor="interpreter-select" className="kpi-label">
                  Motor de resposta (Runtime)
                </label>
                <select
                  id="interpreter-select"
                  className="provider-select"
                  value={activeInterpreter}
                  disabled={isChangingInterpreter}
                  onChange={(e) => changeInterpreter(e.target.value)}
                >
                  <option value="gemini">Gemini 1.5 Flash (RAG)</option>
                  <option value="json_only">JSON Determinístico (Local)</option>
                </select>
                <span
                  className={`kpi-sub ${
                    interpreterStatus?.type === "ok"
                      ? "kpi-sub--ok"
                      : interpreterStatus?.type === "err"
                      ? "kpi-sub--warn"
                      : ""
                  }`}
                >
                  {interpreterStatus
                    ? interpreterStatus.text
                    : activeInterpreter === "gemini"
                    ? "Inferência com recorte semântico"
                    : "Custo zero de tokens"}
                </span>
              </div>
            </section>

            <div className="dashboard-columns">
              <section>
                <div className="panel-head">
                  <h2 className="panel-title">
                    Histórico de diálogos ({filteredLogs.length})
                  </h2>

                  <div className="panel-controls">
                    <div className="search-field">
                      <Search size={14} className="search-field-icon" />
                      <input
                        type="text"
                        placeholder="Filtrar pergunta ou trace..."
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
                      <span>SLA &gt; 2s</span>
                    </label>
                  </div>
                </div>

                <div className="surface-card data-panel table-scroll">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Pergunta / Metadados</th>
                        <th className="logs-table-col-sla">Latência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="logs-empty-cell">
                            Nenhum diálogo corresponde ao filtro atual.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log, idx) => (
                          <tr key={rowKey(log, idx)}>
                            <td>
                              <div className="log-question">{log.user_prompt}</div>
                              <div className="log-meta">
                                {formatTimestamp(log.timestamp)} · {log.source} · trace {log.trace_id?.slice(0, 8)}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`sla-badge ${
                                  log.response_time_ms > 2000
                                    ? "sla-badge--bad"
                                    : "sla-badge--good"
                                }`}
                              >
                                {log.response_time_ms} ms
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <div className="panel-head">
                  <h2 className="panel-title">Acessos recentes</h2>
                </div>
                <div className="surface-card data-panel telemetry-panel">
                  {stats.recent_events?.length ? (
                    stats.recent_events.map((ev, idx) => (
                      <div key={rowKey(ev, idx)} className="telemetry-item">
                        <div className="telemetry-row-top">
                          <span className="telemetry-event">{ev.event_type}</span>
                          <span className="telemetry-path">{ev.page_path}</span>
                        </div>
                        <span className="telemetry-meta">
                          {formatTimestamp(ev.timestamp)} · {ev.client_ip || "proxy"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="telemetry-empty">Nenhum acesso registrado.</p>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          <JsonEditor onSessionLost={() => setIsLogged(false)} />
        )}
      </div>

      {isPurgeModalOpen && (
        <div className="purge-modal-overlay" onClick={() => setIsPurgeModalOpen(false)}>
          <div className="surface-card purge-modal" onClick={(e) => e.stopPropagation()}>
            <div className="purge-modal-head">
              <AlertTriangle size={20} />
              <h3>Confirmar expurgo de retenção (LGPD)</h3>
            </div>

            <p className="purge-modal-text">
              Remove permanentemente registros de <code>chat_logs.jsonl</code> e{" "}
              <code>analytics.jsonl</code> anteriores a <strong>90 dias</strong> (Art. 6º, III da LGPD).
            </p>

            {purgeResult && !purgeResult.error && (
              <div className="purge-result">
                Expurgo concluído: {purgeResult.chat_logs_deleted} diálogos e{" "}
                {purgeResult.analytics_deleted} eventos removidos.
              </div>
            )}

            {purgeResult?.error && (
              <div className="purge-result purge-result--err">
                {purgeResult.error}
              </div>
            )}

            <div className="purge-actions">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setIsPurgeModalOpen(false);
                  setPurgeResult(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary btn-sm btn-primary--danger"
                onClick={executePurge}
                disabled={isPurging}
              >
                {isPurging ? "Expurgando..." : "Executar expurgo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

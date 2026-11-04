// frontend/src/components/AdminDashboard.jsx

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  Download,
  FolderGit2,
  Layers,
  Loader2,
  LogOut,
  Moon,
  Save,
  Search,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import JsonEditor from "./JsonEditor";
import useContentStore, { CONTENT_FILE, RAG_FILE } from "../hooks/useContentStore";
import useDialog from "../hooks/useDialog";
import { adminFetch, downloadJson } from "../utils/adminApi";
import { EASE_OUT, SPRING_INDICATOR } from "../utils/motion";

// Navegação única do console: telemetria, cada seção do portfólio e a base RAG
const ADMIN_SECTIONS = [
  { id: "stats", label: "Telemetria e logs", icon: Activity },
  { id: "hero", label: "Apresentação", icon: UserRound },
  { id: "skills", label: "Entregas", icon: Layers },
  { id: "exp", label: "Trajetória", icon: BriefcaseBusiness, counted: true },
  { id: "proj", label: "Projetos", icon: FolderGit2, counted: true },
  { id: "cert", label: "Credenciais", icon: Award, counted: true },
  { id: "rag", label: "Base factual da IA", icon: BrainCircuit },
];

const EDIT_LANGS = [
  { id: "pt", label: "Português", short: "PT" },
  { id: "en", label: "English", short: "EN" },
];

const SLA_MS = 2000;

const iconSwap = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
  transition: { duration: 0.18, ease: EASE_OUT },
};

const panelTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};

const formatNumber = (value) => (Number(value) || 0).toLocaleString("pt-BR");

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
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const rowKey = (record, idx) => record?.trace_id ?? `row-${idx}`;

// Widget isolado do Cloudflare Turnstile (container sem filhos React)
const TurnstileWidget = ({ onVerify, onExpire, resetSignal, theme }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const themeRef = useRef(theme);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  themeRef.current = theme;

  const [loadError, setLoadError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [bypassed, setBypassed] = useState(false);

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
          // sem site key: ambiente de desenvolvimento
        }
      }

      if (isCancelled) return;

      if (!siteKey) {
        setIsInitializing(false);
        setBypassed(true);
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
            theme: themeRef.current === "dark" ? "dark" : "light",
            size: "flexible",
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
                  `A verificação de segurança falhou (${errorCode || "erro"}). Confira se este domínio está autorizado no Turnstile.`
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
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => obtainSiteKeyAndRender();
      script.onerror = () => {
        if (!isCancelled) {
          setIsInitializing(false);
          setLoadError("O script de verificação do Cloudflare Turnstile não carregou. Recarregue a página.");
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
          // widget já removido
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
        // widget indisponível para reset
      }
    }
  }, [resetSignal]);

  if (bypassed) return null;

  return (
    <div className="turnstile-wrap">
      {isInitializing && !loadError && (
        <p className="turnstile-loading">Carregando verificação de segurança…</p>
      )}
      <div ref={containerRef} className="turnstile-slot" />
      {loadError && <p className="turnstile-error">{loadError}</p>}
    </div>
  );
};

function PurgeDialog({ open, onClose, onConfirm, isPurging, result }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  useDialog({ open, containerRef: dialogRef, initialFocusRef: cancelRef, onClose, lockScroll: true });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="purge-overlay"
          className="dialog-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          <motion.div
            ref={dialogRef}
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="purge-title"
            aria-describedby="purge-desc"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            <div className="dialog-head dialog-head--danger">
              <AlertTriangle size={20} aria-hidden="true" />
              <h2 id="purge-title">Expurgar registros com mais de 90 dias</h2>
            </div>

            <p id="purge-desc" className="dialog-text">
              Remove de forma permanente os registros de <code>chat_logs.jsonl</code> e{" "}
              <code>analytics.jsonl</code> anteriores a 90 dias (LGPD, Art. 6º, III). Não há como desfazer.
            </p>

            {result && !result.error && (
              <p className="dialog-result" role="status">
                Expurgo concluído: {result.chat_logs_deleted} diálogos e {result.analytics_deleted} eventos removidos.
              </p>
            )}
            {result?.error && (
              <p className="dialog-result dialog-result--error" role="alert">
                {result.error}
              </p>
            )}

            <div className="dialog-actions">
              <button ref={cancelRef} type="button" className="btn-secondary btn-sm" onClick={onClose}>
                {result && !result.error ? "Fechar" : "Cancelar"}
              </button>
              {!(result && !result.error) && (
                <button
                  type="button"
                  className="btn-primary btn-sm btn-primary--danger"
                  onClick={onConfirm}
                  disabled={isPurging}
                >
                  {isPurging ? "Expurgando…" : "Expurgar registros"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
  const [editLang, setEditLang] = useState("pt");

  const content = useContentStore({
    enabled: isLogged,
    onSessionLost: () => setIsLogged(false),
  });

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

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");
    if (!turnstileToken) {
      setError("Conclua a verificação de segurança antes de entrar.");
      return;
    }
    try {
      const res = await adminFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password, turnstile_token: turnstileToken }),
      });

      if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "A verificação de segurança não foi aceita. Refaça o desafio.");
      }
      if (res.status === 401) throw new Error("Usuário ou senha incorretos.");
      if (!res.ok) throw new Error("O serviço de autenticação não respondeu. Tente novamente em instantes.");

      setIsLogged(true);
      setPassword("");
      setTurnstileToken("");
      await fetchData();
    } catch (err) {
      setError(err.message);
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

      if ([401, 403].includes(logsRes.status) || [401, 403].includes(statsRes.status)) {
        setIsLogged(false);
        return;
      }
      if (!logsRes.ok || !statsRes.ok) throw new Error("Falha ao carregar dados administrativos.");

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();
      setLogs(logsData.logs || []);
      setStats(statsData);
      if (statsData.active_interpreter) setActiveInterpreter(statsData.active_interpreter);
      setIsLogged(true);
    } catch (err) {
      if (!silent) console.error("erro ao carregar kpis:", err);
      setIsLogged(false);
    }
  };

  const changeInterpreter = async (provider) => {
    setIsChangingInterpreter(true);
    setInterpreterStatus({ type: "pending", text: "Aplicando…" });
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
        text: `Motor ativo: ${updated === "gemini" ? "Gemini 1.5 Flash" : "JSON local"}`,
      });
      setTimeout(() => setInterpreterStatus(null), 3500);
    } catch (err) {
      console.error("falha ao trocar interprete", err);
      setInterpreterStatus({ type: "err", text: "O motor não mudou. Tente novamente." });
      setTimeout(() => setInterpreterStatus(null), 4000);
    } finally {
      setIsChangingInterpreter(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      console.warn("falha ao notificar logout no servidor", err);
    }
    setIsLogged(false);
    window.location.href = "/";
  };

  const exportAuditReport = () => {
    downloadJson(
      {
        sistema: "Portfólio Christian Sousa - Relatório de Auditoria",
        gerado_em: new Date().toISOString(),
        padrao_conformidade: "ISO 27001 A.12.4 / LGPD Art. 6",
        metricas: stats,
        historico_chat: logs,
      },
      `relatorio_auditoria_${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  const executePurge = async () => {
    setIsPurging(true);
    try {
      const res = await adminFetch("/api/admin/retention/purge", { method: "POST" });
      if (!res.ok) throw new Error("O expurgo não foi executado. Verifique os logs do backend.");
      setPurgeResult(await res.json());
      await fetchData();
    } catch (err) {
      setPurgeResult({ error: err.message });
    } finally {
      setIsPurging(false);
    }
  };

  const closePurge = () => {
    setIsPurgeModalOpen(false);
    setPurgeResult(null);
  };

  const query = searchQuery.toLowerCase();
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !query ||
      log.user_prompt?.toLowerCase().includes(query) ||
      log.ai_response?.toLowerCase().includes(query) ||
      log.trace_id?.toLowerCase().includes(query);
    const matchesSla = !onlySlaBreaches || log.response_time_ms > SLA_MS;
    return matchesSearch && matchesSla;
  });

  const themeToggle = typeof setTheme === "function" && (
    <button
      type="button"
      className="btn-icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
      aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
    >
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );

  if (!bootChecked) {
    return (
      <div className="full-screen-center" aria-busy="true">
        <div className="skeleton" style={{ width: "180px", height: "14px" }} />
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className="login-wrap notranslate" translate="no">
        <div className="login-theme">{themeToggle}</div>
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-header">
            <h1 className="login-title">Console de governança</h1>
            <p className="login-desc">
              Acesso restrito. A sessão usa cookie HttpOnly e verificação do Cloudflare Turnstile.
            </p>
          </div>

          <div className="login-fields">
            <div className="field-group">
              <label className="field-label" htmlFor="admin-username">
                Usuário
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="admin-password">
                Senha
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <TurnstileWidget
            theme={theme}
            onVerify={(token) => {
              setTurnstileToken(token);
              setError("");
            }}
            onExpire={() => setTurnstileToken("")}
            resetSignal={resetTurnstileSignal}
          />

          <button type="submit" className="btn-primary btn-primary--full" disabled={!turnstileToken}>
            Entrar no console
          </button>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <a className="login-back" href="/">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar ao portfólio</span>
          </a>
        </form>
      </div>
    );
  }

  const slaHealthy = (stats.avg_response_ms || 0) <= SLA_MS;
  const isStats = activeTab === "stats";
  const isContentSection = !isStats && activeTab !== "rag";
  const activeFile = activeTab === "rag" ? RAG_FILE : CONTENT_FILE;
  const localeDoc = content.docs[CONTENT_FILE]?.[editLang];
  const sectionCounts = {
    exp: localeDoc?.exp?.items?.length,
    proj: localeDoc?.proj?.items?.length,
    cert: localeDoc?.cert?.items?.length,
  };
  const saveState = content.isSaving ? "saving" : content.justSaved ? "saved" : "idle";
  const panelKey = isContentSection ? `${activeTab}-${editLang}` : activeTab;
  const syncText = content.isDirty ? "Alterações pendentes" : "Tudo gravado";

  return (
    <div className="admin-page notranslate" translate="no">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <p className="admin-breadcrumb">
              <a href="/">christiansousa.dev</a> / admin
            </p>
            <h1 className="admin-title">Console de governança</h1>
          </div>
          <div className="admin-header-actions">
            {themeToggle}
            <button type="button" className="btn-ghost btn-sm" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </header>

        <div className={`admin-commandbar ${isStats ? "is-compact" : ""}`}>
          <LayoutGroup id="admin-sections">
            <nav className="admin-tabs" aria-label="Áreas do console">
              {ADMIN_SECTIONS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                const count = item.counted ? sectionCounts[item.id] : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-tab ${isActive ? "is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon size={16} aria-hidden="true" className="admin-tab-icon" />
                    <span>{item.label}</span>
                    {typeof count === "number" && <span className="admin-tab-count tnum">{count}</span>}
                    {isActive && (
                      <motion.span
                        layoutId="admin-tab-indicator"
                        className="admin-tab-indicator"
                        transition={SPRING_INDICATOR}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </LayoutGroup>

          <div className="admin-section-select">
            <label htmlFor="admin-section" className="visually-hidden">
              Área do console
            </label>
            <select
              id="admin-section"
              className="form-input"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {ADMIN_SECTIONS.map((item) => {
                const count = item.counted ? sectionCounts[item.id] : null;
                return (
                  <option key={item.id} value={item.id}>
                    {item.label}
                    {typeof count === "number" ? ` (${count})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {!isStats && (
            <div className="admin-toolbar">
              {isContentSection ? (
                <div className="segmented" role="radiogroup" aria-label="Idioma do conteúdo em edição">
                  {EDIT_LANGS.map((opt) => {
                    const isActive = editLang === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        aria-label={opt.label}
                        className={`segmented-option ${isActive ? "is-active" : ""}`}
                        onClick={() => setEditLang(opt.id)}
                      >
                        <span className="seg-long" aria-hidden="true">
                          {opt.label}
                        </span>
                        <span className="seg-short" aria-hidden="true">
                          {opt.short}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="admin-toolbar-hint">Base única: atende o chat nos dois idiomas.</p>
              )}

              <p className={`sync-status ${content.isDirty ? "is-pending" : ""}`} role="status">
                <span className="sync-dot" aria-hidden="true" />
                <span className="sync-text">{syncText}</span>
              </p>

              <button
                type="button"
                className={`btn-primary btn-sm admin-save ${saveState === "saved" ? "is-saved" : ""}`}
                onClick={content.save}
                disabled={content.isSaving || (!content.isDirty && saveState !== "saved")}
                title="Salvar alterações (Ctrl + S)"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={saveState} className="btn-icon-swap" {...iconSwap}>
                    {saveState === "saving" ? (
                      <Loader2 size={16} className="icon-spin" aria-hidden="true" />
                    ) : saveState === "saved" ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <Save size={16} aria-hidden="true" />
                    )}
                  </motion.span>
                </AnimatePresence>
                <span className="admin-save-long">
                  {saveState === "saving" ? "Gravando…" : saveState === "saved" ? "Gravado" : "Salvar alterações"}
                </span>
                <span className="admin-save-short">
                  {saveState === "saving" ? "…" : saveState === "saved" ? "Gravado" : "Salvar"}
                </span>
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isStats ? (
            <motion.div key="stats" {...panelTransition}>
              <section className="telemetry-head" aria-labelledby="telemetry-title">
                <div>
                  <h2 id="telemetry-title" className="panel-title">
                    Telemetria e auditoria
                  </h2>
                  <p className="panel-desc">Registros mantidos por até 90 dias. Ctrl + S grava edições pendentes em qualquer área.</p>
                </div>
                <div className="telemetry-actions">
                  <button type="button" className="btn-secondary btn-sm" onClick={exportAuditReport}>
                    <Download size={16} aria-hidden="true" />
                    <span>Exportar auditoria (JSON)</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm btn-secondary--danger"
                    onClick={() => setIsPurgeModalOpen(true)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    <span>Expurgar registros com mais de 90 dias</span>
                  </button>
                </div>
              </section>

              <dl className="kpi-strip" aria-label="Indicadores operacionais">
                <div className="kpi-cell">
                  <dt className="kpi-label">Diálogos processados</dt>
                  <dd className="kpi-value tnum">{formatNumber(stats.total_chats)}</dd>
                  <dd className="kpi-sub">mensagens na janela de 90 dias</dd>
                </div>
                <div className="kpi-cell">
                  <dt className="kpi-label">Visualizações de página</dt>
                  <dd className="kpi-value tnum">{formatNumber(stats.total_views)}</dd>
                  <dd className="kpi-sub">eventos page_view</dd>
                </div>
                <div className="kpi-cell">
                  <dt className="kpi-label">Latência média do chat</dt>
                  <dd className="kpi-value tnum">
                    {formatNumber(stats.avg_response_ms)} <span className="kpi-unit">ms</span>
                  </dd>
                  <dd className={`kpi-sub ${slaHealthy ? "is-ok" : "is-breach"}`}>
                    {slaHealthy ? "Dentro do SLA de 2.000 ms" : "Acima do SLA de 2.000 ms"}
                  </dd>
                </div>
                <div className="kpi-cell">
                  <dt className="kpi-label">
                    <label htmlFor="interpreter-select">Motor de resposta</label>
                  </dt>
                  <dd>
                    <select
                      id="interpreter-select"
                      className="form-input"
                      value={activeInterpreter}
                      disabled={isChangingInterpreter}
                      onChange={(e) => changeInterpreter(e.target.value)}
                    >
                      <option value="gemini">Gemini 1.5 Flash (RAG)</option>
                      <option value="json_only">JSON determinístico (local)</option>
                    </select>
                  </dd>
                  <dd
                    className={`kpi-sub ${
                      interpreterStatus?.type === "ok" ? "is-ok" : interpreterStatus?.type === "err" ? "is-breach" : ""
                    }`}
                    role="status"
                  >
                    {interpreterStatus
                      ? interpreterStatus.text
                      : activeInterpreter === "gemini"
                      ? "Inferência com recorte de contexto"
                      : "Sem consumo de tokens"}
                  </dd>
                </div>
              </dl>

              <div className="dashboard-columns">
                <section className="dashboard-panel" aria-labelledby="logs-title">
                  <div className="panel-head">
                    <h2 id="logs-title" className="panel-title">
                      Histórico de diálogos <span className="panel-count tnum">{filteredLogs.length}</span>
                    </h2>
                    <div className="panel-controls">
                      <div className="search-field">
                        <Search size={16} className="search-field-icon" aria-hidden="true" />
                        <label htmlFor="logs-search" className="visually-hidden">
                          Filtrar por pergunta, resposta ou trace
                        </label>
                        <input
                          id="logs-search"
                          type="search"
                          placeholder="Filtrar pergunta ou trace"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="form-input search-input"
                        />
                      </div>
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={onlySlaBreaches}
                          onChange={(e) => setOnlySlaBreaches(e.target.checked)}
                        />
                        <span>Só acima de 2 s</span>
                      </label>
                    </div>
                  </div>

                  <div className="data-panel">
                    <table className="logs-table">
                      <thead>
                        <tr>
                          <th scope="col">Pergunta e metadados</th>
                          <th scope="col" className="logs-col-latency">
                            Latência
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="logs-empty">
                              Nenhum diálogo corresponde ao filtro. Limpe a busca ou desmarque o filtro de SLA.
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log, idx) => (
                            <tr key={rowKey(log, idx)}>
                              <td>
                                <p className="log-question">{log.user_prompt}</p>
                                <p className="log-meta">
                                  <span className="tnum">{formatTimestamp(log.timestamp)}</span>
                                  <span>{log.source}</span>
                                  <span>
                                    trace <code className="log-trace">{log.trace_id?.slice(0, 8)}</code>
                                  </span>
                                </p>
                              </td>
                              <td className="logs-col-latency">
                                <span
                                  className={`latency tnum ${
                                    log.response_time_ms > SLA_MS ? "is-breach" : "is-ok"
                                  }`}
                                >
                                  {formatNumber(log.response_time_ms)} ms
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="dashboard-panel" aria-labelledby="events-title">
                  <div className="panel-head">
                    <h2 id="events-title" className="panel-title">
                      Acessos recentes <span className="panel-count tnum">{stats.recent_events?.length || 0}</span>
                    </h2>
                  </div>
                  <div className="data-panel">
                    {stats.recent_events?.length ? (
                      <ul className="telemetry-list">
                        {stats.recent_events.map((ev, idx) => (
                          <li key={rowKey(ev, idx)} className="telemetry-item">
                            <p className="telemetry-top">
                              <span className="telemetry-path">{ev.page_path}</span>
                              <span className="telemetry-event">{ev.event_type}</span>
                            </p>
                            <p className="log-meta">
                              <span className="tnum">{formatTimestamp(ev.timestamp)}</span>
                              <span className="tnum">{ev.client_ip || "proxy"}</span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="telemetry-empty">Nenhum acesso registrado ainda.</p>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          ) : (
            <motion.div key={panelKey} {...panelTransition}>
              <JsonEditor
                section={activeTab}
                lang={editLang}
                data={content.docs[activeFile]}
                setData={(nextDoc) => content.replaceDoc(activeFile, nextDoc)}
                onBackup={() => content.exportFile(activeFile)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toast toast={content.toast} onClose={content.dismissToast} />

      <PurgeDialog
        open={isPurgeModalOpen}
        onClose={closePurge}
        onConfirm={executePurge}
        isPurging={isPurging}
        result={purgeResult}
      />
    </div>
  );
}

function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          role={toast.type === "error" ? "alert" : "status"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className={`toast toast--${toast.type}`}
        >
          <span className="toast-message">{toast.message}</span>
          <button type="button" onClick={onClose} aria-label="Fechar notificação" className="btn-icon">
            <X size={16} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

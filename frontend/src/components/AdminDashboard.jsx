// frontend/src/components/AdminDashboard.jsx

import { useState, useEffect } from "react";
import JsonEditor from "./JsonEditor";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// helper de fetch que injeta credentials para que o navegador envie o
// cookie http-only de sessao automaticamente em todas as chamadas admin
const adminFetch = (path, options = {}) =>
  fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {})
    }
  });

export default function AdminDashboard({ theme }) {
  const styles = {
    bg: "var(--bg-color)",
    text: "var(--text-color)",
    textSecondary: "var(--text-secondary)",
    accent: "var(--accent-color)",
    cardBg: "var(--card-bg)",
    cardShadow: "0 8px 32px var(--shadow-color)",
    navBg: "var(--nav-bg)"
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total_chats: 0,
    total_views: 0,
    avg_response_ms: 0,
    recent_events: []
  });

  // BOOT: TENTA HIDRATAR A SESSAO VIA COOKIE EXISTENTE
  useEffect(() => {
    // sem token em localStorage, a unica forma de saber se a sessao
    // ainda esta valida e tentar uma rota protegida e inspecionar o status
    (async () => {
      await FETCH_DATA({ silent: true });
      setBootChecked(true);
    })();
  }, []);

  // LOGIN
  const HANDLE_LOGIN = async () => {
    setError("");
    try {
      const res = await adminFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      if (res.status === 401) throw new Error("Credenciais invalidas.");
      if (!res.ok) throw new Error("Falha no servico de autenticacao.");

      // o backend ja gravou o cookie http-only;
      // basta hidratar o painel e marcar a sessao
      setIsLogged(true);
      setPassword("");
      await FETCH_DATA();
    } catch (e) {
      setError(e.message);
    }
  };

  // CARREGAMENTO DE KPIS E LOGS
  const FETCH_DATA = async ({ silent = false } = {}) => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        adminFetch("/api/admin/logs"),
        adminFetch("/api/admin/stats")
      ]);

      // 401/403 indicam sessao ausente ou expirada;
      // derruba o estado autenticado e volta para a tela de login
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
      setIsLogged(true);
    } catch (e) {
      // boot silencioso: nao polui o console quando a sessao nao existe
      if (!silent) console.error("erro ao carregar kpis:", e);
      setIsLogged(false);
    }
  };

  // TROCA DE INTERPRETER LLM
  const CHANGE_INTERPRETER = async provider => {
    try {
      const res = await adminFetch("/api/admin/interpreter", {
        method: "POST",
        body: JSON.stringify({ provider })
      });

      if ([401, 403].includes(res.status)) {
        setIsLogged(false);
        return;
      }
      if (!res.ok) throw new Error("Falha ao alterar provedor.");

      alert(`Provedor alterado para: ${provider}`);
    } catch (e) {
      console.error("falha ao trocar interprete", e);
    }
  };

  // LOGOUT
  const HANDLE_LOGOUT = async () => {
    try {
      // notifica o backend para limpar o cookie http-only;
      // mesmo se a chamada falhar o cliente derruba o estado local
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch (e) {
      console.warn("falha ao notificar logout no servidor", e);
    }
    setIsLogged(false);
    window.location.href = "/";
  };

  // EVITA FLASH DA TELA DE LOGIN ANTES DO BOOT CHECK
  if (!bootChecked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: styles.bg,
          color: styles.text
        }}
      >
        <div className="skeleton" style={{ width: "200px" }}></div>
      </div>
    );
  }

  // FORMULARIO DE LOGIN
  if (!isLogged) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: styles.bg,
          color: styles.text
        }}
      >
        <div
          style={{
            padding: "40px",
            backgroundColor: styles.cardBg,
            borderRadius: "10px",
            boxShadow: styles.cardShadow,
            textAlign: "center",
            width: "100%",
            maxWidth: "400px"
          }}
        >
          <h2>Governança de TI</h2>
          <label htmlFor="admin-username" style={SR_ONLY}>
            Usuário
          </label>
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Usuário"
            aria-label="Usuário"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "5px",
              border: `1px solid ${styles.accent}`,
              background: styles.bg,
              color: styles.text
            }}
          />
          <label htmlFor="admin-password" style={SR_ONLY}>
            Senha
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && HANDLE_LOGIN()}
            placeholder="Senha"
            aria-label="Senha"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "5px",
              border: `1px solid ${styles.accent}`,
              background: styles.bg,
              color: styles.text
            }}
          />
          <button
            onClick={HANDLE_LOGIN}
            style={{
              width: "100%",
              padding: "12px",
              background: styles.accent,
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Acessar Painel
          </button>
          {error && (
            <p style={{ color: "red", marginTop: "15px", fontSize: "0.9rem" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // CARD DE KPI
  const KpiCard = ({ title, value, unit }) => (
    <div
      style={{
        backgroundColor: styles.cardBg,
        padding: "20px",
        borderRadius: "10px",
        boxShadow: styles.cardShadow,
        flex: 1,
        minWidth: "200px"
      }}
    >
      <p
        style={{
          color: styles.textSecondary,
          fontSize: "0.8rem",
          margin: "0 0 10px 0",
          textTransform: "uppercase"
        }}
      >
        {title}
      </p>
      <h3 style={{ margin: 0, fontSize: "1.8rem", color: styles.accent }}>
        {value}
        <span style={{ fontSize: "0.9rem" }}>{unit}</span>
      </h3>
    </div>
  );

  return (
    <div
      style={{
        padding: "40px",
        minHeight: "100vh",
        backgroundColor: styles.bg,
        color: styles.text
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px"
          }}
        >
          <h1>Dashboard de Governança</h1>
          <button
            onClick={HANDLE_LOGOUT}
            style={{
              padding: "10px 20px",
              background: styles.accent,
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Sair
          </button>
        </header>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "30px",
            borderBottom: `1px solid ${styles.accent}30`
          }}
        >
          <button
            onClick={() => setActiveTab("stats")}
            style={{
              padding: "15px",
              background: "none",
              border: "none",
              color:
                activeTab === "stats" ? styles.accent : styles.textSecondary,
              borderBottom:
                activeTab === "stats" ? `3px solid ${styles.accent}` : "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            KPIs e Logs
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            style={{
              padding: "15px",
              background: "none",
              border: "none",
              color:
                activeTab === "editor" ? styles.accent : styles.textSecondary,
              borderBottom:
                activeTab === "editor" ? `3px solid ${styles.accent}` : "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Editor de Dados (JSON)
          </button>
        </div>

        {activeTab === "stats" ? (
          <>
            <div
              style={{
                backgroundColor: styles.cardBg,
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "30px",
                border: `1px solid ${styles.accent}`
              }}
            >
              <h4 style={{ margin: "0 0 10px 0" }}>
                Controle de Governança: Intérprete Ativo
              </h4>
              <select
                style={{
                  padding: "10px",
                  borderRadius: "5px",
                  background: styles.bg,
                  color: styles.text,
                  width: "100%",
                  maxWidth: "300px"
                }}
                onChange={e => CHANGE_INTERPRETER(e.target.value)}
                defaultValue="gemini"
              >
                <option value="json_only">
                  Apenas JSON Local (Seguro/ITIL)
                </option>
                <option value="gemini">
                  Google Gemini 1.5 Flash (Performance)
                </option>
                <option value="openai">GPT-4o (Precisão)</option>
                <option value="ollama">
                  Llama 3 Local (Privacidade Total)
                </option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                marginBottom: "40px"
              }}
            >
              <KpiCard
                title="Interações IA"
                value={stats.total_chats}
                unit=" msgs"
              />
              <KpiCard
                title="Visualizações"
                value={stats.total_views}
                unit=" views"
              />
              <KpiCard
                title="SLA de Resposta"
                value={stats.avg_response_ms}
                unit=" ms"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "30px"
              }}
            >
              <section>
                <h3 style={{ marginBottom: "15px" }}>Histórico de Diálogos</h3>
                <div
                  style={{
                    backgroundColor: styles.cardBg,
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: styles.cardShadow
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: styles.accent, color: "#fff" }}>
                      <tr>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Pergunta
                        </th>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          SLA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: `1px solid ${theme === "dark" ? "#333" : "#eee"}`
                          }}
                        >
                          <td style={{ padding: "12px", fontSize: "0.9rem" }}>
                            {log.user_prompt}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                color:
                                  log.response_time_ms > 2000 ? "red" : "green",
                                fontWeight: "bold"
                              }}
                            >
                              {log.response_time_ms}ms
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 style={{ marginBottom: "15px" }}>Telemetria (Live)</h3>
                <div
                  style={{
                    backgroundColor: styles.cardBg,
                    padding: "15px",
                    borderRadius: "10px",
                    boxShadow: styles.cardShadow
                  }}
                >
                  {stats.recent_events?.map(ev => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "10px 0",
                        borderBottom: `1px solid ${theme === "dark" ? "#333" : "#eee"}`,
                        fontSize: "0.85rem"
                      }}
                    >
                      <span style={{ color: styles.accent }}>
                        [{ev.event_type}]
                      </span>{" "}
                      acessou {ev.page_path}
                      <br />
                      <small style={{ color: styles.textSecondary }}>
                        {new Date(ev.created_at).toLocaleTimeString()}
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
    </div>
  );
}

// label visualmente oculto que permanece acessivel a leitores de tela
const SR_ONLY = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
};

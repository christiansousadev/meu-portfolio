// frontend/src/components/JsonEditor.jsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// duracao em ms que o toast permanece visivel antes de auto-fechar
const TOAST_TTL_MS = 4000;

// helper same-origin que envia o cookie http-only de sessao em toda chamada;
// substitui o uso anterior de Authorization: Bearer via localStorage
const adminFetch = (path, options = {}) =>
  fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {})
    }
  });

export default function JsonEditor({ styles, onSessionLost }) {
  const [data, setData] = useState(null);
  const [activeFile, setActiveFile] = useState("portfolio.json");
  const [activeSection, setActiveSection] = useState("exp");
  // toast = { type: "success" | "error", message: string } ou null
  const [toast, setToast] = useState(null);

  // EXIBE TOAST E AGENDA AUTO-DISMISS
  const SHOW_TOAST = (type, message) => {
    setToast({ type, message, key: Date.now() });
  };

  // limpa o toast apos o ttl; o useEffect cancela o timer anterior
  // sempre que um novo toast e exibido, evitando race condition
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_TTL_MS);
    return () => clearTimeout(id);
  }, [toast]);

  // PROPAGACAO DE SESSAO PERDIDA
  const handleAuthLoss = res => {
    if ([401, 403].includes(res.status)) {
      if (typeof onSessionLost === "function") onSessionLost();
      return true;
    }
    return false;
  };

  // CARREGA UM ARQUIVO DE CONFIGURACAO
  const LOAD = async file => {
    try {
      const res = await adminFetch(`/api/admin/config?filename=${file}`);
      if (handleAuthLoss(res)) return;
      if (!res.ok) throw new Error(`http ${res.status}`);

      const json = await res.json();

      // inicializa com estrutura base caso o arquivo esteja vazio,
      // evitando crashs no acesso a propriedades aninhadas no jsx
      if (Object.keys(json).length === 0) {
        if (file === "portfolio.json") {
          setData({
            pt: {
              exp: { items: [] },
              proj: { items: [] },
              skills: { items: [], tags: [] }
            }
          });
        } else {
          setData({
            instrucoes_ia: "",
            dados_pessoais: {},
            contatos: {},
            habilidades_tecnicas: [],
            governanca_e_processos: [],
            experiencias_profissionais: [],
            projetos_destaque: []
          });
        }
      } else {
        setData(json);
      }

      setActiveFile(file);
      if (file === "portfolio.json") setActiveSection("exp");
      if (file === "portfolio_data.json") setActiveSection("ia");
    } catch (e) {
      console.error("falha ao carregar json", e);
    }
  };

  // PERSISTE O ARQUIVO ATIVO NO BACKEND
  const SAVE = async () => {
    try {
      const res = await adminFetch("/api/admin/config", {
        method: "POST",
        body: JSON.stringify({ filename: activeFile, content: data })
      });
      if (handleAuthLoss(res)) return;
      if (!res.ok) throw new Error(`http ${res.status}`);

      SHOW_TOAST("success", "Dados sincronizados com sucesso.");
    } catch (e) {
      console.error("falha ao salvar json", e);
      SHOW_TOAST("error", "Falha ao salvar. Verifique a conexao com a api.");
    }
  };

  // ADICIONA ITENS DINAMICAMENTE BASEADO NO ARQUIVO ATUAL
  const ADD_ITEM = (section, subArray = "items") => {
    const newData = { ...data };

    if (activeFile === "portfolio.json") {
      if (!newData.pt) newData.pt = {};
      if (!newData.pt[section]) newData.pt[section] = {};
      if (!newData.pt[section][subArray]) newData.pt[section][subArray] = [];

      if (section === "exp")
        newData.pt.exp.items.unshift({
          role: "",
          company: "",
          time: "",
          desc: ""
        });
      else if (section === "proj")
        newData.pt.proj.items.unshift({ name: "", desc: "", link: "" });
      else if (section === "skills") newData.pt.skills[subArray].push("");
    } else if (activeFile === "portfolio_data.json") {
      if (!newData[section]) newData[section] = [];

      if (section === "experiencias_profissionais")
        newData[section].unshift({ empresa: "", resumo_tecnico: "" });
      else if (section === "projetos_destaque")
        newData[section].unshift({ nome: "", descricao: "", github: "" });
      else if (
        section === "habilidades_tecnicas" ||
        section === "governanca_e_processos"
      )
        newData[section].push("");
    }

    setData(newData);
  };

  // REMOVE ITENS DINAMICAMENTE BASEADO NO ARQUIVO ATUAL
  const REMOVE_ITEM = (section, index, subArray = "items") => {
    const newData = { ...data };

    if (activeFile === "portfolio.json" && newData.pt?.[section]?.[subArray]) {
      newData.pt[section][subArray].splice(index, 1);
    } else if (activeFile === "portfolio_data.json" && newData[section]) {
      newData[section].splice(index, 1);
    }

    setData(newData);
  };

  useEffect(() => {
    LOAD("portfolio.json");
  }, []);

  if (!data)
    return <p style={{ color: styles.text }}>Carregando gerenciador...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* SELETOR DE ARQUIVOS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button
          onClick={() => LOAD("portfolio.json")}
          style={btnTabStyle(activeFile === "portfolio.json", styles)}
        >
          Portfolio UI (Frontend)
        </button>
        <button
          onClick={() => LOAD("portfolio_data.json")}
          style={btnTabStyle(activeFile === "portfolio_data.json", styles)}
        >
          Contexto IA (RAG)
        </button>
      </div>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3>Gerenciando: {activeFile}</h3>
        <button
          onClick={SAVE}
          style={{
            padding: "10px 20px",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          SALVAR ALTERAÇÕES
        </button>
      </header>

      {/* SELETOR DE SEÇÕES DO PORTFOLIO */}
      {activeFile === "portfolio.json" && (
        <div
          role="tablist"
          aria-label="Seções do portfólio"
          style={{
            display: "flex",
            gap: "10px",
            borderBottom: `1px solid ${styles.textSecondary}50`,
            paddingBottom: "10px"
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "skills"}
            onClick={() => setActiveSection("skills")}
            style={subTabStyle(activeSection === "skills", styles)}
          >
            Habilidades
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "exp"}
            onClick={() => setActiveSection("exp")}
            style={subTabStyle(activeSection === "exp", styles)}
          >
            Experiências
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "proj"}
            onClick={() => setActiveSection("proj")}
            style={subTabStyle(activeSection === "proj", styles)}
          >
            Projetos
          </button>
        </div>
      )}

      <section
        style={{
          background: styles.cardBg,
          padding: "20px",
          borderRadius: "10px",
          boxShadow: styles.cardShadow
        }}
      >
        {/* --- FRONTEND: HABILIDADES --- */}
        {activeFile === "portfolio.json" && activeSection === "skills" && (
          <>
            <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle(styles)}>Título da Seção</label>
                <input
                  value={data?.pt?.skills?.title || ""}
                  onChange={e => {
                    const d = { ...data };
                    d.pt.skills.title = e.target.value;
                    setData(d);
                  }}
                  style={{ ...inputStyle(styles), width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle(styles)}>Subtítulo</label>
                <input
                  value={data?.pt?.skills?.subtitle || ""}
                  onChange={e => {
                    const d = { ...data };
                    d.pt.skills.subtitle = e.target.value;
                    setData(d);
                  }}
                  style={{ ...inputStyle(styles), width: "100%" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "40px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px"
                }}
              >
                <h4>Itens de Descrição (O que eu faço)</h4>
                <button
                  onClick={() => ADD_ITEM("skills", "items")}
                  style={addBtnStyle(styles)}
                >
                  + Novo Item
                </button>
              </div>
              {data?.pt?.skills?.items?.map((item, idx) => (
                <div
                  key={`item-${idx}`}
                  style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
                >
                  <input
                    value={item}
                    onChange={e => {
                      const d = { ...data };
                      d.pt.skills.items[idx] = e.target.value;
                      setData(d);
                    }}
                    style={{ ...inputStyle(styles), flex: 1 }}
                  />
                  <button
                    onClick={() => REMOVE_ITEM("skills", idx, "items")}
                    style={delBtnStyle()}
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px"
                }}
              >
                <h4>Tags de Tecnologias</h4>
                <button
                  onClick={() => ADD_ITEM("skills", "tags")}
                  style={addBtnStyle(styles)}
                >
                  + Nova Tag
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {data?.pt?.skills?.tags?.map((tag, idx) => (
                  <div
                    key={`tag-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#1e1e1e",
                      border: `1px solid ${styles.textSecondary}50`,
                      borderRadius: "20px",
                      padding: "5px 15px"
                    }}
                  >
                    <input
                      value={tag}
                      aria-label={`Editar tag ${idx + 1}`}
                      onChange={e => {
                        const d = { ...data };
                        d.pt.skills.tags[idx] = e.target.value;
                        setData(d);
                      }}
                      style={{
                        background: "transparent",
                        color: "#fff",
                        border: "none",
                        outline: "none",
                        width: `${Math.max(tag.length * 8, 40)}px`,
                        minWidth: "40px"
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`Remover tag ${tag || idx + 1}`}
                      onClick={() => REMOVE_ITEM("skills", idx, "tags")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#dc3545",
                        cursor: "pointer",
                        marginLeft: "10px",
                        fontWeight: "bold",
                        padding: 0,
                        lineHeight: 1
                      }}
                    >
                      <span aria-hidden="true">✖</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* --- FRONTEND: EXPERIÊNCIAS --- */}
        {activeFile === "portfolio.json" && activeSection === "exp" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px"
              }}
            >
              <h4>Experiências Profissionais</h4>
              <button
                onClick={() => ADD_ITEM("exp")}
                style={addBtnStyle(styles)}
              >
                + Nova Experiência
              </button>
            </div>
            {data?.pt?.exp?.items?.map((item, idx) => (
              <div key={idx} style={gridStyle(styles)}>
                <input
                  value={item.company || ""}
                  placeholder="Empresa"
                  onChange={e => {
                    const d = { ...data };
                    d.pt.exp.items[idx].company = e.target.value;
                    setData(d);
                  }}
                  style={inputStyle(styles)}
                />
                <input
                  value={item.role || ""}
                  placeholder="Cargo"
                  onChange={e => {
                    const d = { ...data };
                    d.pt.exp.items[idx].role = e.target.value;
                    setData(d);
                  }}
                  style={inputStyle(styles)}
                />
                <input
                  value={item.time || ""}
                  placeholder="Período"
                  onChange={e => {
                    const d = { ...data };
                    d.pt.exp.items[idx].time = e.target.value;
                    setData(d);
                  }}
                  style={inputStyle(styles)}
                />
                <button
                  onClick={() => REMOVE_ITEM("exp", idx)}
                  style={delBtnStyle()}
                >
                  Excluir
                </button>
                <textarea
                  value={item.desc || ""}
                  placeholder="Descrição"
                  onChange={e => {
                    const d = { ...data };
                    d.pt.exp.items[idx].desc = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    gridColumn: "1 / span 3",
                    height: "60px",
                    resize: "vertical"
                  }}
                />
              </div>
            ))}
          </>
        )}

        {/* --- FRONTEND: PROJETOS --- */}
        {activeFile === "portfolio.json" && activeSection === "proj" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px"
              }}
            >
              <h4>Projetos em Destaque</h4>
              <button
                onClick={() => ADD_ITEM("proj")}
                style={addBtnStyle(styles)}
              >
                + Novo Projeto
              </button>
            </div>
            {data?.pt?.proj?.items?.map((item, idx) => (
              <div key={idx} style={gridStyle(styles)}>
                <input
                  value={item.name || ""}
                  placeholder="Nome do Projeto"
                  onChange={e => {
                    const d = { ...data };
                    d.pt.proj.items[idx].name = e.target.value;
                    setData(d);
                  }}
                  style={{ ...inputStyle(styles), gridColumn: "1 / span 2" }}
                />
                <input
                  value={item.link || ""}
                  placeholder="Link (GitHub/Web)"
                  onChange={e => {
                    const d = { ...data };
                    d.pt.proj.items[idx].link = e.target.value;
                    setData(d);
                  }}
                  style={inputStyle(styles)}
                />
                <button
                  onClick={() => REMOVE_ITEM("proj", idx)}
                  style={delBtnStyle()}
                >
                  Excluir
                </button>
                <textarea
                  value={item.desc || ""}
                  placeholder="Descrição"
                  onChange={e => {
                    const d = { ...data };
                    d.pt.proj.items[idx].desc = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    gridColumn: "1 / span 3",
                    height: "60px",
                    resize: "vertical"
                  }}
                />
              </div>
            ))}
          </>
        )}

        {/* --- RAG: CONTEXTO DA IA --- */}
        {activeFile === "portfolio_data.json" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* Instruções Core */}
            <div>
              <label style={labelStyle(styles)}>
                Instruções de Comportamento (System Prompt)
              </label>
              <textarea
                value={data?.instrucoes_ia || ""}
                onChange={e => {
                  const d = { ...data };
                  d.instrucoes_ia = e.target.value;
                  setData(d);
                }}
                style={{
                  ...inputStyle(styles),
                  width: "100%",
                  height: "80px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Dados Pessoais & Contatos */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px"
              }}
            >
              <div
                style={{
                  padding: "15px",
                  border: `1px solid ${styles.textSecondary}30`,
                  borderRadius: "8px"
                }}
              >
                <h4 style={{ marginBottom: "15px" }}>Dados Pessoais</h4>
                <input
                  value={data?.dados_pessoais?.nome || ""}
                  placeholder="Nome"
                  onChange={e => {
                    const d = { ...data };
                    d.dados_pessoais.nome = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    width: "100%",
                    marginBottom: "10px"
                  }}
                />
                <input
                  value={data?.dados_pessoais?.localizacao || ""}
                  placeholder="Localização"
                  onChange={e => {
                    const d = { ...data };
                    d.dados_pessoais.localizacao = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    width: "100%",
                    marginBottom: "10px"
                  }}
                />
                <textarea
                  value={data?.dados_pessoais?.perfil || ""}
                  placeholder="Perfil"
                  onChange={e => {
                    const d = { ...data };
                    d.dados_pessoais.perfil = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    width: "100%",
                    height: "60px"
                  }}
                />
              </div>
              <div
                style={{
                  padding: "15px",
                  border: `1px solid ${styles.textSecondary}30`,
                  borderRadius: "8px"
                }}
              >
                <h4 style={{ marginBottom: "15px" }}>Contatos</h4>
                <input
                  value={data?.contatos?.email || ""}
                  placeholder="Email"
                  onChange={e => {
                    const d = { ...data };
                    d.contatos.email = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    width: "100%",
                    marginBottom: "10px"
                  }}
                />
                <input
                  value={data?.contatos?.linkedin || ""}
                  placeholder="LinkedIn"
                  onChange={e => {
                    const d = { ...data };
                    d.contatos.linkedin = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    width: "100%",
                    marginBottom: "10px"
                  }}
                />
                <input
                  value={data?.contatos?.github || ""}
                  placeholder="GitHub"
                  onChange={e => {
                    const d = { ...data };
                    d.contatos.github = e.target.value;
                    setData(d);
                  }}
                  style={{
                    ...inputStyle(styles),
                    width: "100%",
                    marginBottom: "10px"
                  }}
                />
                <input
                  value={data?.contatos?.portfolio_web || ""}
                  placeholder="Site"
                  onChange={e => {
                    const d = { ...data };
                    d.contatos.portfolio_web = e.target.value;
                    setData(d);
                  }}
                  style={{ ...inputStyle(styles), width: "100%" }}
                />
              </div>
            </div>

            {/* Listas Simples (Habilidades e Governança) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px"
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "15px"
                  }}
                >
                  <h4>Habilidades Técnicas</h4>
                  <button
                    onClick={() => ADD_ITEM("habilidades_tecnicas")}
                    style={addBtnStyle(styles)}
                  >
                    + Adicionar
                  </button>
                </div>
                {data?.habilidades_tecnicas?.map((item, idx) => (
                  <div
                    key={`hab-${idx}`}
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px"
                    }}
                  >
                    <input
                      value={item}
                      onChange={e => {
                        const d = { ...data };
                        d.habilidades_tecnicas[idx] = e.target.value;
                        setData(d);
                      }}
                      style={{ ...inputStyle(styles), flex: 1 }}
                    />
                    <button
                      onClick={() => REMOVE_ITEM("habilidades_tecnicas", idx)}
                      style={delBtnStyle()}
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "15px"
                  }}
                >
                  <h4>Governança e Processos</h4>
                  <button
                    onClick={() => ADD_ITEM("governanca_e_processos")}
                    style={addBtnStyle(styles)}
                  >
                    + Adicionar
                  </button>
                </div>
                {data?.governanca_e_processos?.map((item, idx) => (
                  <div
                    key={`gov-${idx}`}
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px"
                    }}
                  >
                    <input
                      value={item}
                      onChange={e => {
                        const d = { ...data };
                        d.governanca_e_processos[idx] = e.target.value;
                        setData(d);
                      }}
                      style={{ ...inputStyle(styles), flex: 1 }}
                    />
                    <button
                      onClick={() => REMOVE_ITEM("governanca_e_processos", idx)}
                      style={delBtnStyle()}
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Experiências e Projetos da IA */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: `1px solid ${styles.textSecondary}30`,
                  paddingTop: "20px",
                  marginBottom: "15px"
                }}
              >
                <h4>Experiências Profissionais (Resumo IA)</h4>
                <button
                  onClick={() => ADD_ITEM("experiencias_profissionais")}
                  style={addBtnStyle(styles)}
                >
                  + Experiência IA
                </button>
              </div>
              {data?.experiencias_profissionais?.map((item, idx) => (
                <div
                  key={`expia-${idx}`}
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "10px",
                    alignItems: "flex-start"
                  }}
                >
                  <input
                    value={item.empresa || ""}
                    placeholder="Empresa"
                    onChange={e => {
                      const d = { ...data };
                      d.experiencias_profissionais[idx].empresa =
                        e.target.value;
                      setData(d);
                    }}
                    style={{ ...inputStyle(styles), width: "200px" }}
                  />
                  <textarea
                    value={item.resumo_tecnico || ""}
                    placeholder="Resumo Técnico"
                    onChange={e => {
                      const d = { ...data };
                      d.experiencias_profissionais[idx].resumo_tecnico =
                        e.target.value;
                      setData(d);
                    }}
                    style={{ ...inputStyle(styles), flex: 1, height: "40px" }}
                  />
                  <button
                    onClick={() =>
                      REMOVE_ITEM("experiencias_profissionais", idx)
                    }
                    style={delBtnStyle()}
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: `1px solid ${styles.textSecondary}30`,
                  paddingTop: "20px",
                  marginBottom: "15px"
                }}
              >
                <h4>Projetos em Destaque (Resumo IA)</h4>
                <button
                  onClick={() => ADD_ITEM("projetos_destaque")}
                  style={addBtnStyle(styles)}
                >
                  + Projeto IA
                </button>
              </div>
              {data?.projetos_destaque?.map((item, idx) => (
                <div
                  key={`projia-${idx}`}
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "10px",
                    alignItems: "flex-start"
                  }}
                >
                  <input
                    value={item.nome || ""}
                    placeholder="Nome"
                    onChange={e => {
                      const d = { ...data };
                      d.projetos_destaque[idx].nome = e.target.value;
                      setData(d);
                    }}
                    style={{ ...inputStyle(styles), width: "200px" }}
                  />
                  <input
                    value={item.github || ""}
                    placeholder="Link GitHub"
                    onChange={e => {
                      const d = { ...data };
                      d.projetos_destaque[idx].github = e.target.value;
                      setData(d);
                    }}
                    style={{ ...inputStyle(styles), width: "200px" }}
                  />
                  <textarea
                    value={item.descricao || ""}
                    placeholder="Descrição"
                    onChange={e => {
                      const d = { ...data };
                      d.projetos_destaque[idx].descricao = e.target.value;
                      setData(d);
                    }}
                    style={{ ...inputStyle(styles), flex: 1, height: "40px" }}
                  />
                  <button
                    onClick={() => REMOVE_ITEM("projetos_destaque", idx)}
                    style={delBtnStyle()}
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// COMPONENTE INTERNO DE TOAST
// banner discreto, nao-bloqueante e tematizado pelos vars do tema dark.
// usa framer-motion para entrada/saida suaves; auto-dismiss e gerenciado
// pelo parent via setTimeout (centraliza o ttl em um unico lugar).
function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={toastShellStyle(toast.type)}
        >
          <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar notificacao"
            style={toastCloseStyle}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// shell visual: glass card com hue distinto por tipo, sobreposto ao app
const toastShellStyle = type => ({
  position: "fixed",
  top: "30px",
  right: "30px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px 18px",
  borderRadius: "10px",
  background:
    type === "success"
      ? "rgba(34, 153, 84, 0.92)"
      : "rgba(192, 57, 43, 0.92)",
  color: "#fff",
  fontSize: "0.95rem",
  fontWeight: 500,
  boxShadow: "0 12px 36px var(--shadow-color)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.18)",
  maxWidth: "360px",
  zIndex: 1100
});

const toastCloseStyle = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.9rem",
  padding: "2px 6px",
  lineHeight: 1,
  opacity: 0.85
};

// estilos isolados para manter o jsx limpo
const inputStyle = styles => ({
  padding: "10px",
  borderRadius: "5px",
  border: `1px solid ${styles.textSecondary}50`,
  background: styles.bg,
  color: styles.text,
  outline: "none",
  fontFamily: "inherit"
});
const labelStyle = styles => ({
  display: "block",
  marginBottom: "5px",
  fontSize: "0.85rem",
  color: styles.textSecondary,
  fontWeight: "bold"
});
const gridStyle = styles => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr auto",
  gap: "10px",
  marginBottom: "15px",
  borderBottom: `1px solid ${styles.accent}30`,
  paddingBottom: "15px"
});
const btnTabStyle = (isActive, styles) => ({
  padding: "10px",
  background: isActive ? styles.accent : "#444",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
});
const subTabStyle = (isActive, styles) => ({
  // reset de aparencia do button nativo mantendo o look-and-feel original
  background: "transparent",
  border: "none",
  borderBottom: isActive ? `2px solid ${styles.accent}` : "2px solid transparent",
  cursor: "pointer",
  padding: "5px 10px",
  fontWeight: isActive ? "bold" : "normal",
  fontFamily: "inherit",
  fontSize: "0.95rem",
  color: isActive ? styles.accent : styles.text
});
const addBtnStyle = styles => ({
  background: styles.accent,
  color: "#fff",
  border: "none",
  padding: "5px 15px",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
});
const delBtnStyle = () => ({
  background: "#dc3545",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "5px",
  cursor: "pointer"
});

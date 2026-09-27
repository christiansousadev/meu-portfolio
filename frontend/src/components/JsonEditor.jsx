// frontend/src/components/JsonEditor.jsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Plus, Save, Loader2, X } from "lucide-react";

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

export default function JsonEditor({ onSessionLost }) {
  const [data, setData] = useState(null);
  const [activeFile, setActiveFile] = useState("portfolio.json");
  const [activeSection, setActiveSection] = useState("exp");
  const [isSaving, setIsSaving] = useState(false);
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
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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
        newData.pt.proj.items.unshift({ name: "", desc: "", link: "", category: "Fullstack", tags: [] });
      else if (section === "cert")
        newData.pt.cert.items.unshift({ name: "", issuer: "", year: "", credential_url: "", description: "" });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <p className="editor-toolbar-file">Carregando gerenciador de conteúdo...</p>;

  return (
    <div className="editor-shell">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* SELETOR DE ARQUIVOS */}
      <div className="editor-file-tabs">
        <button
          type="button"
          className={`editor-file-tab ${activeFile === "portfolio.json" ? "is-active" : ""}`}
          onClick={() => LOAD("portfolio.json")}
        >
          Portfólio (Vitrine Pública)
        </button>
        <button
          type="button"
          className={`editor-file-tab ${activeFile === "portfolio_data.json" ? "is-active" : ""}`}
          onClick={() => LOAD("portfolio_data.json")}
        >
          Contexto de IA (RAG)
        </button>
      </div>

      <div className="glass-card editor-panel">
        <div className="editor-toolbar">
          <div className="editor-toolbar-heading">
            <h3 className="editor-toolbar-title">Editor de Conteúdo</h3>
            <span className="editor-toolbar-file">{activeFile}</span>
          </div>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={SAVE}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={16} className="icon-spin" /> : <Save size={16} />}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        {/* SELETOR DE SEÇÕES DO PORTFOLIO */}
        {activeFile === "portfolio.json" && (
          <div role="tablist" aria-label="Seções do portfólio" className="editor-tabs">
            {[
              { id: "skills", label: "Habilidades" },
              { id: "exp", label: "Experiências" },
              { id: "proj", label: "Projetos" },
              { id: "cert", label: "Certificações" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeSection === tab.id}
                className={`category-pill ${activeSection === tab.id ? "active" : ""}`}
                onClick={() => setActiveSection(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* --- FRONTEND: HABILIDADES --- */}
        {activeFile === "portfolio.json" && activeSection === "skills" && (
          <div className="editor-section">
            <div className="editor-item-grid editor-item-grid--2" style={{ paddingRight: 0 }}>
              <Field label="Título da Seção">
                <input
                  className="form-input"
                  value={data?.pt?.skills?.title || ""}
                  onChange={e => {
                    const d = { ...data };
                    d.pt.skills.title = e.target.value;
                    setData(d);
                  }}
                />
              </Field>
              <Field label="Subtítulo">
                <input
                  className="form-input"
                  value={data?.pt?.skills?.subtitle || ""}
                  onChange={e => {
                    const d = { ...data };
                    d.pt.skills.subtitle = e.target.value;
                    setData(d);
                  }}
                />
              </Field>
            </div>

            <div className="editor-section-head">
              <h4 className="editor-section-title">Itens de Descrição (O que eu faço)</h4>
              <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("skills", "items")}>
                <Plus size={15} /> Novo Item
              </button>
            </div>
            <div className="editor-tag-list">
              {data?.pt?.skills?.items?.map((item, idx) => (
                <div key={`item-${idx}`} className="editor-tag-row">
                  <input
                    className="form-input"
                    value={item}
                    onChange={e => {
                      const d = { ...data };
                      d.pt.skills.items[idx] = e.target.value;
                      setData(d);
                    }}
                  />
                  <TrashButton onClick={() => REMOVE_ITEM("skills", idx, "items")} label="Remover item" />
                </div>
              ))}
              {!data?.pt?.skills?.items?.length && <EmptyHint text="Nenhum item cadastrado ainda." />}
            </div>

            <div className="editor-section-head">
              <h4 className="editor-section-title">Tags de Tecnologias</h4>
              <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("skills", "tags")}>
                <Plus size={15} /> Nova Tag
              </button>
            </div>
            <div className="editor-chip-list">
              {data?.pt?.skills?.tags?.map((tag, idx) => (
                <div key={`tag-${idx}`} className="editor-chip">
                  <input
                    className="editor-chip-input"
                    value={tag}
                    aria-label={`Editar tag ${idx + 1}`}
                    onChange={e => {
                      const d = { ...data };
                      d.pt.skills.tags[idx] = e.target.value;
                      setData(d);
                    }}
                    style={{ width: `${Math.max(tag.length * 8, 32)}px` }}
                  />
                  <TrashButton
                    onClick={() => REMOVE_ITEM("skills", idx, "tags")}
                    label={`Remover tag ${tag || idx + 1}`}
                    size={13}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- FRONTEND: EXPERIÊNCIAS --- */}
        {activeFile === "portfolio.json" && activeSection === "exp" && (
          <div className="editor-section">
            <div className="editor-section-head">
              <h4 className="editor-section-title">Experiências Profissionais</h4>
              <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("exp")}>
                <Plus size={15} /> Nova Experiência
              </button>
            </div>
            <div className="editor-item-list">
              {data?.pt?.exp?.items?.map((item, idx) => (
                <div key={idx} className="editor-item-card">
                  <div className="editor-item-grid">
                    <Field label="Empresa">
                      <input
                        className="form-input"
                        value={item.company || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.exp.items[idx].company = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Cargo / Função">
                      <input
                        className="form-input"
                        value={item.role || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.exp.items[idx].role = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Período">
                      <input
                        className="form-input"
                        value={item.time || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.exp.items[idx].time = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Descrição das Atividades" full>
                      <textarea
                        className="form-input field-textarea"
                        value={item.desc || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.exp.items[idx].desc = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                  </div>
                  <div className="editor-item-actions">
                    <TrashButton onClick={() => REMOVE_ITEM("exp", idx)} label="Remover experiência" />
                  </div>
                </div>
              ))}
              {!data?.pt?.exp?.items?.length && <EmptyHint text="Nenhuma experiência cadastrada ainda." />}
            </div>
          </div>
        )}

        {/* --- FRONTEND: PROJETOS --- */}
        {activeFile === "portfolio.json" && activeSection === "proj" && (
          <div className="editor-section">
            <div className="editor-section-head">
              <h4 className="editor-section-title">Projetos em Destaque</h4>
              <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("proj")}>
                <Plus size={15} /> Novo Projeto
              </button>
            </div>
            <div className="editor-item-list">
              {data?.pt?.proj?.items?.map((item, idx) => (
                <div key={idx} className="editor-item-card">
                  <div className="editor-item-grid">
                    <Field label="Nome do Projeto">
                      <input
                        className="form-input"
                        value={item.name || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.proj.items[idx].name = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Categoria">
                      <input
                        className="form-input"
                        placeholder="ex: Governança, IA"
                        value={item.category || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.proj.items[idx].category = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Link (GitHub / Web)">
                      <input
                        className="form-input"
                        value={item.link || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.proj.items[idx].link = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Descrição" full>
                      <textarea
                        className="form-input field-textarea"
                        value={item.desc || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.proj.items[idx].desc = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                  </div>
                  <div className="editor-item-actions">
                    <TrashButton onClick={() => REMOVE_ITEM("proj", idx)} label="Remover projeto" />
                  </div>
                </div>
              ))}
              {!data?.pt?.proj?.items?.length && <EmptyHint text="Nenhum projeto cadastrado ainda." />}
            </div>
          </div>
        )}

        {/* --- FRONTEND: CERTIFICAÇÕES --- */}
        {activeFile === "portfolio.json" && activeSection === "cert" && (
          <div className="editor-section">
            <div className="editor-section-head">
              <h4 className="editor-section-title">Certificações & Credenciais</h4>
              <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("cert")}>
                <Plus size={15} /> Nova Certificação
              </button>
            </div>
            <div className="editor-item-list">
              {data?.pt?.cert?.items?.map((item, idx) => (
                <div key={idx} className="editor-item-card">
                  <div className="editor-item-grid">
                    <Field label="Nome da Certificação">
                      <input
                        className="form-input"
                        value={item.name || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.cert.items[idx].name = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Emissor">
                      <input
                        className="form-input"
                        placeholder="ex: Axelos, ISO"
                        value={item.issuer || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.cert.items[idx].issuer = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Ano">
                      <input
                        className="form-input"
                        value={item.year || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.cert.items[idx].year = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="URL da Credencial" full>
                      <input
                        className="form-input"
                        value={item.credential_url || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.cert.items[idx].credential_url = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                    <Field label="Descrição da Competência" full>
                      <textarea
                        className="form-input field-textarea"
                        value={item.description || ""}
                        onChange={e => {
                          const d = { ...data };
                          d.pt.cert.items[idx].description = e.target.value;
                          setData(d);
                        }}
                      />
                    </Field>
                  </div>
                  <div className="editor-item-actions">
                    <TrashButton onClick={() => REMOVE_ITEM("cert", idx)} label="Remover certificação" />
                  </div>
                </div>
              ))}
              {!data?.pt?.cert?.items?.length && <EmptyHint text="Nenhuma certificação cadastrada ainda." />}
            </div>
          </div>
        )}

        {/* --- RAG: CONTEXTO DA IA --- */}
        {activeFile === "portfolio_data.json" && (
          <div className="editor-section">
            <Field label="Instruções de Comportamento (System Prompt)">
              <textarea
                className="form-input field-textarea"
                value={data?.instrucoes_ia || ""}
                onChange={e => {
                  const d = { ...data };
                  d.instrucoes_ia = e.target.value;
                  setData(d);
                }}
              />
            </Field>

            <div className="editor-grid-2">
              <div className="editor-item-card editor-item-card--stack">
                <h4 className="editor-section-title">Dados Pessoais</h4>
                <Field label="Nome">
                  <input
                    className="form-input"
                    value={data?.dados_pessoais?.nome || ""}
                    onChange={e => {
                      const d = { ...data };
                      d.dados_pessoais.nome = e.target.value;
                      setData(d);
                    }}
                  />
                </Field>
                <Field label="Localização">
                  <input
                    className="form-input"
                    value={data?.dados_pessoais?.localizacao || ""}
                    onChange={e => {
                      const d = { ...data };
                      d.dados_pessoais.localizacao = e.target.value;
                      setData(d);
                    }}
                  />
                </Field>
                <Field label="Perfil">
                  <textarea
                    className="form-input field-textarea"
                    value={data?.dados_pessoais?.perfil || ""}
                    onChange={e => {
                      const d = { ...data };
                      d.dados_pessoais.perfil = e.target.value;
                      setData(d);
                    }}
                  />
                </Field>
              </div>

              <div className="editor-item-card editor-item-card--stack">
                <h4 className="editor-section-title">Contatos</h4>
                <Field label="Email">
                  <input
                    className="form-input"
                    value={data?.contatos?.email || ""}
                    onChange={e => {
                      const d = { ...data };
                      d.contatos.email = e.target.value;
                      setData(d);
                    }}
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    className="form-input"
                    value={data?.contatos?.linkedin || ""}
                    onChange={e => {
                      const d = { ...data };
                      d.contatos.linkedin = e.target.value;
                      setData(d);
                    }}
                  />
                </Field>
                <Field label="GitHub">
                  <input
                    className="form-input"
                    value={data?.contatos?.github || ""}
                    onChange={e => {
                      const d = { ...data };
                      d.contatos.github = e.target.value;
                      setData(d);
                    }}
                  />
                </Field>
                <Field label="Site">
                  <input
                    className="form-input"
                    value={data?.contatos?.portfolio_web || ""}
                    onChange={e => {
                      const d = { ...data };
                      d.contatos.portfolio_web = e.target.value;
                      setData(d);
                    }}
                  />
                </Field>
              </div>
            </div>

            <div className="editor-grid-2">
              <div className="editor-section">
                <div className="editor-section-head">
                  <h4 className="editor-section-title">Habilidades Técnicas</h4>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("habilidades_tecnicas")}>
                    <Plus size={15} /> Adicionar
                  </button>
                </div>
                <div className="editor-tag-list">
                  {data?.habilidades_tecnicas?.map((item, idx) => (
                    <div key={`hab-${idx}`} className="editor-tag-row">
                      <input
                        className="form-input"
                        value={item}
                        onChange={e => {
                          const d = { ...data };
                          d.habilidades_tecnicas[idx] = e.target.value;
                          setData(d);
                        }}
                      />
                      <TrashButton onClick={() => REMOVE_ITEM("habilidades_tecnicas", idx)} label="Remover habilidade" />
                    </div>
                  ))}
                  {!data?.habilidades_tecnicas?.length && <EmptyHint text="Nenhuma habilidade cadastrada." />}
                </div>
              </div>

              <div className="editor-section">
                <div className="editor-section-head">
                  <h4 className="editor-section-title">Governança e Processos</h4>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("governanca_e_processos")}>
                    <Plus size={15} /> Adicionar
                  </button>
                </div>
                <div className="editor-tag-list">
                  {data?.governanca_e_processos?.map((item, idx) => (
                    <div key={`gov-${idx}`} className="editor-tag-row">
                      <input
                        className="form-input"
                        value={item}
                        onChange={e => {
                          const d = { ...data };
                          d.governanca_e_processos[idx] = e.target.value;
                          setData(d);
                        }}
                      />
                      <TrashButton onClick={() => REMOVE_ITEM("governanca_e_processos", idx)} label="Remover item de governança" />
                    </div>
                  ))}
                  {!data?.governanca_e_processos?.length && <EmptyHint text="Nenhum item cadastrado." />}
                </div>
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-section-head">
                <h4 className="editor-section-title">Experiências Profissionais (Resumo IA)</h4>
                <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("experiencias_profissionais")}>
                  <Plus size={15} /> Experiência IA
                </button>
              </div>
              <div className="editor-item-list">
                {data?.experiencias_profissionais?.map((item, idx) => (
                  <div key={`expia-${idx}`} className="editor-item-card">
                    <div className="editor-item-grid editor-item-grid--2">
                      <Field label="Empresa">
                        <input
                          className="form-input"
                          value={item.empresa || ""}
                          onChange={e => {
                            const d = { ...data };
                            d.experiencias_profissionais[idx].empresa = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                      <Field label="Resumo Técnico" full>
                        <textarea
                          className="form-input field-textarea"
                          value={item.resumo_tecnico || ""}
                          onChange={e => {
                            const d = { ...data };
                            d.experiencias_profissionais[idx].resumo_tecnico = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                    </div>
                    <div className="editor-item-actions">
                      <TrashButton onClick={() => REMOVE_ITEM("experiencias_profissionais", idx)} label="Remover experiência de IA" />
                    </div>
                  </div>
                ))}
                {!data?.experiencias_profissionais?.length && <EmptyHint text="Nenhum resumo cadastrado." />}
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-section-head">
                <h4 className="editor-section-title">Projetos em Destaque (Resumo IA)</h4>
                <button type="button" className="btn-secondary btn-sm" onClick={() => ADD_ITEM("projetos_destaque")}>
                  <Plus size={15} /> Projeto IA
                </button>
              </div>
              <div className="editor-item-list">
                {data?.projetos_destaque?.map((item, idx) => (
                  <div key={`projia-${idx}`} className="editor-item-card">
                    <div className="editor-item-grid">
                      <Field label="Nome">
                        <input
                          className="form-input"
                          value={item.nome || ""}
                          onChange={e => {
                            const d = { ...data };
                            d.projetos_destaque[idx].nome = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                      <Field label="Link GitHub">
                        <input
                          className="form-input"
                          value={item.github || ""}
                          onChange={e => {
                            const d = { ...data };
                            d.projetos_destaque[idx].github = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                      <Field label="Descrição" full>
                        <textarea
                          className="form-input field-textarea"
                          value={item.descricao || ""}
                          onChange={e => {
                            const d = { ...data };
                            d.projetos_destaque[idx].descricao = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                    </div>
                    <div className="editor-item-actions">
                      <TrashButton onClick={() => REMOVE_ITEM("projetos_destaque", idx)} label="Remover projeto de IA" />
                    </div>
                  </div>
                ))}
                {!data?.projetos_destaque?.length && <EmptyHint text="Nenhum projeto cadastrado." />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Campo com micro-label semântico — reutilizado em todas as seções do editor
function Field({ label, full = false, children }) {
  return (
    <div className={`field-group ${full ? "field-group--full" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}

// Botão de exclusão discreto: ganha destaque (cor de perigo) apenas no hover/foco
function TrashButton({ onClick, label, size = 16 }) {
  return (
    <button
      type="button"
      className="btn-icon btn-icon--danger-hover"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Trash2 size={size} />
    </button>
  );
}

function EmptyHint({ text }) {
  return <p className="editor-empty-hint">{text}</p>;
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
          className={`glass-card editor-toast editor-toast--${toast.type}`}
        >
          <span className="editor-toast-message">{toast.message}</span>
          <button type="button" onClick={onClose} aria-label="Fechar notificação" className="btn-icon btn-icon--on-accent">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

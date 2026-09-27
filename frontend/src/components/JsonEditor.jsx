// frontend/src/components/JsonEditor.jsx

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trash2, Plus, Save, Loader2, Check, X, ChevronDown,
  Briefcase, Rocket, Award, Sparkles, FileText
} from "lucide-react";

// duracao em ms que o toast permanece visivel antes de auto-fechar
const TOAST_TTL_MS = 4000;
// duracao em ms que o botao de salvar mostra o estado "Salvo!"
const SAVED_FLASH_MS = 1800;
// limite recomendado (nao bloqueante) para o system prompt da ia
const PROMPT_SOFT_LIMIT = 600;

const SECTION_TABS = [
  { id: "skills", label: "Habilidades", icon: Sparkles },
  { id: "exp", label: "Experiências", icon: Briefcase, countPath: ["pt", "exp", "items"] },
  { id: "proj", label: "Projetos", icon: Rocket, countPath: ["pt", "proj", "items"] },
  { id: "cert", label: "Certificações", icon: Award, countPath: ["pt", "cert", "items"] }
];

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

// le um caminho aninhado com seguranca (["pt","exp","items"] -> data.pt.exp.items)
const getPath = (obj, path) => path.reduce((acc, key) => acc?.[key], obj);

// resume um texto longo para preview no cabecalho recolhido do accordion
const preview = (text, max = 72) => {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
};

// extrai uma mensagem legivel do corpo de erro da api: string simples (ex.:
// falha de permissao em disco) ou lista de erros de validacao pydantic (422)
const extractErrorDetail = err => {
  if (!err) return "";
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail
      .map(d => (d?.msg ? `${(d.loc || []).slice(-1)[0] ?? "campo"}: ${d.msg}` : JSON.stringify(d)))
      .join(" · ");
  }
  return err.message || "";
};

export default function JsonEditor({ onSessionLost }) {
  const [data, setData] = useState(null);
  const [activeFile, setActiveFile] = useState("portfolio.json");
  const [activeSection, setActiveSection] = useState("exp");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  // referencia (nao indice) do item de lista atualmente expandido — estavel
  // atraves de edicoes de campo, ja que os itens sao mutados in-place
  const [expandedItem, setExpandedItem] = useState(null);
  // toast = { type: "success" | "error", message: string } ou null
  const [toast, setToast] = useState(null);

  const justLoadedRef = useRef(false);

  // EXIBE TOAST E AGENDA AUTO-DISMISS
  const SHOW_TOAST = (type, message) => {
    setToast({ type, message, key: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_TTL_MS);
    return () => clearTimeout(id);
  }, [toast]);

  // marca "alteracoes pendentes" em qualquer mutacao de dados que nao seja
  // o carregamento inicial do arquivo (LOAD sinaliza justLoadedRef antes)
  useEffect(() => {
    if (!data) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    setIsDirty(true);
  }, [data]);

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
        justLoadedRef.current = true;
        setData(json);
      }

      setActiveFile(file);
      setExpandedItem(null);
      setIsDirty(false);
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(extractErrorDetail(err) || `Erro HTTP ${res.status} ao salvar.`);
      }

      SHOW_TOAST("success", "Dados sincronizados com sucesso.");
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), SAVED_FLASH_MS);
    } catch (e) {
      console.error("falha ao salvar json", e);
      SHOW_TOAST("error", e.message || "Falha ao salvar. Verifique a conexão com a API.");
    } finally {
      setIsSaving(false);
    }
  };

  // ADICIONA ITENS DINAMICAMENTE BASEADO NO ARQUIVO ATUAL — itens de lista
  // (objetos) sao criados e imediatamente expandidos para edicao
  const ADD_ITEM = (section, subArray = "items") => {
    const newData = { ...data };
    let createdItem = null;

    if (activeFile === "portfolio.json") {
      if (!newData.pt) newData.pt = {};
      if (!newData.pt[section]) newData.pt[section] = {};
      if (!newData.pt[section][subArray]) newData.pt[section][subArray] = [];

      if (section === "exp") {
        createdItem = { role: "", company: "", time: "", desc: "" };
        newData.pt.exp.items.unshift(createdItem);
      } else if (section === "proj") {
        createdItem = { name: "", desc: "", link: "", category: "Fullstack", tags: [] };
        newData.pt.proj.items.unshift(createdItem);
      } else if (section === "cert") {
        createdItem = { name: "", issuer: "", year: "", credential_url: "", description: "" };
        newData.pt.cert.items.unshift(createdItem);
      } else if (section === "skills") {
        newData.pt.skills[subArray].push("");
      }
    } else if (activeFile === "portfolio_data.json") {
      if (!newData[section]) newData[section] = [];

      if (section === "experiencias_profissionais") {
        createdItem = { empresa: "", resumo_tecnico: "" };
        newData[section].unshift(createdItem);
      } else if (section === "projetos_destaque") {
        createdItem = { nome: "", descricao: "", github: "" };
        newData[section].unshift(createdItem);
      } else if (section === "habilidades_tecnicas" || section === "governanca_e_processos") {
        newData[section].push("");
      }
    }

    setData(newData);
    if (createdItem) setExpandedItem(createdItem);
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

  // ADICIONA UMA TAG JA COM O VALOR DIGITADO (fluxo "Enter para adicionar")
  const ADD_TAG = value => {
    const d = { ...data };
    if (!d.pt.skills.tags) d.pt.skills.tags = [];
    d.pt.skills.tags = [...d.pt.skills.tags, value];
    setData(d);
  };

  const RENAME_TAG = (idx, value) => {
    const d = { ...data };
    d.pt.skills.tags[idx] = value;
    setData(d);
  };

  useEffect(() => {
    LOAD("portfolio.json");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <p className="editor-empty-hint">Carregando gerenciador de conteúdo...</p>;

  const toggleExpanded = item => setExpandedItem(prev => (prev === item ? null : item));

  return (
    <div className="editor-shell">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="glass-card editor-panel">
        <div className="editor-toolbar-bar">
          {/* Linha 1: seletor de arquivo + status de sincronização */}
          <div className="editor-toolbar-row">
            <div className="segmented-control" role="tablist" aria-label="Arquivo de configuração">
              {[
                { id: "portfolio.json", label: "Portfólio (Vitrine Pública)" },
                { id: "portfolio_data.json", label: "Contexto IA (RAG)" }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={activeFile === opt.id}
                  className={`segmented-option ${activeFile === opt.id ? "is-active" : ""}`}
                  onClick={() => LOAD(opt.id)}
                >
                  {activeFile === opt.id && (
                    <motion.span
                      layoutId="editor-segmented-pill"
                      className="segmented-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="segmented-label">{opt.label}</span>
                </button>
              ))}
            </div>

            <span
              className={`sync-badge ${isDirty ? "sync-badge--pending" : "sync-badge--synced"}`}
              role="status"
            >
              <span className="sync-dot" />
              {isDirty ? "Alterações pendentes" : "Sincronizado"}
            </span>
          </div>

          {/* Linha 2: abas de seção (apenas para o portfólio) + salvar */}
          <div className="editor-toolbar-row">
            {activeFile === "portfolio.json" ? (
              <div role="tablist" aria-label="Seções do portfólio" className="editor-tabs">
                {SECTION_TABS.map(tab => {
                  const Icon = tab.icon;
                  const count = tab.countPath ? getPath(data, tab.countPath)?.length : null;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeSection === tab.id}
                      className={`category-pill editor-tab ${activeSection === tab.id ? "active" : ""}`}
                      onClick={() => setActiveSection(tab.id)}
                    >
                      <Icon size={14} />
                      {tab.label}
                      {count !== null && count !== undefined && (
                        <span className="editor-tab-count">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="editor-toolbar-file">
                <FileText size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                portfolio_data.json
              </span>
            )}

            <button type="button" className="btn-primary btn-sm" onClick={SAVE} disabled={isSaving}>
              {isSaving ? (
                <Loader2 size={16} className="icon-spin" />
              ) : justSaved ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? "Salvando..." : justSaved ? "Salvo!" : "Salvar Alterações"}
            </button>
          </div>
        </div>

        {/* --- FRONTEND: HABILIDADES --- */}
        {activeFile === "portfolio.json" && activeSection === "skills" && (
          <div className="editor-section">
            <div className="editor-item-grid editor-item-grid--2">
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
            </div>
            <ChipInput
              tags={data?.pt?.skills?.tags || []}
              onAdd={ADD_TAG}
              onRemove={idx => REMOVE_ITEM("skills", idx, "tags")}
              onRename={RENAME_TAG}
            />
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
            <div className="accordion-list">
              {data?.pt?.exp?.items?.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  icon={Briefcase}
                  title={item.company}
                  placeholderTitle="Nova experiência"
                  subtitle={item.role || "Cargo não informado"}
                  badge={item.time || null}
                  isOpen={expandedItem === item}
                  onToggle={() => toggleExpanded(item)}
                  onDelete={() => REMOVE_ITEM("exp", idx)}
                  deleteLabel="Remover experiência"
                >
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
                </AccordionItem>
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
            <div className="accordion-list">
              {data?.pt?.proj?.items?.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  icon={Rocket}
                  title={item.name}
                  placeholderTitle="Novo projeto"
                  subtitle={item.category || "Sem categoria"}
                  badge={`${item.tags?.length || 0} tags`}
                  isOpen={expandedItem === item}
                  onToggle={() => toggleExpanded(item)}
                  onDelete={() => REMOVE_ITEM("proj", idx)}
                  deleteLabel="Remover projeto"
                >
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
                </AccordionItem>
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
            <div className="accordion-list">
              {data?.pt?.cert?.items?.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  icon={Award}
                  title={item.name}
                  placeholderTitle="Nova certificação"
                  subtitle={item.issuer || "Emissor não informado"}
                  badge={item.year || null}
                  isOpen={expandedItem === item}
                  onToggle={() => toggleExpanded(item)}
                  onDelete={() => REMOVE_ITEM("cert", idx)}
                  deleteLabel="Remover certificação"
                >
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
                </AccordionItem>
              ))}
              {!data?.pt?.cert?.items?.length && <EmptyHint text="Nenhuma certificação cadastrada ainda." />}
            </div>
          </div>
        )}

        {/* --- RAG: CONTEXTO DA IA --- */}
        {activeFile === "portfolio_data.json" && (
          <div className="editor-section">
            <div className="editor-rag-columns">
              {/* Coluna 1: identidade — dados pessoais + contatos */}
              <div className="editor-rag-col">
                <div className="editor-static-card">
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

                <div className="editor-static-card">
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

              {/* Coluna 2: prompt de sistema — instrução central da ia */}
              <div className="editor-rag-col">
                <div className="editor-static-card">
                  <h4 className="editor-section-title">Prompt de Sistema & Instruções da IA</h4>
                  <Field label="Instruções de Comportamento (System Prompt)">
                    <textarea
                      className="form-input field-textarea field-textarea--tall"
                      value={data?.instrucoes_ia || ""}
                      onChange={e => {
                        const d = { ...data };
                        d.instrucoes_ia = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                  <div className="prompt-meta">
                    <span>
                      Dica: escreva em terceira pessoa (&ldquo;O Christian é...&rdquo;) e evite repetir dados já
                      cobertos em Habilidades e Experiências.
                    </span>
                    <span className="prompt-meta-count">
                      {(data?.instrucoes_ia || "").length}
                      {PROMPT_SOFT_LIMIT ? ` / ${PROMPT_SOFT_LIMIT}` : ""}
                    </span>
                  </div>
                </div>
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
              <div className="accordion-list">
                {data?.experiencias_profissionais?.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    icon={Briefcase}
                    title={item.empresa}
                    placeholderTitle="Nova experiência"
                    subtitle={preview(item.resumo_tecnico) || "Sem resumo técnico"}
                    isOpen={expandedItem === item}
                    onToggle={() => toggleExpanded(item)}
                    onDelete={() => REMOVE_ITEM("experiencias_profissionais", idx)}
                    deleteLabel="Remover experiência de IA"
                  >
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
                  </AccordionItem>
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
              <div className="accordion-list">
                {data?.projetos_destaque?.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    icon={Rocket}
                    title={item.nome}
                    placeholderTitle="Novo projeto"
                    subtitle={preview(item.descricao) || "Sem descrição"}
                    isOpen={expandedItem === item}
                    onToggle={() => toggleExpanded(item)}
                    onDelete={() => REMOVE_ITEM("projetos_destaque", idx)}
                    deleteLabel="Remover projeto de IA"
                  >
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
                  </AccordionItem>
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

// Linha de accordion reutilizada por Experiências, Projetos, Certificações e
// pelos resumos de IA — recolhida por padrão, expande sob demanda mantendo
// apenas um item ativo por vez (controlado pelo pai via isOpen/onToggle)
function AccordionItem({
  icon: Icon, title, placeholderTitle, subtitle, badge,
  isOpen, onToggle, onDelete, deleteLabel, children
}) {
  return (
    <div className={`accordion-item ${isOpen ? "is-open" : ""}`}>
      <div className="accordion-row">
        <button type="button" className="accordion-toggle" onClick={onToggle} aria-expanded={isOpen}>
          <span className="accordion-icon">
            <Icon size={17} />
          </span>
          <span className="accordion-heading">
            <span className={`accordion-title ${!title ? "accordion-title--placeholder" : ""}`}>
              {title || placeholderTitle}
            </span>
            {subtitle && <span className="accordion-subtitle">{subtitle}</span>}
          </span>
          {badge && <span className="badge-neutral">{badge}</span>}
        </button>
        <span className="accordion-actions">
          <TrashButton onClick={onDelete} label={deleteLabel} />
          <button
            type="button"
            className="btn-icon accordion-chevron"
            onClick={onToggle}
            aria-label={isOpen ? "Recolher" : "Expandir"}
            aria-expanded={isOpen}
          >
            <ChevronDown size={18} />
          </button>
        </span>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="accordion-body-wrap"
          >
            <div className="accordion-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Chips modernos para a lista de tags: "x" para remover + campo dedicado
// que adiciona uma nova tag ao pressionar Enter
function ChipInput({ tags, onAdd, onRemove, onRename }) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };

  return (
    <div className="editor-chip-list">
      {tags.map((tag, idx) => (
        <span key={`tag-${idx}`} className="editor-chip">
          <input
            className="editor-chip-input"
            value={tag}
            aria-label={`Editar tag ${idx + 1}`}
            onChange={e => onRename(idx, e.target.value)}
            style={{ width: `${Math.max(tag.length * 8, 24)}px` }}
          />
          <button
            type="button"
            className="editor-chip-remove"
            onClick={() => onRemove(idx)}
            aria-label={`Remover tag ${tag || idx + 1}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        className="editor-chip-add-input"
        placeholder="Adicionar tag e pressionar Enter…"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
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
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
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

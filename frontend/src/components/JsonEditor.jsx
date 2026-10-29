// frontend/src/components/JsonEditor.jsx

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Trash2,
  Plus,
  Save,
  Loader2,
  Check,
  X,
  ChevronDown,
  Download,
} from "lucide-react";
import { EASE_OUT, SPRING_INDICATOR } from "../utils/motion";

const TOAST_TTL_MS = 4000;
const SAVED_FLASH_MS = 1800;
const PROMPT_SOFT_LIMIT = 600;

const FILE_OPTIONS = [
  { id: "portfolio.json", label: "Portfólio público" },
  { id: "portfolio_data.json", label: "Base factual (RAG)" },
];

const viewTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: EASE_OUT } },
};

const iconSwap = {
  initial: { opacity: 0, scale: 0.6, rotate: -20 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  exit: { opacity: 0, scale: 0.6 },
  transition: { duration: 0.2, ease: EASE_OUT },
};

const SECTION_TABS = [
  { id: "hero", label: "Apresentação" },
  { id: "skills", label: "Habilidades" },
  { id: "exp", label: "Experiências", countPath: ["pt", "exp", "items"] },
  { id: "proj", label: "Projetos", countPath: ["pt", "proj", "items"] },
  { id: "cert", label: "Certificações", countPath: ["pt", "cert", "items"] },
];

const adminFetch = (path, options = {}) =>
  fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

const getPath = (obj, path) => path.reduce((acc, key) => acc?.[key], obj);

const preview = (text, max = 76) => {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
};

const extractErrorDetail = (err) => {
  if (!err) return "";
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((d) =>
        d?.msg
          ? `${(d.loc || []).slice(-1)[0] ?? "campo"}: ${d.msg}`
          : JSON.stringify(d)
      )
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
  const [expandedItem, setExpandedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const justLoadedRef = useRef(false);

  const showToast = (type, message) => {
    setToast({ type, message, key: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_TTL_MS);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!data) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    setIsDirty(true);
  }, [data]);

  const handleAuthLoss = (res) => {
    if ([401, 403].includes(res.status)) {
      if (typeof onSessionLost === "function") onSessionLost();
      return true;
    }
    return false;
  };

  const loadFile = async (file) => {
    try {
      const res = await adminFetch(`/api/admin/config?filename=${file}`);
      if (handleAuthLoss(res)) return;
      if (!res.ok) throw new Error(`http ${res.status}`);

      const json = await res.json();
      justLoadedRef.current = true;
      setData(json);
      setActiveFile(file);
      setExpandedItem(null);
      setIsDirty(false);
      if (file === "portfolio.json") setActiveSection("exp");
      if (file === "portfolio_data.json") setActiveSection("ia");
    } catch (e) {
      console.error("falha ao carregar json", e);
      showToast("error", "Não foi possível carregar o arquivo de configuração.");
    }
  };

  const saveFile = async () => {
    setIsSaving(true);
    try {
      const res = await adminFetch("/api/admin/config", {
        method: "POST",
        body: JSON.stringify({ filename: activeFile, content: data }),
      });
      if (handleAuthLoss(res)) return;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          extractErrorDetail(err) || `Erro HTTP ${res.status} ao salvar.`
        );
      }

      showToast("success", "Alterações gravadas com sucesso.");
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), SAVED_FLASH_MS);
    } catch (e) {
      console.error("falha ao salvar json", e);
      showToast(
        "error",
        e.message || "Falha ao gravar arquivo. Verifique os campos obrigatórios."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const exportJson = () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("success", `Cópia de ${activeFile} baixada.`);
    } catch {
      showToast("error", "Não foi possível gerar o arquivo de backup.");
    }
  };

  const addItem = (section, subArray = "items") => {
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
        createdItem = {
          name: "",
          desc: "",
          link: "",
          category: "Governança & Dados",
          tags: [],
          architecture: "",
        };
        newData.pt.proj.items.unshift(createdItem);
      } else if (section === "cert") {
        createdItem = {
          name: "",
          issuer: "",
          year: "",
          credential_url: "",
          description: "",
        };
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
      } else if (
        section === "habilidades_tecnicas" ||
        section === "governanca_e_processos"
      ) {
        newData[section].push("");
      }
    }

    setData(newData);
    if (createdItem) setExpandedItem(createdItem);
  };

  const removeItem = (section, index, subArray = "items") => {
    const newData = { ...data };

    if (activeFile === "portfolio.json" && newData.pt?.[section]?.[subArray]) {
      newData.pt[section][subArray].splice(index, 1);
    } else if (activeFile === "portfolio_data.json" && newData[section]) {
      newData[section].splice(index, 1);
    }

    setData(newData);
  };

  const addSkillTag = (value) => {
    const d = { ...data };
    if (!d.pt.skills.tags) d.pt.skills.tags = [];
    d.pt.skills.tags = [...d.pt.skills.tags, value];
    setData(d);
  };

  const renameSkillTag = (idx, value) => {
    const d = { ...data };
    d.pt.skills.tags[idx] = value;
    setData(d);
  };

  const addProjectTag = (projIdx, value) => {
    const d = { ...data };
    const item = d.pt.proj.items[projIdx];
    item.tags = [...(item.tags || []), value];
    setData(d);
  };

  const removeProjectTag = (projIdx, tagIdx) => {
    const d = { ...data };
    d.pt.proj.items[projIdx].tags.splice(tagIdx, 1);
    setData(d);
  };

  const renameProjectTag = (projIdx, tagIdx, value) => {
    const d = { ...data };
    d.pt.proj.items[projIdx].tags[tagIdx] = value;
    setData(d);
  };

  useEffect(() => {
    loadFile("portfolio.json");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return <p className="editor-empty-hint">Carregando estrutura de dados...</p>;
  }

  const toggleExpanded = (item) =>
    setExpandedItem((prev) => (prev === item ? null : item));

  const viewKey = activeFile === "portfolio.json" ? activeSection : "rag";
  const saveState = isSaving ? "saving" : justSaved ? "saved" : "idle";

  return (
    <div className="editor-shell">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="surface-card editor-panel">
        <div className="editor-toolbar-bar">
          <div className="editor-toolbar-row">
            <div
              className="segmented-control"
              role="tablist"
              aria-label="Arquivo de configuração"
            >
              <LayoutGroup id="editor-file">
                {FILE_OPTIONS.map((opt) => {
                  const isActive = activeFile === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`segmented-option ${isActive ? "is-active" : ""}`}
                      onClick={() => !isActive && loadFile(opt.id)}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="segmented-thumb"
                          className="segmented-thumb"
                          transition={SPRING_INDICATOR}
                        />
                      )}
                      <span className="segmented-label">{opt.label}</span>
                    </button>
                  );
                })}
              </LayoutGroup>
            </div>

            <div className="editor-toolbar-actions">
              <span
                className={`sync-badge ${
                  isDirty ? "sync-badge--pending" : "sync-badge--synced"
                }`}
                role="status"
              >
                <span className="sync-dot" />
                {isDirty ? "Alterações não salvas" : "Sincronizado"}
              </span>

              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={exportJson}
                title={`Baixar cópia de segurança de ${activeFile}`}
              >
                <Download size={14} />
                <span>Backup</span>
              </button>

              <motion.button
                type="button"
                className={`btn-primary btn-sm ${isDirty && !isSaving ? "is-dirty" : ""}`}
                onClick={saveFile}
                disabled={isSaving}
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={saveState} className="btn-icon-swap" {...iconSwap}>
                    {saveState === "saving" ? (
                      <Loader2 size={15} className="icon-spin" />
                    ) : saveState === "saved" ? (
                      <Check size={15} />
                    ) : (
                      <Save size={15} />
                    )}
                  </motion.span>
                </AnimatePresence>
                <span>
                  {isSaving
                    ? "Gravando..."
                    : justSaved
                    ? "Salvo"
                    : "Salvar alterações"}
                </span>
              </motion.button>
            </div>
          </div>

          {activeFile === "portfolio.json" ? (
            <LayoutGroup id="editor-sections">
              <div
                role="tablist"
                aria-label="Seções do portfólio"
                className="underline-tabs editor-subtabs"
              >
                {SECTION_TABS.map((tab) => {
                  const count = tab.countPath
                    ? getPath(data, tab.countPath)?.length
                    : null;
                  const isActive = activeSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`underline-tab ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveSection(tab.id)}
                    >
                      <span className="underline-tab-label">
                        <span>{tab.label}</span>
                        {count !== null && count !== undefined && (
                          <span className="editor-tab-count">{count}</span>
                        )}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="editor-section-indicator"
                          className="underline-tab-indicator"
                          transition={SPRING_INDICATOR}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          ) : (
            <div className="editor-file-meta">
              Arquivo ativo: <code>backend/data/portfolio_data.json</code>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={viewKey} className="editor-view" {...viewTransition}>
            {/* --- FRONTEND: APRESENTAÇÃO (HERO) --- */}
            {activeFile === "portfolio.json" && activeSection === "hero" && (
              <div className="editor-section">
                <h3 className="editor-section-title">Apresentação principal (Hero)</h3>
                <div className="editor-item-grid">
                  <Field label="Título principal">
                    <input
                      className="form-input"
                      value={data?.pt?.hero?.greeting || ""}
                      onChange={(e) => {
                        const d = { ...data };
                        d.pt.hero.greeting = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                  <Field label="Texto do botão de contato">
                    <input
                      className="form-input"
                      value={data?.pt?.hero?.contactBtn || ""}
                      onChange={(e) => {
                        const d = { ...data };
                        d.pt.hero.contactBtn = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                  <Field label="Texto do botão secundário">
                    <input
                      className="form-input"
                      value={data?.pt?.hero?.resumeBtn || ""}
                      onChange={(e) => {
                        const d = { ...data };
                        d.pt.hero.resumeBtn = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                  <Field label="Descrição de posicionamento" full>
                    <textarea
                      className="form-input field-textarea"
                      value={data?.pt?.hero?.subtitle || ""}
                      onChange={(e) => {
                        const d = { ...data };
                        d.pt.hero.subtitle = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* --- FRONTEND: HABILIDADES --- */}
            {activeFile === "portfolio.json" && activeSection === "skills" && (
              <div className="editor-section">
                <div className="editor-item-grid editor-item-grid--2">
                  <Field label="Título da seção">
                    <input
                      className="form-input"
                      value={data?.pt?.skills?.title || ""}
                      onChange={(e) => {
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
                      onChange={(e) => {
                        const d = { ...data };
                        d.pt.skills.subtitle = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                </div>

                <div className="editor-section-head">
                  <h4 className="editor-section-title">Frentes de atuação</h4>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => addItem("skills", "items")}
                  >
                    <Plus size={14} />
                    <span>Adicionar item</span>
                  </button>
                </div>
                <div className="editor-tag-list">
                  {data?.pt?.skills?.items?.map((item, idx) => (
                    <div key={`item-${idx}`} className="editor-tag-row">
                      <input
                        className="form-input"
                        value={item}
                        onChange={(e) => {
                          const d = { ...data };
                          d.pt.skills.items[idx] = e.target.value;
                          setData(d);
                        }}
                      />
                      <TrashButton
                        onClick={() => removeItem("skills", idx, "items")}
                        label="Remover item"
                      />
                    </div>
                  ))}
                  {!data?.pt?.skills?.items?.length && (
                    <EmptyHint text="Nenhum item cadastrado." />
                  )}
                </div>

                <div className="editor-section-head">
                  <h4 className="editor-section-title">Tecnologias e ferramentas</h4>
                </div>
                <ChipInput
                  tags={data?.pt?.skills?.tags || []}
                  onAdd={addSkillTag}
                  onRemove={(idx) => removeItem("skills", idx, "tags")}
                  onRename={renameSkillTag}
                />
              </div>
            )}

            {/* --- FRONTEND: EXPERIÊNCIAS --- */}
            {activeFile === "portfolio.json" && activeSection === "exp" && (
              <div className="editor-section">
                <div className="editor-section-head">
                  <h4 className="editor-section-title">Experiências profissionais</h4>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => addItem("exp")}
                  >
                    <Plus size={14} />
                    <span>Nova experiência</span>
                  </button>
                </div>
                <div className="accordion-list">
                  {data?.pt?.exp?.items?.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      title={item.company}
                      placeholderTitle="Nova experiência"
                      subtitle={item.role || "Cargo não informado"}
                      badge={item.time || null}
                      isOpen={expandedItem === item}
                      onToggle={() => toggleExpanded(item)}
                      onDelete={() => removeItem("exp", idx)}
                      deleteLabel="Remover experiência"
                    >
                      <div className="editor-item-grid">
                        <Field label="Empresa">
                          <input
                            className="form-input"
                            value={item.company || ""}
                            onChange={(e) => {
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
                            onChange={(e) => {
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
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.exp.items[idx].time = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="Descrição das atividades" full>
                          <textarea
                            className="form-input field-textarea"
                            value={item.desc || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.exp.items[idx].desc = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                      </div>
                    </AccordionItem>
                  ))}
                  {!data?.pt?.exp?.items?.length && (
                    <EmptyHint text="Nenhuma experiência cadastrada." />
                  )}
                </div>
              </div>
            )}

            {/* --- FRONTEND: PROJETOS --- */}
            {activeFile === "portfolio.json" && activeSection === "proj" && (
              <div className="editor-section">
                <div className="editor-section-head">
                  <h4 className="editor-section-title">Projetos publicados</h4>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => addItem("proj")}
                  >
                    <Plus size={14} />
                    <span>Novo projeto</span>
                  </button>
                </div>
                <div className="accordion-list">
                  {data?.pt?.proj?.items?.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      title={item.name}
                      placeholderTitle="Novo projeto"
                      subtitle={item.category || "Sem categoria"}
                      badge={`${item.tags?.length || 0} tags`}
                      isOpen={expandedItem === item}
                      onToggle={() => toggleExpanded(item)}
                      onDelete={() => removeItem("proj", idx)}
                      deleteLabel="Remover projeto"
                    >
                      <div className="editor-item-grid">
                        <Field label="Nome do projeto">
                          <input
                            className="form-input"
                            value={item.name || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.proj.items[idx].name = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="Categoria">
                          <input
                            className="form-input"
                            placeholder="ex.: Governança & Dados"
                            value={item.category || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.proj.items[idx].category = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="URL do repositório / projeto">
                          <input
                            className="form-input"
                            value={item.link || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.proj.items[idx].link = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="Resumo público" full>
                          <textarea
                            className="form-input field-textarea"
                            value={item.desc || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.proj.items[idx].desc = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="Especificação técnica / arquitetura (opcional)" full>
                          <textarea
                            className="form-input field-textarea"
                            placeholder="Descreva fluxo de dados, isolamento, decisões técnicas e resultados..."
                            value={item.architecture || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.proj.items[idx].architecture = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="Tags de tecnologia" full>
                          <ChipInput
                            tags={item.tags || []}
                            onAdd={(val) => addProjectTag(idx, val)}
                            onRemove={(tagIdx) => removeProjectTag(idx, tagIdx)}
                            onRename={(tagIdx, val) => renameProjectTag(idx, tagIdx, val)}
                          />
                        </Field>
                      </div>
                    </AccordionItem>
                  ))}
                  {!data?.pt?.proj?.items?.length && (
                    <EmptyHint text="Nenhum projeto cadastrado." />
                  )}
                </div>
              </div>
            )}

            {/* --- FRONTEND: CERTIFICAÇÕES --- */}
            {activeFile === "portfolio.json" && activeSection === "cert" && (
              <div className="editor-section">
                <div className="editor-section-head">
                  <h4 className="editor-section-title">Certificações e credenciais</h4>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => addItem("cert")}
                  >
                    <Plus size={14} />
                    <span>Nova certificação</span>
                  </button>
                </div>
                <div className="accordion-list">
                  {data?.pt?.cert?.items?.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      title={item.name}
                      placeholderTitle="Nova certificação"
                      subtitle={item.issuer || "Emissor não informado"}
                      badge={item.year || null}
                      isOpen={expandedItem === item}
                      onToggle={() => toggleExpanded(item)}
                      onDelete={() => removeItem("cert", idx)}
                      deleteLabel="Remover certificação"
                    >
                      <div className="editor-item-grid">
                        <Field label="Nome da certificação">
                          <input
                            className="form-input"
                            value={item.name || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.cert.items[idx].name = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="Emissor">
                          <input
                            className="form-input"
                            placeholder="ex.: Axelos / PeopleCert"
                            value={item.issuer || ""}
                            onChange={(e) => {
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
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.cert.items[idx].year = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="URL de verificação (opcional)" full>
                          <input
                            className="form-input"
                            value={item.credential_url || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.cert.items[idx].credential_url = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                        <Field label="Escopo da competência" full>
                          <textarea
                            className="form-input field-textarea"
                            value={item.description || ""}
                            onChange={(e) => {
                              const d = { ...data };
                              d.pt.cert.items[idx].description = e.target.value;
                              setData(d);
                            }}
                          />
                        </Field>
                      </div>
                    </AccordionItem>
                  ))}
                  {!data?.pt?.cert?.items?.length && (
                    <EmptyHint text="Nenhuma certificação cadastrada." />
                  )}
                </div>
              </div>
            )}

            {/* --- RAG: CONTEXTO DA IA --- */}
            {activeFile === "portfolio_data.json" && (
              <div className="editor-section">
                <div className="editor-rag-columns">
                  <div className="editor-rag-col">
                    <div className="editor-static-card">
                      <h4 className="editor-section-title">Dados pessoais</h4>
                      <Field label="Nome">
                        <input
                          className="form-input"
                          value={data?.dados_pessoais?.nome || ""}
                          onChange={(e) => {
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
                          onChange={(e) => {
                            const d = { ...data };
                            d.dados_pessoais.localizacao = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                      <Field label="Perfil técnico">
                        <textarea
                          className="form-input field-textarea"
                          value={data?.dados_pessoais?.perfil || ""}
                          onChange={(e) => {
                            const d = { ...data };
                            d.dados_pessoais.perfil = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                    </div>

                    <div className="editor-static-card">
                      <h4 className="editor-section-title">Contatos</h4>
                      <Field label="E-mail">
                        <input
                          className="form-input"
                          value={data?.contatos?.email || ""}
                          onChange={(e) => {
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
                          onChange={(e) => {
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
                          onChange={(e) => {
                            const d = { ...data };
                            d.contatos.github = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                      <Field label="Site principal">
                        <input
                          className="form-input"
                          value={data?.contatos?.portfolio_web || ""}
                          onChange={(e) => {
                            const d = { ...data };
                            d.contatos.portfolio_web = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="editor-rag-col">
                    <div className="editor-static-card">
                      <h4 className="editor-section-title">Diretrizes do assistente (System Prompt)</h4>
                      <Field label="Instruções de comportamento">
                        <textarea
                          className="form-input field-textarea field-textarea--tall"
                          value={data?.instrucoes_ia || ""}
                          onChange={(e) => {
                            const d = { ...data };
                            d.instrucoes_ia = e.target.value;
                            setData(d);
                          }}
                        />
                      </Field>
                      <div className="prompt-meta">
                        <span>
                          Escreva em terceira pessoa (&ldquo;O Christian atua em...&rdquo;) e evite repetir listas já presentes abaixo.
                        </span>
                        <span className="prompt-meta-count">
                          {(data?.instrucoes_ia || "").length} / {PROMPT_SOFT_LIMIT}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="editor-grid-2">
                  <div className="editor-section">
                    <div className="editor-section-head">
                      <h4 className="editor-section-title">Habilidades técnicas (RAG)</h4>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => addItem("habilidades_tecnicas")}
                      >
                        <Plus size={14} />
                        <span>Adicionar</span>
                      </button>
                    </div>
                    <div className="editor-tag-list">
                      {data?.habilidades_tecnicas?.map((item, idx) => (
                        <div key={`hab-${idx}`} className="editor-tag-row">
                          <input
                            className="form-input"
                            value={item}
                            onChange={(e) => {
                              const d = { ...data };
                              d.habilidades_tecnicas[idx] = e.target.value;
                              setData(d);
                            }}
                          />
                          <TrashButton
                            onClick={() => removeItem("habilidades_tecnicas", idx)}
                            label="Remover habilidade"
                          />
                        </div>
                      ))}
                      {!data?.habilidades_tecnicas?.length && (
                        <EmptyHint text="Nenhuma habilidade cadastrada." />
                      )}
                    </div>
                  </div>

                  <div className="editor-section">
                    <div className="editor-section-head">
                      <h4 className="editor-section-title">Governança e processos (RAG)</h4>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => addItem("governanca_e_processos")}
                      >
                        <Plus size={14} />
                        <span>Adicionar</span>
                      </button>
                    </div>
                    <div className="editor-tag-list">
                      {data?.governanca_e_processos?.map((item, idx) => (
                        <div key={`gov-${idx}`} className="editor-tag-row">
                          <input
                            className="form-input"
                            value={item}
                            onChange={(e) => {
                              const d = { ...data };
                              d.governanca_e_processos[idx] = e.target.value;
                              setData(d);
                            }}
                          />
                          <TrashButton
                            onClick={() => removeItem("governanca_e_processos", idx)}
                            label="Remover item"
                          />
                        </div>
                      ))}
                      {!data?.governanca_e_processos?.length && (
                        <EmptyHint text="Nenhum item cadastrado." />
                      )}
                    </div>
                  </div>
                </div>

                <div className="editor-section">
                  <div className="editor-section-head">
                    <h4 className="editor-section-title">Experiências profissionais (Resumo IA)</h4>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => addItem("experiencias_profissionais")}
                    >
                      <Plus size={14} />
                      <span>Adicionar resumo</span>
                    </button>
                  </div>
                  <div className="accordion-list">
                    {data?.experiencias_profissionais?.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        title={item.empresa}
                        placeholderTitle="Nova experiência"
                        subtitle={preview(item.resumo_tecnico) || "Sem resumo técnico"}
                        isOpen={expandedItem === item}
                        onToggle={() => toggleExpanded(item)}
                        onDelete={() => removeItem("experiencias_profissionais", idx)}
                        deleteLabel="Remover experiência"
                      >
                        <div className="editor-item-grid editor-item-grid--2">
                          <Field label="Empresa">
                            <input
                              className="form-input"
                              value={item.empresa || ""}
                              onChange={(e) => {
                                const d = { ...data };
                                d.experiencias_profissionais[idx].empresa =
                                  e.target.value;
                                setData(d);
                              }}
                            />
                          </Field>
                          <Field label="Resumo técnico" full>
                            <textarea
                              className="form-input field-textarea"
                              value={item.resumo_tecnico || ""}
                              onChange={(e) => {
                                const d = { ...data };
                                d.experiencias_profissionais[idx].resumo_tecnico =
                                  e.target.value;
                                setData(d);
                              }}
                            />
                          </Field>
                        </div>
                      </AccordionItem>
                    ))}
                    {!data?.experiencias_profissionais?.length && (
                      <EmptyHint text="Nenhum resumo cadastrado." />
                    )}
                  </div>
                </div>

                <div className="editor-section">
                  <div className="editor-section-head">
                    <h4 className="editor-section-title">Projetos de destaque (Resumo IA)</h4>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => addItem("projetos_destaque")}
                    >
                      <Plus size={14} />
                      <span>Adicionar projeto</span>
                    </button>
                  </div>
                  <div className="accordion-list">
                    {data?.projetos_destaque?.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        title={item.nome}
                        placeholderTitle="Novo projeto"
                        subtitle={preview(item.descricao) || "Sem descrição"}
                        isOpen={expandedItem === item}
                        onToggle={() => toggleExpanded(item)}
                        onDelete={() => removeItem("projetos_destaque", idx)}
                        deleteLabel="Remover projeto"
                      >
                        <div className="editor-item-grid">
                          <Field label="Nome">
                            <input
                              className="form-input"
                              value={item.nome || ""}
                              onChange={(e) => {
                                const d = { ...data };
                                d.projetos_destaque[idx].nome = e.target.value;
                                setData(d);
                              }}
                            />
                          </Field>
                          <Field label="URL do GitHub">
                            <input
                              className="form-input"
                              value={item.github || ""}
                              onChange={(e) => {
                                const d = { ...data };
                                d.projetos_destaque[idx].github = e.target.value;
                                setData(d);
                              }}
                            />
                          </Field>
                          <Field label="Descrição técnica" full>
                            <textarea
                              className="form-input field-textarea"
                              value={item.descricao || ""}
                              onChange={(e) => {
                                const d = { ...data };
                                d.projetos_destaque[idx].descricao = e.target.value;
                                setData(d);
                              }}
                            />
                          </Field>
                        </div>
                      </AccordionItem>
                    ))}
                    {!data?.projetos_destaque?.length && (
                      <EmptyHint text="Nenhum projeto cadastrado." />
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AccordionItem({
  title,
  placeholderTitle,
  subtitle,
  badge,
  isOpen,
  onToggle,
  onDelete,
  deleteLabel,
  children,
}) {
  return (
    <div className={`accordion-item ${isOpen ? "is-open" : ""}`}>
      <div className="accordion-row">
        <button
          type="button"
          className="accordion-toggle"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <span className="accordion-heading">
            <span
              className={`accordion-title ${
                !title ? "accordion-title--placeholder" : ""
              }`}
            >
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
            <ChevronDown size={16} />
          </button>
        </span>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="accordion-body-wrap"
          >
            <div className="accordion-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
            onChange={(e) => onRename(idx, e.target.value)}
            style={{ width: `${Math.max(tag.length * 7.8, 28)}px` }}
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
        placeholder="Digitar tag + Enter…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}

function Field({ label, full = false, children }) {
  return (
    <div className={`field-group ${full ? "field-group--full" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}

function TrashButton({ onClick, label, size = 15 }) {
  return (
    <button
      type="button"
      className="btn-icon btn-icon--danger-hover"
      onClick={(e) => {
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

function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className={`surface-card editor-toast editor-toast--${toast.type}`}
        >
          <span className="editor-toast-message">{toast.message}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar notificação"
            className="btn-icon"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// frontend/src/components/JsonEditor.jsx
//
// Editor controlado: a seção, o idioma de edição e o documento vêm do
// AdminDashboard (useContentStore). Aqui ficam apenas os formulários.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Plus, X, ChevronDown } from "lucide-react";
import { EASE_OUT } from "../utils/motion";
import { CONTENT_FILE, RAG_FILE } from "../hooks/useContentStore";

const PROMPT_SOFT_LIMIT = 600;
const MAX_ROW_TAGS = 4;

const LANG_NAMES = { pt: "Português", en: "English" };

const SECTION_META = {
  hero: {
    title: "Apresentação",
    description: "Título, texto de posicionamento e botões exibidos no topo do portfólio.",
  },
  skills: {
    title: "Habilidades",
    description: "Título da seção, frentes de atuação e tecnologias listadas em Competências.",
  },
  exp: {
    title: "Experiências",
    description: "Histórico profissional exibido na timeline, do mais recente ao mais antigo.",
  },
  proj: {
    title: "Projetos",
    description: "Projetos publicados com resumo, especificação técnica, categoria e tags.",
  },
  cert: {
    title: "Certificações",
    description: "Credenciais com emissor, ano e link de verificação.",
  },
  rag: {
    title: "Base factual da IA",
    description:
      "Contexto que o assistente do chat consulta para responder. Vale para os dois idiomas.",
  },
};

const preview = (text, max = 76) => {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
};

export default function JsonEditor({ section, lang = "pt", data, setData }) {
  const [expandedItem, setExpandedItem] = useState(null);
  const activeFile = section === "rag" ? RAG_FILE : CONTENT_FILE;

  const addItem = (sectionKey, subArray = "items") => {
    const newData = { ...data };
    let createdItem = null;

    if (activeFile === "portfolio.json") {
      if (!newData[lang]) newData[lang] = {};
      if (!newData[lang][sectionKey]) newData[lang][sectionKey] = {};
      if (!newData[lang][sectionKey][subArray]) newData[lang][sectionKey][subArray] = [];

      if (sectionKey === "exp") {
        createdItem = { role: "", company: "", time: "", desc: "" };
        newData[lang].exp.items.unshift(createdItem);
      } else if (sectionKey === "proj") {
        createdItem = {
          name: "",
          desc: "",
          link: "",
          category: lang === "en" ? "Governance & Data" : "Governança & Dados",
          tags: [],
          architecture: "",
        };
        newData[lang].proj.items.unshift(createdItem);
      } else if (sectionKey === "cert") {
        createdItem = {
          name: "",
          issuer: "",
          year: "",
          credential_url: "",
          description: "",
        };
        newData[lang].cert.items.unshift(createdItem);
      } else if (sectionKey === "skills") {
        newData[lang].skills[subArray].push("");
      }
    } else if (activeFile === "portfolio_data.json") {
      if (!newData[sectionKey]) newData[sectionKey] = [];

      if (sectionKey === "experiencias_profissionais") {
        createdItem = { empresa: "", resumo_tecnico: "" };
        newData[sectionKey].unshift(createdItem);
      } else if (sectionKey === "projetos_destaque") {
        createdItem = { nome: "", descricao: "", github: "" };
        newData[sectionKey].unshift(createdItem);
      } else if (
        sectionKey === "habilidades_tecnicas" ||
        sectionKey === "governanca_e_processos"
      ) {
        newData[sectionKey].push("");
      }
    }

    setData(newData);
    if (createdItem) setExpandedItem(createdItem);
  };

  const removeItem = (sectionKey, index, subArray = "items") => {
    const newData = { ...data };

    if (activeFile === "portfolio.json" && newData[lang]?.[sectionKey]?.[subArray]) {
      newData[lang][sectionKey][subArray].splice(index, 1);
    } else if (activeFile === "portfolio_data.json" && newData[sectionKey]) {
      newData[sectionKey].splice(index, 1);
    }

    setData(newData);
  };

  const addSkillTag = (value) => {
    const d = { ...data };
    if (!d[lang].skills.tags) d[lang].skills.tags = [];
    d[lang].skills.tags = [...d[lang].skills.tags, value];
    setData(d);
  };

  const renameSkillTag = (idx, value) => {
    const d = { ...data };
    d[lang].skills.tags[idx] = value;
    setData(d);
  };

  const addProjectTag = (projIdx, value) => {
    const d = { ...data };
    const item = d[lang].proj.items[projIdx];
    item.tags = [...(item.tags || []), value];
    setData(d);
  };

  const removeProjectTag = (projIdx, tagIdx) => {
    const d = { ...data };
    d[lang].proj.items[projIdx].tags.splice(tagIdx, 1);
    setData(d);
  };

  const renameProjectTag = (projIdx, tagIdx, value) => {
    const d = { ...data };
    d[lang].proj.items[projIdx].tags[tagIdx] = value;
    setData(d);
  };

  if (!data) {
    return <p className="editor-empty-hint">Carregando estrutura de dados...</p>;
  }

  const toggleExpanded = (item) =>
    setExpandedItem((prev) => (prev === item ? null : item));

  return (
    <div className="surface-card editor-panel">
      <EditorHeader section={section} lang={lang} />

      {/* --- FRONTEND: APRESENTAÇÃO (HERO) --- */}
      {section === "hero" && (
        <div className="editor-section">
          <div className="editor-item-grid">
            <Field label="Título principal">
              <input
                className="form-input"
                value={data?.[lang]?.hero?.greeting || ""}
                onChange={(e) => {
                  const d = { ...data };
                  d[lang].hero.greeting = e.target.value;
                  setData(d);
                }}
              />
            </Field>
            <Field label="Texto do botão de contato">
              <input
                className="form-input"
                value={data?.[lang]?.hero?.contactBtn || ""}
                onChange={(e) => {
                  const d = { ...data };
                  d[lang].hero.contactBtn = e.target.value;
                  setData(d);
                }}
              />
            </Field>
            <Field label="Texto do botão secundário">
              <input
                className="form-input"
                value={data?.[lang]?.hero?.resumeBtn || ""}
                onChange={(e) => {
                  const d = { ...data };
                  d[lang].hero.resumeBtn = e.target.value;
                  setData(d);
                }}
              />
            </Field>
            <Field label="Descrição de posicionamento" full>
              <textarea
                className="form-input field-textarea"
                value={data?.[lang]?.hero?.subtitle || ""}
                onChange={(e) => {
                  const d = { ...data };
                  d[lang].hero.subtitle = e.target.value;
                  setData(d);
                }}
              />
            </Field>
          </div>
        </div>
      )}

      {/* --- FRONTEND: HABILIDADES --- */}
      {section === "skills" && (
        <div className="editor-section">
          <div className="editor-item-grid editor-item-grid--2">
            <Field label="Título da seção">
              <input
                className="form-input"
                value={data?.[lang]?.skills?.title || ""}
                onChange={(e) => {
                  const d = { ...data };
                  d[lang].skills.title = e.target.value;
                  setData(d);
                }}
              />
            </Field>
            <Field label="Subtítulo">
              <input
                className="form-input"
                value={data?.[lang]?.skills?.subtitle || ""}
                onChange={(e) => {
                  const d = { ...data };
                  d[lang].skills.subtitle = e.target.value;
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
            {data?.[lang]?.skills?.items?.map((item, idx) => (
              <div key={`item-${idx}`} className="editor-tag-row">
                <input
                  className="form-input"
                  value={item}
                  onChange={(e) => {
                    const d = { ...data };
                    d[lang].skills.items[idx] = e.target.value;
                    setData(d);
                  }}
                />
                <TrashButton
                  onClick={() => removeItem("skills", idx, "items")}
                  label="Remover item"
                />
              </div>
            ))}
            {!data?.[lang]?.skills?.items?.length && (
              <EmptyHint text="Nenhum item cadastrado." />
            )}
          </div>

          <div className="editor-section-head">
            <h4 className="editor-section-title">Tecnologias e ferramentas</h4>
          </div>
          <ChipInput
            tags={data?.[lang]?.skills?.tags || []}
            onAdd={addSkillTag}
            onRemove={(idx) => removeItem("skills", idx, "tags")}
            onRename={renameSkillTag}
          />
        </div>
      )}

      {/* --- FRONTEND: EXPERIÊNCIAS --- */}
      {section === "exp" && (
        <div className="editor-section">
          <ListToolbar
            count={data?.[lang]?.exp?.items?.length}
            noun="experiência"
            addLabel="Nova experiência"
            onAdd={() => addItem("exp")}
          />
          <div className="accordion-list">
            {data?.[lang]?.exp?.items?.map((item, idx) => (
              <AccordionItem
                key={idx}
                title={item.role}
                placeholderTitle="Nova experiência"
                subtitle={item.company || "Empresa não informada"}
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
                        d[lang].exp.items[idx].company = e.target.value;
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
                        d[lang].exp.items[idx].role = e.target.value;
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
                        d[lang].exp.items[idx].time = e.target.value;
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
                        d[lang].exp.items[idx].desc = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                </div>
              </AccordionItem>
            ))}
            {!data?.[lang]?.exp?.items?.length && (
              <EmptyHint text="Nenhuma experiência cadastrada." />
            )}
          </div>
        </div>
      )}

      {/* --- FRONTEND: PROJETOS --- */}
      {section === "proj" && (
        <div className="editor-section">
          <ListToolbar
            count={data?.[lang]?.proj?.items?.length}
            noun="projeto"
            addLabel="Novo projeto"
            onAdd={() => addItem("proj")}
          />
          <div className="accordion-list">
            {data?.[lang]?.proj?.items?.map((item, idx) => (
              <AccordionItem
                key={idx}
                title={item.name}
                placeholderTitle="Novo projeto"
                subtitle={item.category || "Sem categoria"}
                tags={item.tags}
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
                        d[lang].proj.items[idx].name = e.target.value;
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
                        d[lang].proj.items[idx].category = e.target.value;
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
                        d[lang].proj.items[idx].link = e.target.value;
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
                        d[lang].proj.items[idx].desc = e.target.value;
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
                        d[lang].proj.items[idx].architecture = e.target.value;
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
            {!data?.[lang]?.proj?.items?.length && (
              <EmptyHint text="Nenhum projeto cadastrado." />
            )}
          </div>
        </div>
      )}

      {/* --- FRONTEND: CERTIFICAÇÕES --- */}
      {section === "cert" && (
        <div className="editor-section">
          <ListToolbar
            count={data?.[lang]?.cert?.items?.length}
            noun="certificação"
            addLabel="Nova certificação"
            onAdd={() => addItem("cert")}
          />
          <div className="accordion-list">
            {data?.[lang]?.cert?.items?.map((item, idx) => (
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
                        d[lang].cert.items[idx].name = e.target.value;
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
                        d[lang].cert.items[idx].issuer = e.target.value;
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
                        d[lang].cert.items[idx].year = e.target.value;
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
                        d[lang].cert.items[idx].credential_url = e.target.value;
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
                        d[lang].cert.items[idx].description = e.target.value;
                        setData(d);
                      }}
                    />
                  </Field>
                </div>
              </AccordionItem>
            ))}
            {!data?.[lang]?.cert?.items?.length && (
              <EmptyHint text="Nenhuma certificação cadastrada." />
            )}
          </div>
        </div>
      )}

      {/* --- RAG: CONTEXTO DA IA --- */}
      {section === "rag" && (
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
    </div>
  );
}

function AccordionItem({
  title,
  placeholderTitle,
  subtitle,
  badge,
  tags,
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
          {tags?.length > 0 && (
            <span className="accordion-tags" aria-hidden="true">
              {tags.slice(0, MAX_ROW_TAGS).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="accordion-tag">
                  {tag}
                </span>
              ))}
              {tags.length > MAX_ROW_TAGS && (
                <span className="accordion-tag accordion-tag--more">
                  +{tags.length - MAX_ROW_TAGS}
                </span>
              )}
            </span>
          )}
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

function EditorHeader({ section, lang }) {
  const meta = SECTION_META[section];
  if (!meta) return null;
  return (
    <div className="editor-header">
      <div className="editor-header-text">
        <h2 className="editor-header-title">{meta.title}</h2>
        <p className="editor-header-desc">{meta.description}</p>
      </div>
      {section === "rag" ? (
        <code className="editor-header-file">backend/data/portfolio_data.json</code>
      ) : (
        <span className="editor-lang-chip" title={`Editando o conteúdo em ${LANG_NAMES[lang]}`}>
          {LANG_NAMES[lang]} ({lang.toUpperCase()})
        </span>
      )}
    </div>
  );
}

function ListToolbar({ count = 0, noun, addLabel, onAdd }) {
  const plural = noun.endsWith("ão") ? `${noun.slice(0, -2)}ões` : `${noun}s`;
  return (
    <div className="editor-list-toolbar">
      <span className="editor-list-count">
        {count} {count === 1 ? noun : plural}
      </span>
      <motion.button
        type="button"
        className="btn-secondary btn-sm btn-add"
        onClick={onAdd}
        whileTap={{ scale: 0.97 }}
      >
        <Plus size={14} aria-hidden="true" />
        <span>{addLabel}</span>
      </motion.button>
    </div>
  );
}

// frontend/src/components/JsonEditor.jsx
//
// Editor controlado: a seção, o idioma de edição e o documento vêm do
// AdminDashboard (useContentStore). Toda alteração produz um documento novo
// via setIn/updateIn (nenhuma mutação do estado no lugar).

import {
  Children,
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, Plus, Trash2, X } from "lucide-react";
import { EASE_OUT } from "../utils/motion";
import { insertAt, removeAt, setIn, updateIn } from "../utils/immutable";
import { CONTENT_FILE, RAG_FILE } from "../hooks/useContentStore";

const PROMPT_SOFT_LIMIT = 600;
const CONFIRM_WINDOW_MS = 4000;

const LANG_NAMES = { pt: "Português", en: "English" };

const SECTION_META = {
  hero: {
    title: "Apresentação",
    description: "Headline, texto de apoio e chamadas exibidos na primeira dobra do portfólio.",
  },
  skills: {
    title: "Entregas",
    description:
      "Título da seção, entregas por etapa do fluxo e sistemas listados no ledger \"O que entrego\".",
  },
  exp: {
    title: "Trajetória",
    description:
      "Funções exibidas no ledger, na ordem desta lista. Funções iniciadas antes de 2022 aparecem em \"Trajetória corporativa em ERPs\".",
  },
  proj: {
    title: "Projetos",
    description: "Casos publicados com resumo, arquitetura, categoria e stack.",
  },
  cert: {
    title: "Credenciais",
    description:
      "Com link de verificação, a credencial aparece como conferível. Sem link, entra em \"Especializações e formação técnica\".",
  },
  rag: {
    title: "Base factual da IA",
    description: "Contexto que o assistente do chat consulta para responder. Vale para os dois idiomas.",
  },
};

const NEW_ITEMS = {
  exp: () => ({ role: "", company: "", time: "", desc: "" }),
  proj: (lang) => ({
    name: "",
    desc: "",
    link: "",
    category: lang === "en" ? "Governance & Data" : "Governança & Dados",
    tags: [],
    architecture: "",
  }),
  cert: () => ({ name: "", issuer: "", year: "", credential_url: "", description: "" }),
  experiencias_profissionais: () => ({ empresa: "", resumo_tecnico: "" }),
  projetos_destaque: () => ({ nome: "", descricao: "", github: "" }),
};

const preview = (text, max = 76) => {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
};

const getIn = (source, path) => path.reduce((acc, key) => (acc == null ? acc : acc[key]), source);

export default function JsonEditor({ section, lang = "pt", data, setData, onBackup }) {
  // item aberto identificado por lista + índice (estável entre renders)
  const [expanded, setExpanded] = useState(null);

  if (!data) {
    return <p className="editor-empty-hint">Carregando estrutura de dados…</p>;
  }

  const activeFile = section === "rag" ? RAG_FILE : CONTENT_FILE;
  const L = (...path) => [lang, ...path];

  const valueAt = (path) => getIn(data, path) ?? "";
  const bind = (path) => ({
    value: valueAt(path),
    onChange: (e) => setData(setIn(data, path, e.target.value)),
  });

  const listKey = (path) => path.join(".");
  const isOpen = (path, idx) => expanded?.list === listKey(path) && expanded.index === idx;
  const toggle = (path, idx) =>
    setExpanded((prev) =>
      prev?.list === listKey(path) && prev.index === idx ? null : { list: listKey(path), index: idx }
    );

  const prependItem = (path, item) => {
    setData(updateIn(data, path, (list) => insertAt(list, 0, item)));
    setExpanded({ list: listKey(path), index: 0 });
  };

  const appendItem = (path, item) => {
    setData(updateIn(data, path, (list) => insertAt(list, (list || []).length, item)));
  };

  const removeItem = (path, idx) => {
    setData(updateIn(data, path, (list) => removeAt(list, idx)));
    setExpanded((prev) => {
      if (prev?.list !== listKey(path)) return prev;
      if (prev.index === idx) return null;
      return prev.index > idx ? { ...prev, index: prev.index - 1 } : prev;
    });
  };

  const list = (path) => getIn(data, path) || [];

  return (
    <div className="editor-panel">
      <EditorHeader section={section} lang={lang} file={activeFile} onBackup={onBackup} />

      {section === "hero" && (
        <div className="editor-section">
          <div className="editor-grid">
            <Field label="Headline (título principal)" full>
              <input className="form-input" {...bind(L("hero", "greeting"))} />
            </Field>
            <Field label="Texto de apoio" full hint="Quem você é e de onde vem a experiência, em uma ou duas frases.">
              <textarea className="form-input field-textarea" {...bind(L("hero", "subtitle"))} />
            </Field>
            <Field label="Botão de e-mail">
              <input className="form-input" {...bind(L("hero", "contactBtn"))} />
            </Field>
            <Field label="Link para a trajetória">
              <input className="form-input" {...bind(L("hero", "resumeBtn"))} />
            </Field>
          </div>
        </div>
      )}

      {section === "skills" && (
        <div className="editor-section">
          <div className="editor-grid">
            <Field label="Título da seção">
              <input className="form-input" {...bind(L("skills", "title"))} />
            </Field>
            <Field label="Subtítulo">
              <input className="form-input" {...bind(L("skills", "subtitle"))} />
            </Field>
          </div>

          <div className="editor-section-head">
            <h3 className="editor-section-title">Entregas por etapa</h3>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => appendItem(L("skills", "items"), "")}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Adicionar entrega</span>
            </button>
          </div>
          <p className="field-hint">
            Comece cada entrega com a etapa: <code>Integração:</code>, <code>Dados:</code> ou{" "}
            <code>Governança:</code> (no inglês, <code>Integration:</code>, <code>Data:</code>,{" "}
            <code>Governance:</code>). Sem etapa, a entrega vai para &ldquo;Outras frentes&rdquo;.
          </p>
          <div className="editor-row-list">
            {list(L("skills", "items")).map((item, idx) => (
              <div key={`item-${idx}`} className="editor-row">
                <input
                  className="form-input"
                  aria-label={`Entrega ${idx + 1}`}
                  value={item}
                  onChange={(e) => setData(setIn(data, L("skills", "items", idx), e.target.value))}
                />
                <TrashButton
                  label={`Remover entrega ${idx + 1}`}
                  onConfirm={() => removeItem(L("skills", "items"), idx)}
                />
              </div>
            ))}
            {!list(L("skills", "items")).length && <EmptyHint text="Nenhuma entrega cadastrada." />}
          </div>

          <div className="editor-section-head">
            <h3 className="editor-section-title">Sistemas e ferramentas</h3>
          </div>
          <p className="field-hint">
            Cada ferramenta conhecida entra na linha da etapa correspondente; as demais aparecem em
            &ldquo;Também no dia a dia&rdquo;.
          </p>
          <ChipInput
            tags={list(L("skills", "tags"))}
            onAdd={(value) => appendItem(L("skills", "tags"), value)}
            onRemove={(idx) => removeItem(L("skills", "tags"), idx)}
            onRename={(idx, value) => setData(setIn(data, L("skills", "tags", idx), value))}
          />
        </div>
      )}

      {section === "exp" && (
        <div className="editor-section">
          <ListToolbar
            count={list(L("exp", "items")).length}
            singular="função"
            plural="funções"
            addLabel="Nova função"
            onAdd={() => prependItem(L("exp", "items"), NEW_ITEMS.exp())}
          />
          <div className="accordion-list">
            {list(L("exp", "items")).map((item, idx) => {
              const path = L("exp", "items", idx);
              return (
                <AccordionItem
                  key={idx}
                  title={item.role}
                  placeholderTitle="Nova função"
                  subtitle={[item.company || "Empresa não informada", item.time].filter(Boolean).join(", ")}
                  isOpen={isOpen(L("exp", "items"), idx)}
                  onToggle={() => toggle(L("exp", "items"), idx)}
                  onDelete={() => removeItem(L("exp", "items"), idx)}
                  deleteLabel={`Remover ${item.role || "função"}`}
                >
                  <div className="editor-grid editor-grid--3">
                    <Field label="Cargo ou função">
                      <input className="form-input" {...bind([...path, "role"])} />
                    </Field>
                    <Field label="Empresa">
                      <input className="form-input" {...bind([...path, "company"])} />
                    </Field>
                    <Field label="Período" hint="Ex.: setembro/2025 - Atual ou 09/2023 - 02/2024.">
                      <input className="form-input" {...bind([...path, "time"])} />
                    </Field>
                    <Field label="Descrição das atividades" full>
                      <textarea className="form-input field-textarea" {...bind([...path, "desc"])} />
                    </Field>
                  </div>
                </AccordionItem>
              );
            })}
            {!list(L("exp", "items")).length && <EmptyHint text="Nenhuma função cadastrada." />}
          </div>
        </div>
      )}

      {section === "proj" && (
        <div className="editor-section">
          <ListToolbar
            count={list(L("proj", "items")).length}
            singular="projeto"
            plural="projetos"
            addLabel="Novo projeto"
            onAdd={() => prependItem(L("proj", "items"), NEW_ITEMS.proj(lang))}
          />
          <div className="accordion-list">
            {list(L("proj", "items")).map((item, idx) => {
              const path = L("proj", "items", idx);
              return (
                <AccordionItem
                  key={idx}
                  title={item.name}
                  placeholderTitle="Novo projeto"
                  subtitle={item.category || "Sem categoria"}
                  isOpen={isOpen(L("proj", "items"), idx)}
                  onToggle={() => toggle(L("proj", "items"), idx)}
                  onDelete={() => removeItem(L("proj", "items"), idx)}
                  deleteLabel={`Remover ${item.name || "projeto"}`}
                >
                  <div className="editor-grid editor-grid--3">
                    <Field label="Nome do projeto">
                      <input className="form-input" {...bind([...path, "name"])} />
                    </Field>
                    <Field label="Categoria">
                      <input className="form-input" {...bind([...path, "category"])} />
                    </Field>
                    <Field label="URL do repositório">
                      <input className="form-input" type="url" inputMode="url" {...bind([...path, "link"])} />
                    </Field>
                    <Field label="Resumo público" full>
                      <textarea className="form-input field-textarea" {...bind([...path, "desc"])} />
                    </Field>
                    <Field
                      label="Arquitetura e decisões técnicas"
                      full
                      hint="Exibida no corpo do projeto. Quebras de linha viram parágrafos."
                    >
                      <textarea className="form-input field-textarea" {...bind([...path, "architecture"])} />
                    </Field>
                    <Field label="Stack" full group>
                      <ChipInput
                        tags={item.tags || []}
                        onAdd={(value) => appendItem([...path, "tags"], value)}
                        onRemove={(tagIdx) => setData(updateIn(data, [...path, "tags"], (tags) => removeAt(tags, tagIdx)))}
                        onRename={(tagIdx, value) => setData(setIn(data, [...path, "tags", tagIdx], value))}
                      />
                    </Field>
                  </div>
                </AccordionItem>
              );
            })}
            {!list(L("proj", "items")).length && <EmptyHint text="Nenhum projeto cadastrado." />}
          </div>
        </div>
      )}

      {section === "cert" && (
        <div className="editor-section">
          <div className="editor-grid">
            <Field label="Título da seção">
              <input className="form-input" {...bind(L("cert", "title"))} />
            </Field>
            <Field label="Subtítulo">
              <input className="form-input" {...bind(L("cert", "subtitle"))} />
            </Field>
          </div>
          <ListToolbar
            count={list(L("cert", "items")).length}
            singular="credencial"
            plural="credenciais"
            addLabel="Nova credencial"
            onAdd={() => prependItem(L("cert", "items"), NEW_ITEMS.cert())}
          />
          <div className="accordion-list">
            {list(L("cert", "items")).map((item, idx) => {
              const path = L("cert", "items", idx);
              const verifiable = /^https?:\/\//i.test(item.credential_url || "");
              return (
                <AccordionItem
                  key={idx}
                  title={item.name}
                  placeholderTitle="Nova credencial"
                  subtitle={`${item.issuer || "Emissor não informado"}${item.year ? `, ${item.year}` : ""}`}
                  badge={verifiable ? "conferível" : "formação"}
                  isOpen={isOpen(L("cert", "items"), idx)}
                  onToggle={() => toggle(L("cert", "items"), idx)}
                  onDelete={() => removeItem(L("cert", "items"), idx)}
                  deleteLabel={`Remover ${item.name || "credencial"}`}
                >
                  <div className="editor-grid editor-grid--3">
                    <Field label="Nome">
                      <input className="form-input" {...bind([...path, "name"])} />
                    </Field>
                    <Field label="Emissor">
                      <input className="form-input" {...bind([...path, "issuer"])} />
                    </Field>
                    <Field label="Ano">
                      <input className="form-input" inputMode="numeric" {...bind([...path, "year"])} />
                    </Field>
                    <Field
                      label="Link de verificação"
                      full
                      hint="Use a página de verificação da credencial (PeopleCert, Credly etc.). Deixe vazio para formação sem comprovante externo."
                    >
                      <input className="form-input" type="url" inputMode="url" {...bind([...path, "credential_url"])} />
                    </Field>
                    <Field label="Escopo da competência" full>
                      <textarea className="form-input field-textarea" {...bind([...path, "description"])} />
                    </Field>
                  </div>
                </AccordionItem>
              );
            })}
            {!list(L("cert", "items")).length && <EmptyHint text="Nenhuma credencial cadastrada." />}
          </div>
        </div>
      )}

      {section === "rag" && (
        <div className="editor-section">
          <div className="editor-grid">
            <fieldset className="editor-fieldset">
              <legend className="editor-section-title">Dados pessoais</legend>
              <Field label="Nome" full>
                <input className="form-input" {...bind(["dados_pessoais", "nome"])} />
              </Field>
              <Field label="Localização" full>
                <input className="form-input" {...bind(["dados_pessoais", "localizacao"])} />
              </Field>
              <Field label="Perfil técnico" full>
                <textarea className="form-input field-textarea" {...bind(["dados_pessoais", "perfil"])} />
              </Field>
            </fieldset>

            <fieldset className="editor-fieldset">
              <legend className="editor-section-title">Contatos</legend>
              <Field label="E-mail" full>
                <input className="form-input" type="email" {...bind(["contatos", "email"])} />
              </Field>
              <Field label="LinkedIn" full>
                <input className="form-input" type="url" {...bind(["contatos", "linkedin"])} />
              </Field>
              <Field label="GitHub" full>
                <input className="form-input" type="url" {...bind(["contatos", "github"])} />
              </Field>
              <Field label="Site principal" full>
                <input className="form-input" type="url" {...bind(["contatos", "portfolio_web"])} />
              </Field>
            </fieldset>
          </div>

          <Field
            label="Diretrizes do assistente (system prompt)"
            full
            hint={`Escreva em terceira pessoa ("O Christian atua em…") e evite repetir as listas abaixo. ${
              String(data?.instrucoes_ia || "").length
            } de ${PROMPT_SOFT_LIMIT} caracteres recomendados.`}
          >
            <textarea className="form-input field-textarea field-textarea--tall" {...bind(["instrucoes_ia"])} />
          </Field>

          <div className="editor-grid">
            {[
              { key: "habilidades_tecnicas", title: "Habilidades técnicas", noun: "Habilidade" },
              { key: "governanca_e_processos", title: "Governança e processos", noun: "Item" },
            ].map(({ key, title, noun }) => (
              <div key={key} className="editor-section">
                <div className="editor-section-head">
                  <h3 className="editor-section-title">{title}</h3>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => appendItem([key], "")}>
                    <Plus size={16} aria-hidden="true" />
                    <span>Adicionar</span>
                  </button>
                </div>
                <div className="editor-row-list">
                  {list([key]).map((item, idx) => (
                    <div key={`${key}-${idx}`} className="editor-row">
                      <input
                        className="form-input"
                        aria-label={`${noun} ${idx + 1}`}
                        value={item}
                        onChange={(e) => setData(setIn(data, [key, idx], e.target.value))}
                      />
                      <TrashButton label={`Remover ${noun.toLowerCase()} ${idx + 1}`} onConfirm={() => removeItem([key], idx)} />
                    </div>
                  ))}
                  {!list([key]).length && <EmptyHint text="Nenhum item cadastrado." />}
                </div>
              </div>
            ))}
          </div>

          <div className="editor-section">
            <ListToolbar
              count={list(["experiencias_profissionais"]).length}
              singular="resumo de experiência"
              plural="resumos de experiência"
              addLabel="Novo resumo"
              onAdd={() => prependItem(["experiencias_profissionais"], NEW_ITEMS.experiencias_profissionais())}
            />
            <div className="accordion-list">
              {list(["experiencias_profissionais"]).map((item, idx) => {
                const path = ["experiencias_profissionais", idx];
                return (
                  <AccordionItem
                    key={idx}
                    title={item.empresa}
                    placeholderTitle="Nova experiência"
                    subtitle={preview(item.resumo_tecnico) || "Sem resumo técnico"}
                    isOpen={isOpen(["experiencias_profissionais"], idx)}
                    onToggle={() => toggle(["experiencias_profissionais"], idx)}
                    onDelete={() => removeItem(["experiencias_profissionais"], idx)}
                    deleteLabel={`Remover ${item.empresa || "resumo"}`}
                  >
                    <div className="editor-grid">
                      <Field label="Empresa" full>
                        <input className="form-input" {...bind([...path, "empresa"])} />
                      </Field>
                      <Field label="Resumo técnico" full>
                        <textarea className="form-input field-textarea" {...bind([...path, "resumo_tecnico"])} />
                      </Field>
                    </div>
                  </AccordionItem>
                );
              })}
              {!list(["experiencias_profissionais"]).length && <EmptyHint text="Nenhum resumo cadastrado." />}
            </div>
          </div>

          <div className="editor-section">
            <ListToolbar
              count={list(["projetos_destaque"]).length}
              singular="projeto"
              plural="projetos"
              addLabel="Novo projeto"
              onAdd={() => prependItem(["projetos_destaque"], NEW_ITEMS.projetos_destaque())}
            />
            <div className="accordion-list">
              {list(["projetos_destaque"]).map((item, idx) => {
                const path = ["projetos_destaque", idx];
                return (
                  <AccordionItem
                    key={idx}
                    title={item.nome}
                    placeholderTitle="Novo projeto"
                    subtitle={preview(item.descricao) || "Sem descrição"}
                    isOpen={isOpen(["projetos_destaque"], idx)}
                    onToggle={() => toggle(["projetos_destaque"], idx)}
                    onDelete={() => removeItem(["projetos_destaque"], idx)}
                    deleteLabel={`Remover ${item.nome || "projeto"}`}
                  >
                    <div className="editor-grid">
                      <Field label="Nome">
                        <input className="form-input" {...bind([...path, "nome"])} />
                      </Field>
                      <Field label="URL do GitHub">
                        <input className="form-input" type="url" {...bind([...path, "github"])} />
                      </Field>
                      <Field label="Descrição técnica" full>
                        <textarea className="form-input field-textarea" {...bind([...path, "descricao"])} />
                      </Field>
                    </div>
                  </AccordionItem>
                );
              })}
              {!list(["projetos_destaque"]).length && <EmptyHint text="Nenhum projeto cadastrado." />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionItem({ title, placeholderTitle, subtitle, badge, isOpen, onToggle, onDelete, deleteLabel, children }) {
  const bodyId = useId();
  return (
    <div className={`accordion-item ${isOpen ? "is-open" : ""}`}>
      <div className="accordion-row">
        <button
          type="button"
          className="accordion-toggle"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={bodyId}
        >
          <span className="accordion-heading">
            <span className={`accordion-title ${!title ? "is-placeholder" : ""}`}>{title || placeholderTitle}</span>
            {subtitle && <span className="accordion-subtitle">{subtitle}</span>}
          </span>
          {badge && <span className="accordion-badge">{badge}</span>}
          <ChevronDown size={18} className="accordion-chevron" aria-hidden="true" />
        </button>
        <TrashButton onConfirm={onDelete} label={deleteLabel} />
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={bodyId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
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
  const addId = useId();

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };

  return (
    <div className="chip-list">
      {tags.map((tag, idx) => (
        <span key={`tag-${idx}`} className="chip">
          <input
            className="chip-input"
            value={tag}
            aria-label={`Editar ${tag || `item ${idx + 1}`}`}
            onChange={(e) => onRename(idx, e.target.value)}
            style={{ width: `${Math.max(tag.length, 3) + 1}ch` }}
          />
          <button
            type="button"
            className="chip-remove"
            onClick={() => onRemove(idx)}
            aria-label={`Remover ${tag || `item ${idx + 1}`}`}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </span>
      ))}
      <label htmlFor={addId} className="visually-hidden">
        Adicionar item (Enter confirma)
      </label>
      <input
        id={addId}
        className="chip-add"
        placeholder="Adicionar e Enter"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}

function Field({ label, full = false, hint, group = false, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const className = `field-group ${full ? "field-group--full" : ""}`;

  if (group) {
    return (
      <div className={className} role="group" aria-labelledby={`${id}-label`}>
        <span id={`${id}-label`} className="field-label">
          {label}
        </span>
        {children}
        {hint && (
          <p id={hintId} className="field-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }

  const control = Children.only(children);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {cloneElement(control, { id, "aria-describedby": hintId })}
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

// Remoção em dois passos: o primeiro clique arma, o segundo confirma
function TrashButton({ onConfirm, label }) {
  const [armed, setArmed] = useState(false);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!armed) return undefined;
    confirmRef.current?.focus();
    const id = window.setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
    return () => window.clearTimeout(id);
  }, [armed]);

  if (armed) {
    return (
      <button
        ref={confirmRef}
        type="button"
        className="btn-confirm-delete"
        onClick={(e) => {
          e.stopPropagation();
          setArmed(false);
          onConfirm();
        }}
        onBlur={() => setArmed(false)}
        aria-label={`Confirmar: ${label}`}
      >
        Confirmar remoção
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-icon btn-icon--danger"
      onClick={(e) => {
        e.stopPropagation();
        setArmed(true);
      }}
      aria-label={label}
      title={label}
    >
      <Trash2 size={16} aria-hidden="true" />
    </button>
  );
}

function EmptyHint({ text }) {
  return <p className="editor-empty-hint">{text}</p>;
}

function EditorHeader({ section, lang, file, onBackup }) {
  const meta = SECTION_META[section];
  if (!meta) return null;
  return (
    <div className="editor-header">
      <div className="editor-header-text">
        <h2 className="editor-header-title">{meta.title}</h2>
        <p className="editor-header-desc">{meta.description}</p>
        <p className="editor-header-file">
          <code>backend/data/{file}</code>
          {section !== "rag" && <span>, conteúdo em {LANG_NAMES[lang]}</span>}
        </p>
      </div>
      {onBackup && (
        <button type="button" className="btn-secondary btn-sm" onClick={onBackup}>
          <Download size={16} aria-hidden="true" />
          <span>Baixar cópia (JSON)</span>
        </button>
      )}
    </div>
  );
}

function ListToolbar({ count = 0, singular, plural, addLabel, onAdd }) {
  return (
    <div className="editor-list-toolbar">
      <p className="editor-list-count">
        <span className="tnum">{count}</span> {count === 1 ? singular : plural}
      </p>
      <button type="button" className="btn-secondary btn-sm" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}

// frontend/src/content/engineering.js
//
// Fonte única das três etapas do fluxo de engenharia. O esquema do Hero e o
// ledger "O que entrego" leem daqui, então o número, o nome e a âncora de cada
// etapa são sempre os mesmos nas duas seções.
//
// O texto editável continua no portfolio.json (skills.items e skills.tags):
// cada item de skills.items começa com o nome da etapa ("Integração: ...")
// e cada tag é encaixada na etapa cujo conjunto abaixo a reconhece.

export const STAGES = [
  {
    id: "integration",
    number: 1,
    anchor: "entrega-integracao",
    prefixes: ["integração", "integracao", "integration"],
    tags: ["python", "fastapi", "node.js", "n8n", "rest", "apis rest", "typebot"],
    systems: { pt: ["SAP", "TOTVS", "CRMs"], en: ["SAP", "TOTVS", "CRMs"] },
    evidence: { projects: ["ChatContabil Architecture"], companies: ["Grupo Controller"] },
  },
  {
    id: "data",
    number: 2,
    anchor: "entrega-dados",
    prefixes: ["dados", "data"],
    tags: ["postgresql", "mysql", "sql", "sql / ctes", "metabase", "power bi", "rag", "rag / llms", "llms", "etl"],
    systems: { pt: [], en: [] },
    evidence: { projects: ["ITSM Health Dashboard"], companies: [] },
  },
  {
    id: "governance",
    number: 3,
    anchor: "entrega-governanca",
    prefixes: ["governança", "governanca", "governance"],
    tags: ["docker", "nginx", "linux", "cloudflare", "itil 4", "itil", "iso 27001", "lgpd", "git"],
    systems: { pt: [], en: [] },
    evidence: { projects: ["Enterprise Governance Platform"], companies: [] },
  },
];

export const STAGE_COPY = {
  pt: {
    integration: { label: "Integração", detail: "APIs FastAPI, n8n" },
    data: { label: "Dados", detail: "PostgreSQL, Metabase" },
    governance: { label: "Governança", detail: "Trilha de auditoria, LGPD" },
  },
  en: {
    integration: { label: "Integration", detail: "FastAPI, n8n" },
    data: { label: "Data", detail: "PostgreSQL, Metabase" },
    governance: { label: "Governance", detail: "Audit trail, LGPD" },
  },
};

export const SCHEMATIC_COPY = {
  pt: {
    caption: "Fluxo de um registro, do ERP à conferência",
    source: { label: "ERP e CRM", detail: "NF-e, pedidos, títulos" },
    decision: { label: "Conciliado?" },
    yes: "sim",
    no: "não: volta para correção",
    noShort: "não",
    noNote: "Registro não conciliado volta para correção na integração",
    stamp: "Conferido",
    stageAction: (label) => `Ver entregas da etapa ${label}`,
  },
  en: {
    caption: "How a record moves from the ERP to sign-off",
    source: { label: "ERP and CRM", detail: "Invoices, orders, payables" },
    decision: { label: "Reconciled?" },
    yes: "yes",
    no: "no: back for correction",
    noShort: "no",
    noNote: "An unreconciled record goes back to integration for correction",
    stamp: "Checked",
    stageAction: (label) => `See what I deliver in the ${label} stage`,
  },
};

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/®/g, "")
    .replace(/\s+/g, " ")
    .trim();

// "Integração: APIs assíncronas..." -> { stageId: "integration", text: "APIs assíncronas..." }
export function splitStageItem(item) {
  const raw = String(item || "").replace(/^⚡\s*/, "").trim();
  const match = raw.match(/^([^:]{2,24}):\s*(.+)$/s);
  if (match) {
    const key = normalize(match[1]);
    const stage = STAGES.find((s) => s.prefixes.includes(key));
    if (stage) return { stageId: stage.id, text: match[2].trim() };
  }
  return { stageId: null, text: raw };
}

export function stageForTag(tag) {
  const key = normalize(tag);
  const stage = STAGES.find((s) => s.tags.includes(key));
  return stage ? stage.id : null;
}

export const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const projectAnchor = (name) => `projeto-${slugify(name)}`;

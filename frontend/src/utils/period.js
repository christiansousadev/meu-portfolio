// frontend/src/utils/period.js
//
// O campo `time` das experiências é texto livre editado no /admin
// ("setembro/2025 - Atual", "Sep 2025 - Present", "09/2025 – atual", "2025-09 a 2026-01").
// Aqui ele vira um período estruturado para o ledger: início, fim e duração.

const MONTHS = {
  jan: 1, janeiro: 1, january: 1,
  fev: 2, fevereiro: 2, feb: 2, february: 2,
  mar: 3, marco: 3, março: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  mai: 5, maio: 5, may: 5,
  jun: 6, junho: 6, june: 6,
  jul: 7, julho: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  set: 9, setembro: 9, sep: 9, sept: 9, september: 9,
  out: 10, outubro: 10, oct: 10, october: 10,
  nov: 11, novembro: 11, november: 11,
  dez: 12, dezembro: 12, dec: 12, december: 12,
};

const PRESENT = /^(atual|atualmente|presente|hoje|o momento|present|current|now|today)$/i;

const MONTH_LABEL = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const PRESENT_LABEL = { pt: "atual", en: "present" };

function parsePoint(raw) {
  const text = raw.trim().toLowerCase().replace(/\.$/, "");
  if (!text) return null;
  if (PRESENT.test(text)) return "present";

  // 2025-09
  let m = text.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return { y: Number(m[1]), m: Number(m[2]) };

  // 09/2025
  m = text.match(/^(\d{1,2})\s*[/.]\s*(\d{4})$/);
  if (m) return { y: Number(m[2]), m: Number(m[1]) };

  // setembro/2025, set 2025, September 2025, sep. 2025
  m = text.match(/^([a-zçã]+)\.?\s*(?:\/|de|\s)\s*(\d{4})$/);
  if (m && MONTHS[m[1]]) return { y: Number(m[2]), m: MONTHS[m[1]] };

  // 2025
  m = text.match(/^(\d{4})$/);
  if (m) return { y: Number(m[1]), m: 1 };

  return null;
}

export function parsePeriod(time) {
  if (!time || typeof time !== "string") return null;
  const parts = time.split(/\s+(?:-|–|—|a|até|to)\s+|\s*[–—]\s*/i).filter(Boolean);
  if (parts.length === 0) return null;
  const start = parsePoint(parts[0]);
  const end = parts[1] ? parsePoint(parts[1]) : null;
  if (!start || start === "present") return null;
  return { start, end: end || "present" };
}

const toIndex = (point, now) =>
  point === "present" ? now.getFullYear() * 12 + now.getMonth() : point.y * 12 + (point.m - 1);

export function periodMonths(period, now = new Date()) {
  if (!period) return 0;
  // meses inclusivos: jan a jan conta 1 mês
  return Math.max(1, toIndex(period.end, now) - toIndex(period.start, now) + 1);
}

export function formatPoint(point, lang = "pt") {
  if (point === "present") return PRESENT_LABEL[lang] || PRESENT_LABEL.pt;
  const labels = MONTH_LABEL[lang] || MONTH_LABEL.pt;
  return `${labels[point.m - 1]} ${point.y}`;
}

export function formatDuration(months, lang = "pt") {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (lang === "en") {
    const y = years ? `${years} yr${years > 1 ? "s" : ""}` : "";
    const mo = rest ? `${rest} mo${rest > 1 ? "s" : ""}` : "";
    return [y, mo].filter(Boolean).join(" ");
  }
  const y = years ? `${years} ano${years > 1 ? "s" : ""}` : "";
  const mo = rest ? `${rest} ${rest > 1 ? "meses" : "mês"}` : "";
  return [y, mo].filter(Boolean).join(" e ");
}

export const startYear = (period) => (period ? period.start.y : null);

// frontend/src/utils/googleTranslate.js
//
// Integração enxuta com o Google Website Translator: o conteúdo em `pt` do
// portfolio.json é a única fonte de verdade renderizada pelo React; a versão
// em inglês é obtida traduzindo o DOM já renderizado, eliminando a
// necessidade de manter um segundo conjunto de experiências/projetos em `en`.

const PAGE_LANGUAGE = "pt";
const TARGET_LANGUAGE = "en";
const COOKIE_NAME = "googtrans";

let scriptInjected = false;

// injeta o script oficial do google e registra o callback global exigido
// por ele (googleTranslateElementInit) — chamar mais de uma vez é seguro,
// a segunda chamada é ignorada.
export function initGoogleTranslate() {
  if (scriptInjected || typeof window === "undefined") return;
  scriptInjected = true;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) return;
    new window.google.translate.TranslateElement(
      {
        pageLanguage: PAGE_LANGUAGE,
        includedLanguages: TARGET_LANGUAGE,
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  const script = document.createElement("script");
  script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

// grava (ou limpa) o cookie que o widget le para decidir o idioma de destino;
// escreve tanto sem dominio quanto com dominio explicito para cobrir os dois
// formatos que o proprio script do google costuma usar
function writeCookiePair(value) {
  const domain = window.location.hostname;
  const base = value ? `${COOKIE_NAME}=${value}; path=/` : `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  document.cookie = base;
  if (domain) document.cookie = `${base}; domain=${domain}`;
}

// alterna o idioma exibido. "en" tenta a troca instantanea (sem reload) via
// combo interno do widget quando ja disponivel; "pt" sempre restaura via
// cookie + reload, que e a forma confiavel de reverter ao texto original.
export function setGoogleTranslateLanguage(targetLang) {
  if (targetLang === PAGE_LANGUAGE) {
    writeCookiePair(`/${PAGE_LANGUAGE}/${PAGE_LANGUAGE}`);
    window.location.reload();
    return;
  }

  const combo = document.querySelector(".goog-te-combo");
  if (combo) {
    combo.value = targetLang;
    combo.dispatchEvent(new Event("change"));
    writeCookiePair(`/${PAGE_LANGUAGE}/${targetLang}`);
    return;
  }

  // widget ainda nao carregou: define o cookie e recarrega uma unica vez
  // para que o google aplique a traducao automaticamente no proximo load
  writeCookiePair(`/${PAGE_LANGUAGE}/${targetLang}`);
  window.location.reload();
}

// le o cookie existente para inicializar o estado de idioma da ui de forma
// consistente quando o visitante volta com uma preferencia ja salva
export function readGoogleTranslateLanguage() {
  const match = document.cookie.match(/googtrans=\/pt\/([a-zA-Z-]+)/);
  return match ? match[1] : PAGE_LANGUAGE;
}

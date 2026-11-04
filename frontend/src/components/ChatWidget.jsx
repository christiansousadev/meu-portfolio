// frontend/src/components/ChatWidget.jsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Trash2, Copy, Check } from "lucide-react";
import useDialog from "../hooks/useDialog";

const CHAT_COPY = {
  pt: {
    suggestions: [
      "Quais tecnologias o Christian usa no dia a dia?",
      "Como o Christian aplica ITIL 4 e LGPD?",
      "Quais projetos ele publicou?",
      "Como falar com o Christian?",
    ],
    intro:
      "As respostas são geradas a partir dos dados publicados neste portfólio: trajetória, projetos, stack e contatos.",
    error: "A pergunta não foi respondida porque o serviço não respondeu a tempo.",
    retry: "Tentar de novo",
    copied: "Copiado",
    copy: "Copiar",
    open: "Abrir assistente do portfólio",
    fab: "Perguntar",
    close: "Fechar assistente",
    clear: "Limpar conversa",
    inputLabel: "Sua pergunta",
    send: "Enviar pergunta",
  },
  en: {
    suggestions: [
      "Which technologies does Christian use day to day?",
      "How does Christian apply ITIL 4 and LGPD?",
      "Which projects has he published?",
      "How can I reach Christian?",
    ],
    intro:
      "Answers are generated from the data published on this portfolio: track record, projects, stack and contacts.",
    error: "The question went unanswered because the service did not respond in time.",
    retry: "Try again",
    copied: "Copied",
    copy: "Copy",
    open: "Open the portfolio assistant",
    fab: "Ask",
    close: "Close assistant",
    clear: "Clear conversation",
    inputLabel: "Your question",
    send: "Send question",
  },
};

export default function ChatWidget({ data, lang = "pt" }) {
  const copy = CHAT_COPY[lang] || CHAT_COPY.pt;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failedPrompt, setFailedPrompt] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useDialog({
    open: isChatOpen,
    containerRef: panelRef,
    initialFocusRef: inputRef,
    onClose: () => setIsChatOpen(false),
  });

  useEffect(() => {
    if (!isChatOpen) return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, isChatOpen]);

  const handleSend = async (overrideMessage = null) => {
    const messageToSend = typeof overrideMessage === "string" ? overrideMessage : input;
    const trimmed = messageToSend.trim();
    if (!trimmed || loading) return;

    setFailedPrompt(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    if (typeof overrideMessage !== "string") setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!response.ok) throw new Error(`http error: ${response.status}`);
      const resData = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: resData.reply }]);
    } catch (error) {
      console.error("[ChatWidget] falha ao consultar o assistente:", error.message);
      setFailedPrompt(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    if (!failedPrompt) return;
    const prompt = failedPrompt;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.role === "user" && last.content === prompt ? prev.slice(0, -1) : prev;
    });
    handleSend(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(key);
      window.setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.warn("clipboard indisponível", error);
    }
  };

  const formatInline = (str) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return str.split(urlRegex).map((seg, sIdx) => {
      if (/^https?:\/\//.test(seg)) {
        return (
          <a key={sIdx} href={seg} target="_blank" rel="noopener noreferrer">
            {seg}
          </a>
        );
      }
      return seg.split(/\*\*(.*?)\*\*/g).map((part, bIdx) =>
        bIdx % 2 === 1 ? <strong key={`${sIdx}-${bIdx}`}>{part}</strong> : part
      );
    });
  };

  const renderMarkdown = (text, msgIdx) => {
    if (!text) return null;
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
      parts.push({ type: "code", content: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push({ type: "text", content: text.slice(lastIndex) });

    return parts.map((part, pIdx) => {
      if (part.type === "code") {
        const copyKey = `${msgIdx}-${pIdx}`;
        return (
          <div key={pIdx} className="chat-code-block">
            <button
              type="button"
              onClick={() => copyToClipboard(part.content, copyKey)}
              className="btn-text chat-code-copy"
            >
              {copiedIndex === copyKey ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copiedIndex === copyKey ? copy.copied : copy.copy}
            </button>
            <pre className="chat-code-pre">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      }

      const blocks = [];
      let list = null;
      part.content.split("\n").forEach((line, lIdx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          if (!list) {
            list = [];
            blocks.push({ type: "list", items: list, key: `l-${lIdx}` });
          }
          list.push(formatInline(trimmed.substring(2)));
          return;
        }
        list = null;
        if (trimmed) blocks.push({ type: "p", content: formatInline(trimmed), key: `p-${lIdx}` });
      });

      return (
        <div key={pIdx} className="chat-markdown">
          {blocks.map((block) =>
            block.type === "list" ? (
              <ul key={block.key}>
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p key={block.key}>{block.content}</p>
            )
          )}
        </div>
      );
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label={isChatOpen ? copy.close : copy.open}
        aria-expanded={isChatOpen}
        aria-controls="chat-panel"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="chat-fab"
      >
        {isChatOpen ? <X size={20} aria-hidden="true" /> : <MessageSquare size={20} aria-hidden="true" />}
        <span className="chat-fab-label" aria-hidden="true">
          {copy.fab}
        </span>
      </button>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            id="chat-panel"
            ref={panelRef}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="chat-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-title"
          >
            <div className="chat-head">
              <h2 id="chat-title" className="chat-title">
                {data.title}
              </h2>
              <div className="chat-head-actions">
                {messages.length > 0 && (
                  <button
                    type="button"
                    title={copy.clear}
                    aria-label={copy.clear}
                    onClick={() => {
                      setMessages([]);
                      setFailedPrompt(null);
                    }}
                    className="btn-icon"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={copy.close}
                  onClick={() => setIsChatOpen(false)}
                  className="btn-icon"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="chat-body" aria-live="polite" aria-busy={loading}>
              {messages.length === 0 && (
                <div className="chat-empty">
                  <p className="chat-empty-text">{copy.intro}</p>
                  <ul className="chat-suggestions">
                    {copy.suggestions.map((s) => (
                      <li key={s}>
                        <button type="button" className="chat-suggestion" onClick={() => handleSend(s)}>
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-row ${msg.role === "user" ? "is-user" : ""}`}>
                  <div className={`chat-bubble ${msg.role === "user" ? "is-user" : ""}`}>
                    {renderMarkdown(msg.content, idx)}
                  </div>
                </div>
              ))}

              {loading && <p className="chat-typing">{data.loading}</p>}

              {failedPrompt && !loading && (
                <div className="chat-error" role="alert">
                  <p>{copy.error}</p>
                  <button type="button" className="btn-secondary btn-sm" onClick={retry}>
                    {copy.retry}
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            <form
              className="chat-footer"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <label htmlFor="chat-input" className="visually-hidden">
                {copy.inputLabel}
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={data.placeholder}
                className="chat-input"
              />
              <button
                type="submit"
                aria-label={copy.send}
                disabled={loading || !input.trim()}
                className="btn-primary chat-send"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

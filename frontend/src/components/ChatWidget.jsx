// frontend/src/components/ChatWidget.jsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Trash2, Copy, Check } from "lucide-react";

const SUGGESTIONS = [
  "Quais são suas principais tecnologias?",
  "Fale sobre sua experiência com Governança e ITIL",
  "Quais projetos você desenvolveu?",
  "Como entrar em contato com o Christian?",
];

export default function ChatWidget({ data }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isChatOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, isChatOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isChatOpen) {
        setIsChatOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatOpen]);

  const handleSend = async (overrideMessage = null) => {
    const messageToSend = typeof overrideMessage === "string" ? overrideMessage : input;
    const trimmed = messageToSend.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideMessage) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!response.ok) {
        throw new Error(`http error: ${response.status}`);
      }

      const resData = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: resData.reply }]);
    } catch (error) {
      console.error("[ChatWidget] falha na integracao com llm:", error.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Não foi possível obter resposta agora. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatInline = (str) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const segments = str.split(urlRegex);

    return segments.map((seg, sIdx) => {
      if (seg.match(urlRegex)) {
        return (
          <a key={sIdx} href={seg} target="_blank" rel="noopener noreferrer">
            {seg}
          </a>
        );
      }

      const boldParts = seg.split(/\*\*(.*?)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        if (bIdx % 2 === 1) {
          return <strong key={bIdx}>{bPart}</strong>;
        }
        return bPart;
      });
    });
  };

  const renderMarkdown = (text, msgIdx) => {
    if (!text) return null;

    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: "code", content: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.slice(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === "code") {
        const copyKey = `${msgIdx}-${pIdx}`;
        return (
          <div key={pIdx} className="chat-code-block">
            <button
              type="button"
              onClick={() => copyToClipboard(part.content, copyKey)}
              className="chat-code-copy"
            >
              {copiedIndex === copyKey ? <Check size={12} /> : <Copy size={12} />}
              {copiedIndex === copyKey ? "Copiado" : "Copiar"}
            </button>
            <pre className="chat-code-pre">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      }

      const lines = part.content.split("\n");
      return (
        <div key={pIdx} className="chat-markdown">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="chat-line-break" />;

            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              const itemContent = trimmed.substring(2);
              return <li key={lIdx}>{formatInline(itemContent)}</li>;
            }

            return <p key={lIdx}>{formatInline(trimmed)}</p>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label={isChatOpen ? "Fechar assistente" : "Abrir assistente"}
        aria-expanded={isChatOpen}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="chat-fab"
      >
        {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="surface-card chat-panel"
            role="dialog"
            aria-label={data.title}
          >
            <div className="chat-panel-header">
              <div className="chat-panel-title">
                <span className="chat-status-indicator" aria-hidden="true" />
                <span>{data.title}</span>
              </div>

              <div className="chat-panel-actions">
                {messages.length > 0 && (
                  <button
                    type="button"
                    title="Limpar conversa"
                    aria-label="Limpar conversa"
                    onClick={() => setMessages([])}
                    className="btn-icon"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Fechar assistente"
                  onClick={() => setIsChatOpen(false)}
                  className="btn-icon"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="chat-body" aria-live="polite" aria-busy={loading}>
              {messages.length === 0 && (
                <div className="chat-empty">
                  <p className="chat-empty-text">
                    Consulte informações objetivas sobre trajetória, projetos, stack e contatos do Christian.
                  </p>
                  <div className="chat-suggestions">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="chat-suggestion-btn"
                        onClick={() => handleSend(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-row ${msg.role === "user" ? "is-user" : ""}`}>
                  <div className={`chat-bubble ${msg.role === "user" ? "is-user" : ""}`}>
                    {renderMarkdown(msg.content, idx)}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-typing">
                  <span className="chat-typing-text">
                    {data.loading || "Consultando base..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            <div className="chat-footer">
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={data.placeholder}
                className="chat-textarea"
              />
              <button
                type="button"
                aria-label={data.send || "Enviar mensagem"}
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="btn-primary chat-send-btn"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

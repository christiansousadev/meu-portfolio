// frontend/src/components/ChatWidget.jsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Trash2, Copy, Check, Sparkles } from "lucide-react";

export default function ChatWidget({ data }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const SUGGESTIONS = [
    "Quais suas principais tecnologias?",
    "Fale sobre sua experiência com Governança e ITIL",
    "Quais projetos de destaque você desenvolveu?",
    "Como posso entrar em contato com você?",
  ];

  useEffect(() => {
    if (!isChatOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, isChatOpen]);

  // Fechar no Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isChatOpen) {
        setIsChatOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatOpen]);

  const HANDLE_SEND = async (overrideMessage = null) => {
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
          content: "Erro de conexão com o assistente inteligente. Por favor, tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const HANDLE_KEYDOWN = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      HANDLE_SEND();
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parser de Markdown Simples e Seguro
  const renderMarkdown = (text, msgIdx) => {
    if (!text) return null;

    // Se houver bloco de código ```...```
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

      // Processa parágrafos, listas e formatação
      const lines = part.content.split("\n");
      return (
        <div key={pIdx} className="chat-markdown">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="chat-line-break" />;

            // Linha com lista (- ou *)
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

  const formatInline = (str) => {
    // Quebra por links e negritos
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

      // Negrito **bold**
      const boldParts = seg.split(/\*\*(.*?)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        if (bIdx % 2 === 1) {
          return <strong key={bIdx}>{bPart}</strong>;
        }
        return bPart;
      });
    });
  };

  return (
    <>
      {/* Botão Flutuante do Chat */}
      <motion.button
        type="button"
        aria-label={isChatOpen ? "Fechar assistente de chat" : "Abrir assistente virtual"}
        aria-expanded={isChatOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="chat-fab"
      >
        {isChatOpen ? <X size={26} /> : <MessageSquare size={26} />}
      </motion.button>

      {/* Janela Modal do Chat */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
            className="glass-card chat-panel"
            role="dialog"
            aria-label={data.title}
          >
            {/* Cabeçalho */}
            <div className="chat-panel-header">
              <div className="chat-panel-title">
                <Sparkles size={18} />
                <span>{data.title}</span>
              </div>

              <div className="chat-panel-actions">
                {messages.length > 0 && (
                  <button
                    type="button"
                    title="Limpar histórico"
                    aria-label="Limpar histórico"
                    onClick={() => setMessages([])}
                    className="btn-icon btn-icon--on-accent"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Fechar chat"
                  onClick={() => setIsChatOpen(false)}
                  className="btn-icon btn-icon--on-accent"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mensagens & Conteúdo */}
            <div className="chat-body" aria-live="polite" aria-busy={loading}>
              {messages.length === 0 && (
                <div className="chat-empty">
                  <p className="chat-empty-text">
                    Olá! Sou o assistente com RAG corporativo do Christian. Sobre o que gostaria de saber?
                  </p>
                  <div className="chat-chips-container">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="chat-chip"
                        onClick={() => HANDLE_SEND(s)}
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
                  <span className="status-dot" />
                  <span className="chat-typing-text">
                    {data.loading || "Consultando dados corporativos..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {/* Input e Envio */}
            <div className="chat-footer">
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={HANDLE_KEYDOWN}
                placeholder={data.placeholder}
                className="chat-textarea"
              />
              <button
                type="button"
                aria-label={data.send || "Enviar mensagem"}
                onClick={() => HANDLE_SEND()}
                disabled={loading || !input.trim()}
                className="btn-primary chat-send-btn"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

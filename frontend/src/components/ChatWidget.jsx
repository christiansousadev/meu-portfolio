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
        return (
          <div
            key={pIdx}
            style={{
              position: "relative",
              margin: "10px 0",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "var(--code-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <button
              type="button"
              onClick={() => copyToClipboard(part.content, `${msgIdx}-${pIdx}`)}
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                background: "rgba(0,0,0,0.3)",
                border: "none",
                borderRadius: "4px",
                color: "var(--text-secondary)",
                padding: "3px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.75rem",
              }}
            >
              {copiedIndex === `${msgIdx}-${pIdx}` ? <Check size={12} /> : <Copy size={12} />}
              {copiedIndex === `${msgIdx}-${pIdx}` ? "Copiado" : "Copiar"}
            </button>
            <pre style={{ margin: 0, padding: "12px", overflowX: "auto" }}>
              <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem" }}>
                {part.content}
              </code>
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
            if (!trimmed) return <div key={lIdx} style={{ height: "6px" }} />;

            // Linha com lista (- ou *)
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              const itemContent = trimmed.substring(2);
              return (
                <li key={lIdx} style={{ marginLeft: "14px", marginBottom: "4px" }}>
                  {formatInline(itemContent)}
                </li>
              );
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
          <a
            key={sIdx}
            href={seg}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--accent-color)",
              textDecoration: "underline",
              fontWeight: "600",
            }}
          >
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
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "var(--accent-gradient)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 30px var(--shadow-hover)",
          zIndex: 1000,
        }}
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
            className="glass-card"
            role="dialog"
            aria-label={data.title}
            style={{
              position: "fixed",
              width: "calc(100% - 36px)",
              maxWidth: "400px",
              height: "72vh",
              maxHeight: "560px",
              right: "20px",
              bottom: "100px",
              display: "flex",
              flexDirection: "column",
              zIndex: 1000,
              overflow: "hidden",
              boxShadow: "0 20px 60px var(--shadow-color)",
            }}
          >
            {/* Cabeçalho */}
            <div
              style={{
                padding: "16px 20px",
                background: "var(--accent-gradient)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} />
                <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>{data.title}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {messages.length > 0 && (
                  <button
                    type="button"
                    title="Limpar histórico"
                    aria-label="Limpar histórico"
                    onClick={() => setMessages([])}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.8)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Fechar chat"
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mensagens & Conteúdo */}
            <div
              aria-live="polite"
              aria-busy={loading}
              style={{
                flex: 1,
                padding: "18px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {messages.length === 0 && (
                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "16px" }}>
                    Olá! Sou o assistente com RAG corporativo do Christian. Sobre o que gostaria de saber?
                  </p>
                  <div className="chat-chips-container" style={{ padding: 0 }}>
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
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.role === "user"
                          ? "var(--accent-gradient)"
                          : "var(--card-bg)",
                      color: msg.role === "user" ? "#fff" : "var(--text-color)",
                      padding: "12px 16px",
                      borderRadius:
                        msg.role === "user"
                          ? "16px 16px 2px 16px"
                          : "16px 16px 16px 2px",
                      maxWidth: "88%",
                      fontSize: "0.92rem",
                      lineHeight: "1.45",
                      border: msg.role === "ai" ? "1px solid var(--card-border)" : "none",
                      boxShadow: "0 2px 8px var(--shadow-color)",
                    }}
                  >
                    {renderMarkdown(msg.content, idx)}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px" }}>
                  <span className="status-dot" style={{ width: "6px", height: "6px" }} />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                    {data.loading || "Consultando dados corporativos..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {/* Input e Envio */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--card-border)",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={HANDLE_KEYDOWN}
                placeholder={data.placeholder}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--bg-color)",
                  color: "var(--text-color)",
                  outline: "none",
                  resize: "none",
                  minHeight: "40px",
                  maxHeight: "80px",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  lineHeight: 1.4,
                }}
              />
              <button
                type="button"
                aria-label={data.send || "Enviar mensagem"}
                onClick={() => HANDLE_SEND()}
                disabled={loading || !input.trim()}
                className="btn-primary"
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  opacity: loading || !input.trim() ? 0.5 : 1,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                }}
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

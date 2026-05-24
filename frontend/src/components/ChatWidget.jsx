// frontend/src/components/ChatWidget.jsx

import { useEffect, useRef, useState } from "react";

// GERENCIA A LOGICA E A UI DO CHAT FLUTUANTE
export default function ChatWidget({ data, theme }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // ancora invisivel ao final da lista para autoscroll suave
  const messagesEndRef = useRef(null);

  // sempre que chega mensagem nova (ou alterna o estado de carregamento)
  // empurra a conversa para o fim da viewport interna do chat
  useEffect(() => {
    if (!isChatOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, isChatOpen]);

  // ENVIO DE MENSAGEM
  const HANDLE_SEND = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // fallback de env facilita a transicao entre ambientes locais e prod
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content })
      });

      if (!response.ok) {
        throw new Error(`http error: ${response.status}`);
      }

      const resData = await response.json();
      setMessages(prev => [...prev, { role: "ai", content: resData.reply }]);
    } catch (error) {
      // log estruturado no console do cliente para auditoria local
      console.error("[ChatWidget] falha na integracao com llm:", error.message);

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content:
            "erro de conexão com o servidor de ia. tente novamente mais tarde."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // INTERCEPTACAO DE TECLADO
  // enter envia; shift+enter deixa o textarea inserir quebra de linha
  const HANDLE_KEYDOWN = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      HANDLE_SEND();
    }
  };

  // CONVERSAO DE URLS EM LINKS CLICAVEIS
  const RENDER_CONTENT = text => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "underline",
              fontWeight: "bold"
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label={isChatOpen ? "Fechar chat" : "Abrir chat"}
        aria-expanded={isChatOpen}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "65px",
          height: "65px",
          borderRadius: "50%",
          background: "var(--accent-color)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "28px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          zIndex: 1000,
          transition: "all 0.2s ease",
          transform: isPressed ? "scale(0.9)" : "scale(1)"
        }}
      >
        <span aria-hidden="true">💬</span>
      </button>

      {isChatOpen && (
        <div
          className="glass-card"
          role="dialog"
          aria-label={data.title}
          style={{
            position: "fixed",
            width: "calc(100% - 40px)",
            maxWidth: "360px",
            height: "70vh",
            maxHeight: "500px",
            right: "20px",
            bottom: "90px",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
            animation: "popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
          }}
        >
          <div
            style={{
              padding: "20px",
              background: "var(--accent-color)",
              color: "#fff",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{data.title}</span>
            <button
              type="button"
              aria-label="Fechar chat"
              onClick={() => setIsChatOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "4px 8px",
                lineHeight: 1
              }}
            >
              <span aria-hidden="true">✖</span>
            </button>
          </div>

          <div
            aria-live="polite"
            aria-busy={loading}
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              backgroundColor: "transparent"
            }}
          >
            {messages.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  marginTop: "50%"
                }}
              >
                {data.placeholder}
              </p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{ textAlign: msg.role === "user" ? "right" : "left" }}
              >
                <span
                  style={{
                    background:
                      msg.role === "user"
                        ? "var(--accent-color)"
                        : "var(--nav-bg)",
                    color: msg.role === "user" ? "#fff" : "var(--text-color)",
                    padding: "12px 16px",
                    borderRadius:
                      msg.role === "user"
                        ? "15px 15px 0 15px"
                        : "15px 15px 15px 0",
                    display: "inline-block",
                    maxWidth: "85%",
                    fontSize: "0.95rem",
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    border: msg.role === "ai" ? "1px solid var(--card-border)" : "none"
                  }}
                >
                  {RENDER_CONTENT(msg.content)}
                </span>
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  width: "60%",
                  gap: "8px",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div
                  className="skeleton"
                  style={{
                    width: "100%",
                    height: "15px",
                    borderRadius: "4px"
                  }}
                ></div>
                <div
                  className="skeleton"
                  style={{
                    width: "70%",
                    height: "15px",
                    borderRadius: "4px"
                  }}
                ></div>
              </div>
            )}
            {/* sentinela usada por scrollIntoView para acompanhar a conversa */}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          <div
            style={{
              padding: "15px",
              borderTop: "1px solid var(--card-border)",
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
              backgroundColor: "transparent"
            }}
          >
            <label htmlFor="chat-input" className="sr-only" style={srOnly}>
              {data.placeholder}
            </label>
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={HANDLE_KEYDOWN}
              placeholder={data.placeholder}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "var(--bg-color)",
                color: "var(--text-color)",
                outline: "none",
                resize: "vertical",
                minHeight: "44px",
                maxHeight: "120px",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                lineHeight: 1.4
              }}
            />
            <button
              type="button"
              aria-label={data.send || "Enviar mensagem"}
              onClick={HANDLE_SEND}
              disabled={loading}
              style={{
                padding: "0 20px",
                cursor: loading ? "not-allowed" : "pointer",
                background: "var(--accent-color)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "1.2rem",
                opacity: loading ? 0.6 : 1,
                minHeight: "44px"
              }}
            >
              <span aria-hidden="true">➤</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// helper visualmente oculto que preserva o label para leitores de tela
const srOnly = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
};

// frontend/src/components/ContactModal.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Check, Copy, ArrowUpRight, MapPin } from "lucide-react";

const CONTACTS = {
  email: "christiansousadev@gmail.com",
  whatsappUrl: "https://wa.me/?text=Ol%C3%A1%20Christian,%20vi%20seu%20portf%C3%B3lio%20e%20gostaria%20de%20conversar!",
  telegramUrl: "https://t.me/christiansousadev",
  linkedinUrl: "https://www.linkedin.com/in/christiansousasilva/",
  githubUrl: "https://github.com/christiansousadev",
};

const COPY = {
  pt: {
    title: "Vamos conversar?",
    subtitle: "Escolha o canal de sua preferência para conversarmos sobre projetos, arquitetura de sistemas ou liderança técnica.",
    status: "Disponível para novos projetos",
    location: "Fortaleza, CE · Remoto / Híbrido",
    closeLabel: "Fechar janela de contato",
    copySuccess: "Copiado!",
    channels: {
      whatsapp: {
        title: "WhatsApp",
        detail: "Conversa direta e alinhamentos rápidos",
        action: "Iniciar conversa",
      },
      telegram: {
        title: "Telegram",
        detail: "@christiansousadev",
        action: "Enviar mensagem",
      },
      email: {
        title: "E-mail",
        detail: CONTACTS.email,
        action: "Copiar",
        actionLabel: "Copiar e-mail",
        openLabel: "Abrir no cliente de e-mail",
      },
      linkedin: {
        title: "LinkedIn",
        detail: "in/christiansousasilva",
        action: "Ver perfil profissional",
      },
      github: {
        title: "GitHub",
        detail: "@christiansousadev",
        action: "Acessar repositórios",
      },
    },
  },
  en: {
    title: "Let's connect",
    subtitle: "Choose your preferred channel to discuss projects, systems architecture, or technical leadership.",
    status: "Available for new projects",
    location: "Fortaleza, CE · Remote / Hybrid",
    closeLabel: "Close contact modal",
    copySuccess: "Copied!",
    channels: {
      whatsapp: {
        title: "WhatsApp",
        detail: "Direct chat & quick alignment",
        action: "Start chat",
      },
      telegram: {
        title: "Telegram",
        detail: "@christiansousadev",
        action: "Send message",
      },
      email: {
        title: "Email",
        detail: CONTACTS.email,
        action: "Copy",
        actionLabel: "Copy email address",
        openLabel: "Open in your email app",
      },
      linkedin: {
        title: "LinkedIn",
        detail: "in/christiansousasilva",
        action: "View profile",
      },
      github: {
        title: "GitHub",
        detail: "@christiansousadev",
        action: "View repositories",
      },
    },
  },
};

function WhatsAppIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29" />
    </svg>
  );
}

function TelegramIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38" />
    </svg>
  );
}

function LinkedinIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function GithubIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function ContactModal({ isOpen, onClose, lang = "pt" }) {
  const [copied, setCopied] = useState(false);
  const copy = COPY[lang] || COPY.pt;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACTS.email);
    } catch {
      // Clipboard API indisponível (contexto não seguro/permissão negada): seleção manual
      try {
        const field = document.createElement("textarea");
        field.value = CONTACTS.email;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(field);
        if (!ok) return;
      } catch (err) {
        console.warn("falha ao copiar e-mail", err);
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  // Portal no body: o Hero usa `isolation: isolate`, o que prenderia o modal abaixo da navbar
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="contact-modal-portal">
          <motion.div
            className="contact-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="contact-modal-wrapper" onClick={onClose}>
            <motion.div
              className="contact-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="contact-modal-header">
                <div className="contact-modal-identity">
                  <div className="contact-modal-status-badge">
                    <span className="contact-modal-dot" aria-hidden="true" />
                    <span>{copy.status}</span>
                  </div>
                  <h2 id="contact-modal-title" className="contact-modal-title">
                    {copy.title}
                  </h2>
                  <p className="contact-modal-subtitle">{copy.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="contact-modal-close"
                  aria-label={copy.closeLabel}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Channels Grid */}
              <div className="contact-modal-grid">
                {/* WhatsApp */}
                <a
                  href={CONTACTS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-channel-item contact-channel--whatsapp"
                >
                  <div className="contact-channel-icon-wrap whatsapp">
                    <WhatsAppIcon size={20} />
                  </div>
                  <div className="contact-channel-content">
                    <div className="contact-channel-title-row">
                      <span className="contact-channel-name">{copy.channels.whatsapp.title}</span>
                      <ArrowUpRight size={14} className="contact-channel-arrow" aria-hidden="true" />
                    </div>
                    <span className="contact-channel-detail">{copy.channels.whatsapp.detail}</span>
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={CONTACTS.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-channel-item contact-channel--telegram"
                >
                  <div className="contact-channel-icon-wrap telegram">
                    <TelegramIcon size={20} />
                  </div>
                  <div className="contact-channel-content">
                    <div className="contact-channel-title-row">
                      <span className="contact-channel-name">{copy.channels.telegram.title}</span>
                      <ArrowUpRight size={14} className="contact-channel-arrow" aria-hidden="true" />
                    </div>
                    <span className="contact-channel-detail">{copy.channels.telegram.detail}</span>
                  </div>
                </a>

                {/* Email (with Copy action) */}
                <div className="contact-channel-item contact-channel--email">
                  <div className="contact-channel-icon-wrap email">
                    <Mail size={20} />
                  </div>
                  <div className="contact-channel-content">
                    <div className="contact-channel-title-row">
                      <span className="contact-channel-name">{copy.channels.email.title}</span>
                      <div className="contact-channel-actions">
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="contact-copy-pill"
                          title={copy.channels.email.actionLabel}
                          aria-label={copied ? copy.copySuccess : copy.channels.email.actionLabel}
                        >
                          {copied ? (
                            <>
                              <Check size={12} aria-hidden="true" />
                              <span>{copy.copySuccess}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} aria-hidden="true" />
                              <span>{copy.channels.email.action}</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`mailto:${CONTACTS.email}`}
                          className="contact-email-direct"
                          title={copy.channels.email.openLabel}
                          aria-label={copy.channels.email.openLabel}
                        >
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                    <span className="contact-channel-detail">{copy.channels.email.detail}</span>
                  </div>
                </div>

                {/* LinkedIn */}
                <a
                  href={CONTACTS.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-channel-item contact-channel--linkedin"
                >
                  <div className="contact-channel-icon-wrap linkedin">
                    <LinkedinIcon size={20} />
                  </div>
                  <div className="contact-channel-content">
                    <div className="contact-channel-title-row">
                      <span className="contact-channel-name">{copy.channels.linkedin.title}</span>
                      <ArrowUpRight size={14} className="contact-channel-arrow" aria-hidden="true" />
                    </div>
                    <span className="contact-channel-detail">{copy.channels.linkedin.detail}</span>
                  </div>
                </a>

                {/* GitHub */}
                <a
                  href={CONTACTS.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-channel-item contact-channel--github"
                >
                  <div className="contact-channel-icon-wrap github">
                    <GithubIcon size={20} />
                  </div>
                  <div className="contact-channel-content">
                    <div className="contact-channel-title-row">
                      <span className="contact-channel-name">{copy.channels.github.title}</span>
                      <ArrowUpRight size={14} className="contact-channel-arrow" aria-hidden="true" />
                    </div>
                    <span className="contact-channel-detail">{copy.channels.github.detail}</span>
                  </div>
                </a>
              </div>

              {/* Footer info */}
              <div className="contact-modal-footer">
                <span className="contact-modal-location">
                  <MapPin size={13} aria-hidden="true" />
                  <span>{copy.location}</span>
                </span>
                <span className="contact-modal-brand">Christian Sousa</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}


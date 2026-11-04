// frontend/src/hooks/useDialog.js
//
// Comportamento comum a sheet, chat e modais: foco contido enquanto aberto,
// Escape fecha, foco volta ao elemento que abriu e (opcionalmente) a página
// de fundo para de rolar.

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const getFocusable = (root) =>
  Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );

export default function useDialog({
  open,
  containerRef,
  onClose,
  initialFocusRef,
  lockScroll = false,
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const trigger = document.activeElement;
    const root = containerRef.current;

    // espera o painel montar (AnimatePresence) antes de mover o foco
    const focusTimer = window.setTimeout(() => {
      const target =
        initialFocusRef?.current || (root ? getFocusable(root)[0] : null) || root;
      target?.focus({ preventScroll: true });
    }, 30);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !containerRef.current) return;

      const items = getFocusable(containerRef.current);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !containerRef.current.contains(active);

      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    if (lockScroll) html.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      if (lockScroll) html.style.overflow = previousOverflow;
      if (trigger && typeof trigger.focus === "function" && document.contains(trigger)) {
        trigger.focus({ preventScroll: true });
      }
    };
    // containerRef/initialFocusRef são refs estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lockScroll]);
}

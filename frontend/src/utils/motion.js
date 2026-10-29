// frontend/src/utils/motion.js

// Curva única de desaceleração usada em toda a coreografia
export const EASE_OUT = [0.22, 1, 0.36, 1];

export const VIEWPORT_ONCE = { once: true, amount: 0.18 };

export const SPRING_INDICATOR = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };

export const revealContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const revealItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

// Atualiza --mx/--my no elemento para o efeito de spotlight sem re-render do React
export const trackSpotlight = (event) => {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
};

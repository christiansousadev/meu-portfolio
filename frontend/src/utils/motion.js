// frontend/src/utils/motion.js
//
// Movimento só responde a ações (abrir, expandir, confirmar, trocar de aba).
// A única coreografia sem gatilho do usuário é o traçado do esquema no Hero,
// feita em CSS (index.css) e desligada por prefers-reduced-motion.

// Curva única de desaceleração usada em toda a interface
export const EASE_OUT = [0.22, 1, 0.36, 1];

export const SPRING_INDICATOR = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };

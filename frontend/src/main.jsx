// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

// Fontes servidas pelo próprio domínio: sem chamada a terceiros na carga
// da página (nenhum IP de visitante enviado ao Google Fonts).
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";

import App from "./App.jsx";
import "./index.css";

// Polyfill defensivo para compatibilidade entre React e extensões/scripts de tradução (Google Translate)
// Previne que tags <font> injetadas pelo tradutor causem 'NotFoundError: removeChild' no reconciliador do React
if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

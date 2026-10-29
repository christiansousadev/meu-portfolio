// frontend/src/utils/adminApi.js

// Todas as rotas administrativas usam o cookie HttpOnly da sessão
export const adminFetch = (path, options = {}) =>
  fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

export const isAuthFailure = (res) => [401, 403].includes(res.status);

// Converte o `detail` do FastAPI (string ou lista de erros do Pydantic) em texto legível
export const extractErrorDetail = (err) => {
  if (!err) return "";
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((d) =>
        d?.msg
          ? `${(d.loc || []).slice(-1)[0] ?? "campo"}: ${d.msg}`
          : JSON.stringify(d)
      )
      .join(" · ");
  }
  return err.message || "";
};

export const downloadJson = (payload, filename) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

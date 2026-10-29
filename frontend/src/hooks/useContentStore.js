// frontend/src/hooks/useContentStore.js
//
// Mantém portfolio.json e portfolio_data.json carregados ao mesmo tempo para
// que a navegação do console troque de seção sem descartar edições pendentes.
// Cada arquivo tem seu próprio estado "sujo"; salvar grava apenas o que mudou.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminFetch,
  downloadJson,
  extractErrorDetail,
  isAuthFailure,
} from "../utils/adminApi";

export const CONTENT_FILE = "portfolio.json";
export const RAG_FILE = "portfolio_data.json";

const FILES = [CONTENT_FILE, RAG_FILE];
const EMPTY_DOCS = { [CONTENT_FILE]: null, [RAG_FILE]: null };
const TOAST_TTL_MS = 4000;
const SAVED_FLASH_MS = 1800;

export default function useContentStore({ enabled, onSessionLost }) {
  const [docs, setDocs] = useState(EMPTY_DOCS);
  const [dirtyFiles, setDirtyFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [toast, setToast] = useState(null);

  const onSessionLostRef = useRef(onSessionLost);
  onSessionLostRef.current = onSessionLost;

  const showToast = useCallback((type, message) => {
    setToast({ type, message, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), TOAST_TTL_MS);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const entries = await Promise.all(
          FILES.map(async (file) => {
            const res = await adminFetch(`/api/admin/config?filename=${file}`);
            if (isAuthFailure(res)) {
              const authError = new Error("sessão expirada");
              authError.sessionLost = true;
              throw authError;
            }
            if (!res.ok) throw new Error(`http ${res.status}`);
            return [file, await res.json()];
          })
        );
        if (cancelled) return;
        setDocs(Object.fromEntries(entries));
        setDirtyFiles([]);
      } catch (e) {
        if (cancelled) return;
        if (e.sessionLost) {
          onSessionLostRef.current?.();
          return;
        }
        console.error("falha ao carregar arquivos de conteudo", e);
        showToast("error", "Não foi possível carregar os arquivos de configuração.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, showToast]);

  const replaceDoc = useCallback((file, nextDoc) => {
    setDocs((prev) => ({ ...prev, [file]: nextDoc }));
    setDirtyFiles((prev) => (prev.includes(file) ? prev : [...prev, file]));
  }, []);

  const save = useCallback(async () => {
    if (isSaving || dirtyFiles.length === 0) return;
    setIsSaving(true);

    const saved = [];
    const failures = [];

    for (const file of dirtyFiles) {
      try {
        const res = await adminFetch("/api/admin/config", {
          method: "POST",
          body: JSON.stringify({ filename: file, content: docs[file] }),
        });
        if (isAuthFailure(res)) {
          onSessionLostRef.current?.();
          setIsSaving(false);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(extractErrorDetail(err) || `Erro HTTP ${res.status} ao salvar.`);
        }
        saved.push(file);
      } catch (e) {
        console.error(`falha ao salvar ${file}`, e);
        failures.push(`${file}: ${e.message}`);
      }
    }

    setDirtyFiles((prev) => prev.filter((file) => !saved.includes(file)));
    setIsSaving(false);

    if (failures.length) {
      showToast("error", failures.join(" | "));
      return;
    }
    showToast("success", "Alterações gravadas com sucesso.");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), SAVED_FLASH_MS);
  }, [docs, dirtyFiles, isSaving, showToast]);

  const exportFile = useCallback(
    (file) => {
      if (!docs[file]) return;
      try {
        downloadJson(docs[file], file);
        showToast("success", `Cópia de ${file} baixada.`);
      } catch {
        showToast("error", "Não foi possível gerar o arquivo de backup.");
      }
    },
    [docs, showToast]
  );

  // Ctrl/Cmd + S grava; sair da página com pendências pede confirmação
  const saveRef = useRef(save);
  saveRef.current = save;
  const isDirty = dirtyFiles.length > 0;

  useEffect(() => {
    if (!enabled) return undefined;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return {
    docs,
    dirtyFiles,
    isDirty,
    isSaving,
    justSaved,
    toast,
    dismissToast: () => setToast(null),
    replaceDoc,
    save,
    exportFile,
  };
}

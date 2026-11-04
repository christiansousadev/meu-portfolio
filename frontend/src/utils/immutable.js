// frontend/src/utils/immutable.js
//
// Atualizações imutáveis por caminho: cada nível do caminho é copiado e o
// restante da árvore é compartilhado. Evita mutar o estado do React no lugar.

const cloneContainer = (value, nextKey) => {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") return { ...value };
  return typeof nextKey === "number" ? [] : {};
};

export function updateIn(source, path, updater) {
  if (path.length === 0) return updater(source);
  const [key, ...rest] = path;
  const copy = cloneContainer(source, key);
  copy[key] = updateIn(source?.[key], rest, updater);
  return copy;
}

export const setIn = (source, path, value) => updateIn(source, path, () => value);

export const insertAt = (list, index, item) => {
  const copy = Array.isArray(list) ? [...list] : [];
  copy.splice(index, 0, item);
  return copy;
};

export const removeAt = (list, index) =>
  (Array.isArray(list) ? list : []).filter((_, i) => i !== index);

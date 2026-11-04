// frontend/src/hooks/useMediaQuery.js
import { useEffect, useState } from "react";

const read = (query) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => read(query));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

import { useEffect, useState } from "react";

/** useState backed by localStorage. Storage can be missing or blocked
 *  (private windows, previews), so every access falls back quietly. */
export const usePersistent = (key, initial) => {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep the in-memory value */
    }
  }, [key, value]);

  return [value, setValue];
};

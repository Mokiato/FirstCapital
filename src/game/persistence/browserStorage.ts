// src/game/persistence/browserStorage.ts
// Единый KeyValueStorage на базе localStorage с SSR-защитой.
// Раньше дублировался в store.ts и App.tsx (расхождение: App.tsx не
// проверял typeof window).
import type { KeyValueStorage } from './save';

export const browserStorage: KeyValueStorage = {
  getItem: (key) =>
    typeof window !== 'undefined' ? localStorage.getItem(key) : null,
  setItem: (key, value) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  },
};
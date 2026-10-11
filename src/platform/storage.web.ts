import type { KeyValueStore } from './storageTypes';

/** Web storage for previews; failures (private mode, blocked storage) degrade to no persistence. */
export const storage: KeyValueStore = {
  get: (key) => {
    try {
      return globalThis.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      globalThis.localStorage.setItem(key, value);
    } catch {
      return;
    }
  },
  remove: (key) => {
    try {
      globalThis.localStorage.removeItem(key);
    } catch {
      return;
    }
  },
};

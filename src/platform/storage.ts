import Storage from 'expo-sqlite/kv-store';
import type { KeyValueStore } from './storageTypes';

/** Native storage: SQLite-backed key-value store with synchronous access. */
export const storage: KeyValueStore = {
  get: (key) => Storage.getItemSync(key),
  set: (key, value) => {
    Storage.setItemSync(key, value);
  },
  remove: (key) => {
    Storage.removeItemSync(key);
  },
};

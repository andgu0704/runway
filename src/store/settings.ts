import { create } from 'zustand';
import { setHapticsEnabled } from '../platform/haptics';
import { storage } from '../platform/storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type MotionPreference = 'system' | 'reduced' | 'full';

export interface Settings {
  theme: ThemePreference;
  haptics: boolean;
  motion: MotionPreference;
  confirmEndTurn: boolean;
}

const KEY = 'settings.v1';
const DEFAULTS: Settings = {
  theme: 'system',
  haptics: true,
  motion: 'system',
  confirmEndTurn: true,
};

function load(): Settings {
  try {
    const raw = storage.get(KEY);
    if (raw === null) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void;
}

export const useSettings = create<SettingsStore>((set, get) => {
  const initial = load();
  setHapticsEnabled(initial.haptics);
  return {
    ...initial,
    update(patch) {
      set(patch);
      const { theme, haptics, motion, confirmEndTurn } = { ...get(), ...patch };
      setHapticsEnabled(haptics);
      storage.set(KEY, JSON.stringify({ theme, haptics, motion, confirmEndTurn }));
    },
  };
});

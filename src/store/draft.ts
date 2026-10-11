import { create } from 'zustand';

export interface Draft {
  background: string | null;
  market: string | null;
  model: string | null;
  cofounder: string | null | undefined;
  founderName: string;
  companyName: string;
}

interface DraftStore extends Draft {
  set: (patch: Partial<Draft>) => void;
  reset: () => void;
}

const EMPTY: Draft = {
  background: null,
  market: null,
  model: null,
  cofounder: undefined,
  founderName: '',
  companyName: '',
};

/** The new-run choices while the player moves through onboarding. */
export const useDraft = create<DraftStore>((set) => ({
  ...EMPTY,
  set: (patch) => {
    set(patch);
  },
  reset: () => {
    set(EMPTY);
  },
}));

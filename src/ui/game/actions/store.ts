import { create } from 'zustand';
import type { ActionParams } from '../../../engine';

interface ActionSheetState {
  action: string | null;
  preset: ActionParams;
  open: (action: string, preset?: ActionParams) => void;
  close: () => void;
}

/** Which action sheet is open, shared by every tab so one host renders it. */
export const useActionSheet = create<ActionSheetState>((set) => ({
  action: null,
  preset: {},
  open: (action, preset = {}) => {
    set({ action, preset });
  },
  close: () => {
    set({ action: null, preset: {} });
  },
}));

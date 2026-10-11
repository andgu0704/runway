import { useStore } from 'zustand';
import { loadContent } from '../content/runtime';
import type { Signal } from '../engine';
import { haptic, type HapticKind } from '../platform/haptics';
import { storage } from '../platform/storage';
import { createGameStore, type GameStoreState } from './gameStore';

const SIGNAL_HAPTICS: [Signal, HapticKind][] = [
  ['disaster', 'disaster'],
  ['dealClosed', 'success'],
  ['stageChanged', 'milestone'],
  ['runEnded', 'milestone'],
  ['turnEnded', 'turnEnd'],
];

export const gameStore = createGameStore({
  storage,
  content: loadContent(),
  now: () => new Date().toISOString(),
  seed: () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0,
  onSignals: (signals) => {
    const match = SIGNAL_HAPTICS.find(([signal]) => signals.includes(signal));
    if (match !== undefined) haptic(match[1]);
  },
});

export function useGame<T>(selector: (state: GameStoreState) => T): T {
  return useStore(gameStore, selector);
}

import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  apply,
  newRun,
  type Command,
  type ContentPack,
  type FeedEntry,
  type GameState,
  type RuleError,
  type RunSetup,
  type Signal,
} from '../engine';
import type { KeyValueStore } from '../platform/storageTypes';
import { createSave, loadSave, serializeSave } from '../save/saveFile';

export const SAVE_KEY = 'run.current';

export type BootStatus = 'booting' | 'empty' | 'ready' | 'error';
export type LoadProblem = 'corrupt' | 'tooNew' | 'unrecoverable';

export interface GameStoreState {
  status: BootStatus;
  problem: LoadProblem | null;
  game: GameState | null;
  commands: Command[];
  /** Feed entries added by the most recent command; the feed animates these in. */
  fresh: FeedEntry[];
  lastSignals: Signal[];
  boot: () => void;
  startRun: (setup: RunSetup) => void;
  dispatch: (command: Command) => RuleError | null;
  discardRun: () => void;
}

export interface GameStoreDeps {
  storage: KeyValueStore;
  content: ContentPack;
  now: () => string;
  seed: () => number;
  onSignals?: (signals: Signal[], game: GameState) => void;
}

export function createGameStore(deps: GameStoreDeps): StoreApi<GameStoreState> {
  const persist = (game: GameState, commands: Command[]) => {
    deps.storage.set(SAVE_KEY, serializeSave(createSave(game, commands, deps.content, deps.now())));
  };

  return createStore<GameStoreState>((set, get) => ({
    status: 'booting',
    problem: null,
    game: null,
    commands: [],
    fresh: [],
    lastSignals: [],

    boot() {
      const raw = deps.storage.get(SAVE_KEY);
      if (raw === null) {
        set({ status: 'empty', problem: null, game: null, commands: [] });
        return;
      }
      const loaded = loadSave(raw, deps.content);
      if (!loaded.ok) {
        set({ status: 'error', problem: loaded.reason, game: null, commands: [] });
        return;
      }
      if (loaded.source === 'replay') persist(loaded.save.state, loaded.save.run.commands);
      set({
        status: 'ready',
        problem: null,
        game: loaded.save.state,
        commands: loaded.save.run.commands,
        fresh: [],
        lastSignals: [],
      });
    },

    startRun(setup) {
      const game = newRun(deps.seed(), setup, deps.content);
      persist(game, []);
      set({
        status: 'ready',
        problem: null,
        game,
        commands: [],
        fresh: game.feed,
        lastSignals: [],
      });
    },

    dispatch(command) {
      const { game, commands } = get();
      if (game === null) return 'ended';
      const result = apply(game, deps.content, command);
      if (!result.ok) return result.error;
      const nextCommands = [...commands, command];
      persist(result.state, nextCommands);
      set({
        game: result.state,
        commands: nextCommands,
        fresh: result.feed,
        lastSignals: result.signals,
      });
      deps.onSignals?.(result.signals, result.state);
      return null;
    },

    discardRun() {
      deps.storage.remove(SAVE_KEY);
      set({ status: 'empty', problem: null, game: null, commands: [], fresh: [], lastSignals: [] });
    },
  }));
}

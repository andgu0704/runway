import { describe, expect, it } from 'vitest';
import { memoryStore } from '../platform/storageTypes';
import { content, SETUP } from '../test/helpers';
import { createGameStore, SAVE_KEY } from './gameStore';

const deps = (storage = memoryStore()) => ({
  storage,
  content,
  now: () => '2026-10-11T00:00:00.000Z',
  seed: () => 99,
});

describe('game store', () => {
  it('boots empty without a save', () => {
    const store = createGameStore(deps());
    store.getState().boot();
    expect(store.getState().status).toBe('empty');
  });

  it('auto-saves after every command and resumes exactly', () => {
    const storage = memoryStore();
    const store = createGameStore(deps(storage));
    store.getState().startRun(SETUP);
    expect(store.getState().dispatch({ type: 'performAction', action: 'writeValues' })).toBeNull();
    expect(store.getState().dispatch({ type: 'endTurn' })).toBeNull();

    const resumed = createGameStore(deps(storage));
    resumed.getState().boot();
    expect(resumed.getState().status).toBe('ready');
    expect(resumed.getState().game).toEqual(store.getState().game);
    expect(resumed.getState().commands).toHaveLength(2);
  });

  it('reports rule errors without saving', () => {
    const storage = memoryStore();
    const store = createGameStore(deps(storage));
    store.getState().startRun(SETUP);
    const before = storage.get(SAVE_KEY);
    expect(store.getState().dispatch({ type: 'resolveEvent', option: 'nope' })).toBe(
      'noEventPending',
    );
    expect(storage.get(SAVE_KEY)).toBe(before);
  });

  it('exposes the feed entries a command produced', () => {
    const store = createGameStore(deps());
    store.getState().startRun(SETUP);
    store.getState().dispatch({ type: 'endTurn' });
    const { fresh, lastSignals } = store.getState();
    expect(fresh.length).toBeGreaterThan(0);
    expect(lastSignals).toContain('turnEnded');
  });

  it('surfaces unreadable saves as a designed error state', () => {
    const storage = memoryStore();
    storage.set(SAVE_KEY, '{broken');
    const store = createGameStore(deps(storage));
    store.getState().boot();
    expect(store.getState()).toMatchObject({ status: 'error', problem: 'corrupt' });
    store.getState().discardRun();
    expect(store.getState().status).toBe('empty');
    expect(storage.get(SAVE_KEY)).toBeNull();
  });
});

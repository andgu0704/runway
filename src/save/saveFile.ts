import { z } from 'zod';
import type { ContentPack } from '../engine/content';
import {
  applyInPlace,
  newRun,
  STATE_SCHEMA_VERSION,
  type Command,
  type GameState,
  type RunSetup,
} from '../engine';
import { migrations } from './migrations';
import { gameStateSchema } from './schema';

export const SAVE_VERSION = 1;

export interface SaveFile {
  saveVersion: number;
  contentVersion: string;
  updatedAt: string;
  run: { seed: number; setup: RunSetup; commands: Command[] };
  state: GameState;
}

const envelopeSchema = z.object({
  saveVersion: z.number().int().positive(),
  contentVersion: z.string(),
  updatedAt: z.string(),
  run: z.object({
    seed: z.number(),
    setup: z.object({
      founderName: z.string(),
      companyName: z.string(),
      background: z.string(),
      market: z.string(),
      model: z.string(),
      cofounder: z.string().nullable(),
    }),
    commands: z.array(z.unknown()),
  }),
  state: z.unknown(),
});

/** A short fingerprint of content ids; changes when content is added or removed. */
export function contentVersion(content: ContentPack): string {
  const ids = [
    ...content.data.actions.map((a) => a.id),
    ...content.data.events.map((e) => e.id),
    ...content.data.features.map((f) => f.id),
    ...content.data.traits.map((t) => t.id),
  ].join('|');
  let hash = 2166136261;
  for (let i = 0; i < ids.length; i++) {
    hash ^= ids.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function createSave(
  state: GameState,
  commands: Command[],
  content: ContentPack,
  now: string,
): SaveFile {
  return {
    saveVersion: SAVE_VERSION,
    contentVersion: contentVersion(content),
    updatedAt: now,
    run: { seed: state.seed, setup: state.setup, commands },
    state,
  };
}

export function serializeSave(save: SaveFile): string {
  return JSON.stringify(save);
}

export type LoadResult =
  | { ok: true; save: SaveFile; source: 'snapshot' | 'replay' }
  | { ok: false; reason: 'corrupt' | 'tooNew' | 'unrecoverable' };

/** Rebuilds the state from the seed and command log, for when the snapshot is unusable. */
export function replay(
  seed: number,
  setup: RunSetup,
  commands: readonly Command[],
  content: ContentPack,
): GameState | null {
  try {
    const state = newRun(seed, setup, content);
    for (const command of commands) {
      if (applyInPlace(state, content, command) !== null) return null;
    }
    return state;
  } catch {
    return null;
  }
}

function snapshotUsable(state: unknown, content: ContentPack): state is GameState {
  const parsed = gameStateSchema.safeParse(state);
  if (!parsed.success) return false;
  const s = parsed.data;
  if (s.schema !== STATE_SCHEMA_VERSION) return false;
  if (!content.stages.has(s.stage) || !content.markets.has(s.setup.market)) return false;
  if (s.pendingEvent !== null && !content.events.has(s.pendingEvent.event)) return false;
  return s.product.roadmap.every((r) => content.features.has(r.feature));
}

export function loadSave(raw: string, content: ContentPack): LoadResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  const envelope = envelopeSchema.safeParse(json);
  if (!envelope.success) return { ok: false, reason: 'corrupt' };
  if (envelope.data.saveVersion > SAVE_VERSION) return { ok: false, reason: 'tooNew' };

  let data: Record<string, unknown> = envelope.data;
  for (let v = envelope.data.saveVersion; v < SAVE_VERSION; v++) {
    const migrate = migrations[v];
    if (migrate === undefined) return { ok: false, reason: 'unrecoverable' };
    data = migrate(data);
  }
  const save = data as unknown as SaveFile;
  if (snapshotUsable(save.state, content)) return { ok: true, save, source: 'snapshot' };

  const rebuilt = replay(save.run.seed, save.run.setup, save.run.commands, content);
  if (rebuilt === null) return { ok: false, reason: 'unrecoverable' };
  return {
    ok: true,
    save: { ...save, state: rebuilt, saveVersion: SAVE_VERSION },
    source: 'replay',
  };
}

import { describe, expect, it } from 'vitest';
import { bots } from '../sim/bots';
import { playRun } from '../sim/run';
import { content, SETUP } from '../test/helpers';
import { createSave, loadSave, SAVE_VERSION, serializeSave } from './saveFile';

const NOW = '2026-10-10T12:00:00.000Z';

function sampleSave() {
  return { played: playRun(3, SETUP, bots.balanced!, content) };
}

describe('saves', () => {
  it('round-trips a snapshot exactly', () => {
    const { played } = sampleSave();
    const raw = serializeSave(createSave(played.state, played.commands, content, NOW));
    const loaded = loadSave(raw, content);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.source).toBe('snapshot');
    expect(loaded.save.state).toEqual(played.state);
  });

  it('rebuilds from the command log when the snapshot is damaged', () => {
    const { played } = sampleSave();
    const save = createSave(played.state, played.commands, content, NOW);
    const damaged = JSON.parse(serializeSave(save)) as Record<string, unknown>;
    (damaged.state as Record<string, unknown>).stats = 'oops';
    const loaded = loadSave(JSON.stringify(damaged), content);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.source).toBe('replay');
    expect(JSON.stringify(loaded.save.state)).toBe(JSON.stringify(played.state));
  });

  it('refuses saves from a newer version of the game', () => {
    const { played } = sampleSave();
    const save = {
      ...createSave(played.state, played.commands, content, NOW),
      saveVersion: SAVE_VERSION + 1,
    };
    expect(loadSave(serializeSave(save), content)).toEqual({ ok: false, reason: 'tooNew' });
  });

  it('reports corrupt files instead of throwing', () => {
    expect(loadSave('{not json', content)).toEqual({ ok: false, reason: 'corrupt' });
    expect(loadSave('{"hello":1}', content)).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('reports unrecoverable saves when neither snapshot nor log works', () => {
    const { played } = sampleSave();
    const save = createSave(played.state, [{ type: 'resolveEvent', option: 'nope' }], content, NOW);
    const raw = JSON.parse(serializeSave(save)) as Record<string, unknown>;
    raw.state = null;
    expect(loadSave(JSON.stringify(raw), content)).toEqual({ ok: false, reason: 'unrecoverable' });
  });
});

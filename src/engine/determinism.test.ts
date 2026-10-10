import { describe, expect, it } from 'vitest';
import { bots } from '../sim/bots';
import { playRun } from '../sim/run';
import { content, SETUP } from '../test/helpers';
import { applyInPlace } from './apply';
import { newRun } from './newRun';

describe('determinism', () => {
  it('the same seed and the same bot produce the same run', () => {
    const a = playRun(42, SETUP, bots.balanced!, content);
    const b = playRun(42, SETUP, bots.balanced!, content);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    expect(a.commands).toEqual(b.commands);
  });

  it('replaying the recorded commands reproduces the final state exactly', () => {
    for (const name of ['random', 'growth', 'shady']) {
      const played = playRun(7, { ...SETUP, market: 'social', model: 'ads' }, bots[name]!, content);
      const replayed = newRun(7, played.state.setup, content);
      for (const command of played.commands)
        expect(applyInPlace(replayed, content, command)).toBeNull();
      expect(JSON.stringify(replayed)).toBe(JSON.stringify(played.state));
    }
  });

  it('different seeds lead to different runs', () => {
    const a = playRun(1, SETUP, bots.random!, content);
    const b = playRun(2, SETUP, bots.random!, content);
    expect(JSON.stringify(a.state)).not.toBe(JSON.stringify(b.state));
  });

  it('survives a JSON round trip mid-run', () => {
    const played = playRun(11, SETUP, bots.balanced!, content);
    const half = Math.floor(played.commands.length / 2);
    const state = newRun(11, SETUP, content);
    for (const command of played.commands.slice(0, half)) applyInPlace(state, content, command);
    const restored = JSON.parse(JSON.stringify(state)) as typeof state;
    for (const command of played.commands.slice(half)) applyInPlace(restored, content, command);
    expect(JSON.stringify(restored)).toBe(JSON.stringify(played.state));
  });
});

import { describe, expect, it } from 'vitest';
import { content } from '../test/helpers';
import { bots } from './bots';
import { playRun, randomSetup } from './run';

describe('simulation', () => {
  it('every bot finishes runs without making illegal moves', () => {
    for (const [name, bot] of Object.entries(bots)) {
      for (let seed = 1; seed <= 8; seed++) {
        const result = playRun(seed, randomSetup(seed, content), bot, content);
        expect(result.state.ending, `${name} seed ${seed}`).not.toBeNull();
        expect(result.errors, `${name} seed ${seed}`).toBe(0);
      }
    }
  });

  it('most random runs fail', () => {
    let failures = 0;
    const runs = 60;
    for (let seed = 1; seed <= runs; seed++) {
      const { state } = playRun(seed, randomSetup(seed, content), bots.random!, content);
      if (content.endings.get(state.ending?.id ?? '')?.kind === 'failure') failures += 1;
    }
    expect(failures / runs).toBeGreaterThanOrEqual(0.8);
  });
});

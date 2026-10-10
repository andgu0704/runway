import { describe, expect, it } from 'vitest';
import {
  chance,
  nextFloat,
  nextUint32,
  pick,
  pickWeighted,
  randInt,
  seedRng,
  shuffle,
} from './rng';

describe('rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = seedRng(1234);
    const b = seedRng(1234);
    const seqA = Array.from({ length: 50 }, () => nextUint32(a));
    const seqB = Array.from({ length: 50 }, () => nextUint32(b));
    expect(seqA).toEqual(seqB);
  });

  it('keeps a stable sequence across releases', () => {
    const s = seedRng(1);
    expect(Array.from({ length: 4 }, () => nextUint32(s))).toMatchInlineSnapshot(`
      [
        473542192,
        3964317691,
        2295682031,
        2113742504,
      ]
    `);
  });

  it('produces different sequences for different seeds', () => {
    expect(nextUint32(seedRng(1))).not.toEqual(nextUint32(seedRng(2)));
  });

  it('stays within bounds', () => {
    const s = seedRng(9);
    for (let i = 0; i < 10_000; i++) {
      const f = nextFloat(s);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = randInt(s, 3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('is roughly uniform', () => {
    const s = seedRng(77);
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 40_000; i++) buckets[randInt(s, 0, 3)]! += 1;
    for (const count of buckets) expect(Math.abs(count - 10_000)).toBeLessThan(400);
  });

  it('respects probabilities and weights', () => {
    const s = seedRng(5);
    let hits = 0;
    for (let i = 0; i < 20_000; i++) if (chance(s, 0.25)) hits += 1;
    expect(hits / 20_000).toBeCloseTo(0.25, 1);
    const picks = { a: 0, b: 0 };
    for (let i = 0; i < 20_000; i++)
      picks[pickWeighted(s, ['a', 'b'] as const, (x) => (x === 'a' ? 3 : 1))!] += 1;
    expect(picks.a / 20_000).toBeCloseTo(0.75, 1);
    expect(pickWeighted(s, ['a'], () => 0)).toBeNull();
  });

  it('shuffles without losing items', () => {
    const s = seedRng(3);
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffle(s, items).sort((a, b) => a - b)).toEqual(items);
    expect(() => pick(s, [])).toThrow();
  });
});

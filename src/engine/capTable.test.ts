import { describe, expect, it } from 'vitest';
import { freshRun } from '../test/helpers';
import { grantFromPool, holderBps, issueShares, TOTAL_BPS, transferShares } from './capTable';

const total = (state: ReturnType<typeof freshRun>) =>
  state.capTable.reduce((acc, e) => acc + e.bps, 0);

describe('cap table', () => {
  it('starts with founder and co-founder owning everything', () => {
    const state = freshRun();
    expect(total(state)).toBe(TOTAL_BPS);
    expect(holderBps(state, 'founder')).toBe(7000);
    expect(holderBps(state, 'cofounder')).toBe(3000);
  });

  it('dilutes everyone proportionally when issuing shares', () => {
    const state = freshRun();
    issueShares(state, 'inv:test', 2000);
    expect(total(state)).toBe(TOTAL_BPS);
    expect(holderBps(state, 'inv:test')).toBe(2000);
    expect(holderBps(state, 'founder')).toBe(5600);
    expect(holderBps(state, 'cofounder')).toBe(2400);
  });

  it('always sums to exactly 10,000 after many awkward issues', () => {
    const state = freshRun();
    for (let i = 1; i <= 40; i++) issueShares(state, `inv:${i % 7}`, 37 + i * 13);
    expect(total(state)).toBe(TOTAL_BPS);
    expect(state.capTable.every((e) => e.bps > 0)).toBe(true);
  });

  it('grants from the pool and tops it up when it runs dry', () => {
    const state = freshRun();
    grantFromPool(state, 'emp:a', 100);
    expect(holderBps(state, 'emp:a')).toBe(100);
    expect(holderBps(state, 'pool')).toBeGreaterThan(0);
    expect(total(state)).toBe(TOTAL_BPS);
    expect(holderBps(state, 'founder')).toBeLessThan(7000);
  });

  it('transfers without changing the total', () => {
    const state = freshRun();
    expect(transferShares(state, 'cofounder', 'pool', 500)).toBe(500);
    expect(holderBps(state, 'pool')).toBe(500);
    expect(transferShares(state, 'nobody', 'pool', 500)).toBe(0);
    expect(total(state)).toBe(TOTAL_BPS);
  });
});

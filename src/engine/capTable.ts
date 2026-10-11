import type { CapEntry, GameState } from './state';

export const TOTAL_BPS = 10_000;

function sortEntries(entries: CapEntry[]): void {
  entries.sort((a, b) => b.bps - a.bps || (a.holder < b.holder ? -1 : 1));
}

/**
 * Issues `bps` of the post-issue company to `holder`, diluting everyone else
 * proportionally. Integer maths with the rounding remainder going to the
 * largest existing holder keeps the table summing to exactly 10,000.
 */
export function issueShares(state: GameState, holder: string, bps: number): void {
  const issued = Math.max(1, Math.min(TOTAL_BPS - 1, Math.round(bps)));
  const remaining = TOTAL_BPS - issued;
  const before = state.capTable.filter((e) => e.bps > 0);
  const diluted = before.map((e) => ({
    holder: e.holder,
    bps: Math.floor((e.bps * remaining) / TOTAL_BPS),
  }));
  const shortfall = remaining - diluted.reduce((acc, e) => acc + e.bps, 0);
  sortEntries(diluted);
  const largest = diluted[0];
  if (largest !== undefined) largest.bps += shortfall;

  const existing = diluted.find((e) => e.holder === holder);
  if (existing === undefined) diluted.push({ holder, bps: issued });
  else existing.bps += issued;
  sortEntries(diluted);
  state.capTable = diluted.filter((e) => e.bps > 0);
}

/** Moves shares between holders without dilution, e.g. option pool grants. */
export function transferShares(state: GameState, from: string, to: string, bps: number): number {
  const source = state.capTable.find((e) => e.holder === from);
  const amount = Math.min(bps, source?.bps ?? 0);
  if (source === undefined || amount <= 0) return 0;
  source.bps -= amount;
  const target = state.capTable.find((e) => e.holder === to);
  if (target === undefined) state.capTable.push({ holder: to, bps: amount });
  else target.bps += amount;
  state.capTable = state.capTable.filter((e) => e.bps > 0);
  sortEntries(state.capTable);
  return amount;
}

/** Grants equity from the option pool, topping the pool up (dilutively) when it runs dry. */
export function grantFromPool(state: GameState, holder: string, bps: number): void {
  const pool = state.capTable.find((e) => e.holder === 'pool')?.bps ?? 0;
  if (pool < bps) issueShares(state, 'pool', bps - pool + 500);
  transferShares(state, 'pool', holder, bps);
}

export function holderBps(state: GameState, holder: string): number {
  return state.capTable.find((e) => e.holder === holder)?.bps ?? 0;
}

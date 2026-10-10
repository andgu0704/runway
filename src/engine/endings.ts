import { must, stageIndex, type ContentPack } from './content';
import { founderOwnership, valuation } from './economy';
import { addFeed, addTimeline } from './log';
import { clamp } from './math';
import { nextUint32 } from './rng';
import type { GameState } from './state';

/** Reads the ending through a call so TypeScript does not keep a stale narrowing after mutations. */
export function hasEnded(state: GameState): boolean {
  return state.ending !== null;
}

/** 0–100: how the run will be remembered, independent of money. */
export function legacyRating(state: GameState, content: ContentPack): number {
  const { reputation, morale, quality } = state.stats;
  let score = 30;
  score += (reputation - 50) * 0.4;
  score += (morale - 50) * 0.2;
  score += (quality - 50) * 0.15;
  score += stageIndex(content, state.stage) * 10;
  score += Math.min(15, state.month / 6);
  score -= (state.flags.shadyActs ?? 0) * 3;
  score -= (state.flags.scandalsExposed ?? 0) * 10;
  score -= (state.flags.layoffs ?? 0) * 4;
  score += (state.flags.goodDeeds ?? 0) * 3;
  return Math.round(clamp(score, 0, 100));
}

/**
 * Founder proceeds at a given company value. Investors hold a 1x non-participating
 * preference: they take the larger of their money back or their pro-rata share.
 * When they take their money back, the founder shares what is left with the
 * other common holders.
 */
export function founderProceeds(state: GameState, companyValue: number): number {
  const raised = state.rounds.reduce((acc, r) => acc + r.amount, 0);
  const investorBps = state.capTable
    .filter((e) => e.holder.startsWith('inv:'))
    .reduce((acc, e) => acc + e.bps, 0);
  const founderBps = founderOwnership(state);
  const proRata = (companyValue * investorBps) / 10_000;
  if (raised <= proRata || investorBps >= 10_000) {
    return Math.round((companyValue * founderBps) / 10_000);
  }
  const remaining = Math.max(0, companyValue - Math.min(raised, companyValue));
  return Math.round((remaining * founderBps) / (10_000 - investorBps));
}

export function declareEnding(
  state: GameState,
  content: ContentPack,
  endingId: string,
  valueMul = 1,
): void {
  if (state.ending !== null) return;
  const ending = must(content.endings, endingId, 'ending');
  const value = Math.round(valuation(state, content) * valueMul);
  const netWorth = ending.keepsEquityValue ? founderProceeds(state, value) : 0;
  const legacy = legacyRating(state, content);
  state.negotiation = null;
  state.pendingEvent = null;
  state.ending = {
    id: ending.id,
    month: state.month,
    valuation: ending.keepsEquityValue ? value : 0,
    ownershipBps: founderOwnership(state),
    netWorth,
    legacy,
    score: Math.round(netWorth / 1000 + legacy * 50),
    headline: nextUint32(state.rng) % 997,
  };
  addFeed(
    state,
    content,
    `ending.${ending.id}.feed`,
    ending.kind === 'failure' ? 'bad' : 'milestone',
  );
  addTimeline(state, content, 'milestone', `ending.${ending.id}.timeline`, 'milestone', {
    netWorth,
  });
}

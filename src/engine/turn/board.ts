import type { ContentPack } from '../content';
import { investorSeats, runwayMonths, userGrowth } from '../economy';
import { clamp } from '../math';
import type { GameState } from '../state';

/** 0–100: how the board feels about the founder this quarter. */
export function boardConfidence(state: GameState, content: ContentPack): number {
  const runway = runwayMonths(state, content);
  const runwayScore = runway >= 18 ? 10 : runway >= 9 ? 4 : runway >= 4 ? -6 : -20;
  return clamp(
    50 +
      clamp(userGrowth(state) * 220, -30, 30) +
      runwayScore +
      (state.trust.investor - 50) / 2 -
      state.meters.scandal / 4 +
      (state.stats.morale - 50) / 5,
    0,
    100,
  );
}

export function boardStep(state: GameState, content: ContentPack): void {
  if (investorSeats(state) === 0) return;
  if (state.month % content.rules.boardCheckEvery !== 0) return;
  const confidence = boardConfidence(state, content);
  state.meters.boardTension = clamp(state.meters.boardTension + (50 - confidence) * 0.6, 0, 100);
  state.boardLowChecks = confidence < 40 ? state.boardLowChecks + 1 : 0;
}

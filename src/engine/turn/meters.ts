import { METER_IDS } from '../../content/schema/ids';
import { must, type ContentPack } from '../content';
import { userGrowth } from '../economy';
import { addFeed } from '../log';
import { clamp } from '../math';
import type { ResolvedMods } from '../mods';
import { randNormal } from '../rng';
import type { GameState } from '../state';

const WARNING_RESET_GAP = 15;

/** The rival grows whether or not you do; the meter's decay offsets part of it. */
const RIVAL_DRIFT = 2.6;

export function driftMeters(state: GameState, content: ContentPack, mods: ResolvedMods): void {
  const m = state.meters;
  m.burnout += mods.burnoutDrift;
  m.scandal += mods.scandalDrift;
  m.security +=
    mods.securityDrift + Math.log10(state.stats.users + 1) * 0.5 + state.stats.techDebt * 0.02;
  m.rivalThreat +=
    RIVAL_DRIFT + (state.trust.rival < 30 ? 0.8 : 0) + (userGrowth(state) > 0.08 ? 1.2 : 0);

  for (const id of METER_IDS) {
    const meter = must(content.meters, id, 'meter');
    m[id] = clamp(m[id] - meter.decay, 0, 100);
  }

  state.stats.reputation = clamp(
    state.stats.reputation + mods.reputationDrift + (state.stats.quality - 50) * 0.02,
    0,
    100,
  );
  state.marketMood = clamp(randNormal(state.rng, state.marketMood, 0.06), 0.7, 1.4);
}

/** Writes an escalating hint to the feed each time a meter crosses a warning threshold. */
export function foreshadow(state: GameState, content: ContentPack): void {
  for (const id of METER_IDS) {
    const meter = must(content.meters, id, 'meter');
    const value = state.meters[id];
    let warned = state.meterWarned[id];
    while (warned > 0 && value < (meter.warnings[warned - 1]?.at ?? 0) - WARNING_RESET_GAP) {
      warned -= 1;
    }
    while (warned < meter.warnings.length) {
      const warning = meter.warnings[warned];
      if (warning === undefined || value < warning.at) break;
      addFeed(state, content, warning.key, 'warn');
      warned += 1;
    }
    state.meterWarned[id] = warned;
  }
}

import type { Amount, Effect } from '../content/schema/logic';
import type { StatId } from '../content/schema/ids';
import type { GameState } from '../engine';

/** How much a bot personality cares about each kind of outcome. */
export interface Weights {
  cash: number;
  users: number;
  stats: Partial<Record<StatId, number>>;
  scandal: number;
  pressure: number;
  trust: number;
  delayed: number;
  ending: Record<string, number>;
}

function amountGuess(amount: Amount | undefined, state: GameState): number {
  if (amount === undefined) return 0;
  if (typeof amount === 'number') return amount;
  if ('min' in amount && !('metric' in amount)) return (amount.min + amount.max) / 2;
  if ('metric' in amount) {
    const base =
      amount.metric === 'users'
        ? state.stats.users
        : amount.metric === 'cash'
          ? state.stats.cash
          : 10_000;
    const value = base * amount.times;
    return Math.min(amount.max ?? Infinity, Math.max(amount.min ?? -Infinity, value));
  }
  return 0;
}

/** A rough, personality-weighted value for a list of effects. */
export function scoreEffects(effects: readonly Effect[], state: GameState, w: Weights): number {
  let score = 0;
  for (const e of effects) {
    switch (e.op) {
      case 'stat': {
        const delta =
          amountGuess(e.add, state) + (e.mul === undefined ? 0 : state.stats[e.stat] * (e.mul - 1));
        if (e.stat === 'cash') score += (delta / 10_000) * w.cash;
        else if (e.stat === 'users')
          score += (delta / Math.max(100, state.stats.users)) * 10 * w.users;
        else score += delta * (w.stats[e.stat] ?? 0.3);
        break;
      }
      case 'meter':
        score -= amountGuess(e.add, state) * (e.meter === 'scandal' ? w.scandal : w.pressure);
        break;
      case 'trust':
        score += amountGuess(e.add, state) * w.trust;
        break;
      case 'schedule':
        score -= w.delayed;
        break;
      case 'chance': {
        const p = Math.min(1, Math.max(0, e.p + (e.per === undefined ? 0 : 0.3)));
        score +=
          p * scoreEffects(e.then, state, w) + (1 - p) * scoreEffects(e.else ?? [], state, w);
        break;
      }
      case 'ending':
        score += w.ending[e.ending] ?? -100;
        break;
      case 'employee':
        if (e.leave === true || e.fire === true) score -= 4;
        score += amountGuess(e.mood, state) * 0.1;
        break;
      case 'cofounderLeaves':
        score -= 12;
        break;
      case 'layoff':
        score -= 10;
        break;
      case 'equity':
        score -= e.bps / 100;
        break;
      default:
        break;
    }
  }
  return score;
}

export const BASE_WEIGHTS: Weights = {
  cash: 1,
  users: 1,
  stats: { quality: 0.6, morale: 0.4, reputation: 0.6, bugs: -0.5, techDebt: -0.3, hype: 0.2 },
  scandal: 0.6,
  pressure: 0.3,
  trust: 0.3,
  delayed: 6,
  ending: { acquired: -20, acquihired: -60 },
};

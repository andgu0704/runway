import { chance, pick } from '../../engine/rng';
import type { Bot } from './types';

/** Picks uniformly among whatever is available. The baseline every strategy should beat. */
export const randomBot: Bot = {
  name: 'random',
  act(view, rng) {
    if (view.choices.length === 0 || !chance(rng, 0.85)) return null;
    return pick(rng, view.choices);
  },
  choose(_state, _content, options, rng) {
    return pick(rng, options).id;
  },
  negotiate(state, _content, rng) {
    const n = state.negotiation;
    if (n === null || chance(rng, 0.7)) return { type: 'settle' };
    return chance(rng, 0.5) ? { type: 'walkAway' } : { type: 'push', target: 'valuation' };
  },
};

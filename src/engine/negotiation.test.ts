import { describe, expect, it } from 'vitest';
import { act, content, freshRun, launchedCompany, must } from '../test/helpers';
import { applyInPlace } from './apply';
import { holderBps } from './capTable';
import { bpsFor, impliedPreMoney, reactionFor } from './negotiation';
import type { GameState } from './state';

function openAngelRound(): GameState {
  const state = freshRun();
  act(state, 'pitchAngels');
  if (state.negotiation === null) throw new Error('expected a negotiation');
  return state;
}

describe('negotiation', () => {
  it('converts between amount, equity and valuation', () => {
    expect(bpsFor(1_000_000, 4_000_000)).toBe(2000);
    expect(impliedPreMoney({ amount: 1_000_000, bps: 2000 })).toBe(4_000_000);
  });

  it('reacts worse the further the ask is above fair value', () => {
    const order = ['eager', 'keen', 'interested', 'cool', 'insulted'];
    const reactions = [0.8, 1, 1.2, 1.5, 2].map(reactionFor);
    expect(reactions).toEqual(order);
  });

  it('accepts a modest ask and closes on settle', () => {
    const state = openAngelRound();
    const n = state.negotiation!;
    const cashBefore = state.stats.cash;
    const founderBefore = holderBps(state, 'founder');
    const amount = n.offer.amount;
    const bps = bpsFor(amount, n.fairPre * 0.85);
    must(state, { type: 'negotiate', move: { type: 'propose', amount, bps } });
    expect(state.negotiation?.acceptable).toBe(true);
    must(state, { type: 'negotiate', move: { type: 'settle' } });
    expect(state.negotiation).toBeNull();
    expect(state.stats.cash).toBe(cashBefore + amount);
    expect(holderBps(state, `inv:${state.rounds[0]?.investor}`)).toBe(bps);
    expect(holderBps(state, 'founder')).toBeLessThan(founderBefore);
    expect(state.flags.angelRound).toBe(1);
  });

  it('loses patience with insulting asks until the investor walks', () => {
    const state = openAngelRound();
    const amount = state.negotiation!.offer.amount;
    for (let i = 0; i < 5 && state.negotiation !== null; i++) {
      must(state, { type: 'negotiate', move: { type: 'propose', amount, bps: 100 } });
    }
    expect(state.negotiation).toBeNull();
    expect(state.rounds).toHaveLength(0);
    expect(state.feed.some((f) => f.key === 'feed.investorWalked')).toBe(true);
  });

  it('settles on the investor offer when the last ask was not acceptable', () => {
    const state = openAngelRound();
    const offer = { ...state.negotiation!.offer };
    must(state, { type: 'negotiate', move: { type: 'settle' } });
    expect(state.rounds[0]).toMatchObject({ amount: offer.amount, bps: offer.bps });
  });

  it('adds a board seat when the deal includes one', () => {
    const state = launchedCompany();
    state.stats.users = 50_000;
    state.history.push({
      month: 0,
      cash: 0,
      users: 30_000,
      mrr: 0,
      burn: 0,
      quality: 60,
      morale: 60,
      reputation: 50,
      valuation: 0,
    });
    state.stats.cash = 500_000;
    act(state, 'raiseRound');
    const n = state.negotiation;
    expect(n).not.toBeNull();
    n!.offer.boardSeat = true;
    must(state, { type: 'negotiate', move: { type: 'settle' } });
    expect(state.board.some((s) => s.startsWith('investor:'))).toBe(true);
    expect(state.flags.pricedRound).toBe(1);
  });

  it('rejects malformed proposals', () => {
    const state = openAngelRound();
    const bad = applyInPlace(state, content, {
      type: 'negotiate',
      move: { type: 'propose', amount: -5, bps: 500 },
    });
    expect(bad).toBe('invalidTerms');
    expect(
      applyInPlace(state, content, {
        type: 'negotiate',
        move: { type: 'propose', amount: 10_000, bps: 9000 },
      }),
    ).toBe('invalidTerms');
  });
});

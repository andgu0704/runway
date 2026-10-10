import type { Investor } from '../content/schema/records';
import { holderBps, issueShares } from './capTable';
import { check } from './conditions';
import { must, type ContentPack } from './content';
import { valuation } from './economy';
import { addFeed, addTimeline } from './log';
import { clamp } from './math';
import { chance, nextFloat, pickWeighted, randRange } from './rng';
import type { GameState, NegotiationMove, Reaction, Terms } from './state';

export const MIN_BPS = 100;
export const MAX_BPS = 6000;

function roundMoney(value: number): number {
  const step = value >= 1_000_000 ? 50_000 : 5_000;
  return Math.max(step, Math.round(value / step) * step);
}

export function bpsFor(amount: number, preMoney: number): number {
  return Math.round((amount / (preMoney + amount)) * 10_000);
}

export function impliedPreMoney(terms: Pick<Terms, 'amount' | 'bps'>): number {
  return Math.round((terms.amount * 10_000) / terms.bps - terms.amount);
}

export function eligibleInvestors(
  state: GameState,
  content: ContentPack,
  pool: 'angel' | 'vc',
): Investor[] {
  const ctx = { state, content, subject: null, params: {} };
  return content.data.investors.filter(
    (inv) =>
      inv.pool === pool &&
      inv.stages.includes(state.stage) &&
      (state.investorCooldowns[inv.id] ?? -1) <= state.month &&
      check(inv.when, ctx),
  );
}

export function startNegotiation(
  state: GameState,
  content: ContentPack,
  pool: 'angel' | 'vc',
): boolean {
  const candidates = eligibleInvestors(state, content, pool);
  const investor = pickWeighted(state.rng, candidates, (inv) =>
    inv.lead ? 1 + state.trust.investor / 25 : 1,
  );
  if (investor === null) {
    addFeed(state, content, 'feed.noInvestors', 'bad');
    return false;
  }
  const value = valuation(state, content);
  const trustFactor = 0.85 + (0.3 * state.trust.investor) / 100;
  const hypeFactor = 0.9 + state.stats.hype / 250;
  const inflated = (state.flags.inflatedMetrics ?? 0) > 0 ? 1.3 : 1;
  const fairPre = Math.round(
    value *
      investor.valuationBias *
      (investor.lead ? trustFactor : 1) *
      hypeFactor *
      inflated *
      randRange(state.rng, 0.9, 1.1),
  );
  const amount = roundMoney(
    clamp(
      value * randRange(state.rng, ...investor.checkShare),
      investor.minCheck,
      investor.maxCheck,
    ),
  );
  const openingPre = fairPre * 0.85;
  state.negotiation = {
    investor: investor.id,
    fairPre,
    patience: investor.patience + (state.stats.reputation >= 60 ? 1 : 0),
    rounds: 0,
    offer: {
      amount,
      bps: bpsFor(amount, openingPre),
      boardSeat: chance(state.rng, investor.boardSeat),
    },
    lastProposal: null,
    lastReaction: null,
    acceptable: false,
  };
  addFeed(state, content, 'feed.negotiationOpened', 'neutral', { investor: investor.id });
  return true;
}

export function reactionFor(ratio: number): Reaction {
  if (ratio <= 0.9) return 'eager';
  if (ratio <= 1.05) return 'keen';
  if (ratio <= 1.25) return 'interested';
  if (ratio <= 1.6) return 'cool';
  return 'insulted';
}

function endNegotiation(state: GameState, content: ContentPack, walkedOut: boolean): void {
  const negotiation = state.negotiation;
  if (negotiation === null) return;
  state.investorCooldowns[negotiation.investor] = state.month + (walkedOut ? 6 : 3);
  const investor = must(content.investors, negotiation.investor, 'investor');
  if (investor.lead)
    state.trust.investor = clamp(state.trust.investor - (walkedOut ? 6 : 2), 0, 100);
  addFeed(state, content, walkedOut ? 'feed.investorWalked' : 'feed.youWalked', 'bad', {
    investor: investor.id,
  });
  state.negotiation = null;
}

function closeDeal(state: GameState, content: ContentPack, terms: Terms): void {
  const negotiation = state.negotiation;
  if (negotiation === null) return;
  const investor = must(content.investors, negotiation.investor, 'investor');
  if (investor.pool === 'vc') {
    const pool = holderBps(state, 'pool');
    if (pool < 800) issueShares(state, 'pool', 1000 - pool);
  }
  issueShares(state, `inv:${investor.id}`, terms.bps);
  if (terms.boardSeat) state.board.push(`investor:${investor.id}`);
  state.stats.cash += terms.amount;
  const preMoney = impliedPreMoney(terms);
  state.rounds.push({
    month: state.month,
    investor: investor.id,
    amount: terms.amount,
    bps: terms.bps,
    preMoney,
  });
  state.flags[investor.pool === 'vc' ? 'pricedRound' : 'angelRound'] = 1;
  if (investor.lead) state.trust.investor = clamp(state.trust.investor + 8, 0, 100);
  state.investorCooldowns[investor.id] = state.month + 9;
  const params = { investor: investor.id, amount: terms.amount, bps: terms.bps, preMoney };
  addFeed(state, content, 'feed.dealClosed', 'milestone', params);
  addTimeline(state, content, 'milestone', 'timeline.dealClosed', 'milestone', params);
  if (terms.boardSeat) addFeed(state, content, 'feed.boardSeatAdded', 'warn', params);
  state.negotiation = null;
}

function propose(state: GameState, content: ContentPack, amount: number, bps: number): void {
  const negotiation = state.negotiation;
  if (negotiation === null) return;
  const investor = must(content.investors, negotiation.investor, 'investor');
  const proposal: Terms = { amount, bps, boardSeat: negotiation.offer.boardSeat };
  const appetite = Math.max(1, amount / investor.maxCheck);
  const ratio = (impliedPreMoney(proposal) / negotiation.fairPre) * appetite;
  const reaction = reactionFor(ratio);
  negotiation.rounds += 1;
  negotiation.lastProposal = proposal;
  negotiation.lastReaction = reaction;
  negotiation.acceptable = reaction === 'eager' || reaction === 'keen';
  if (reaction === 'interested') {
    const counterAmount = clamp(amount, investor.minCheck, investor.maxCheck);
    negotiation.offer = {
      ...negotiation.offer,
      amount: counterAmount,
      bps: bpsFor(counterAmount, negotiation.fairPre),
    };
  } else if (reaction === 'cool') {
    negotiation.patience -= 1;
  } else if (reaction === 'insulted') {
    negotiation.patience -= 2;
    if (investor.lead) state.trust.investor = clamp(state.trust.investor - 3, 0, 100);
  }
  if (negotiation.patience <= 0) endNegotiation(state, content, true);
}

function push(state: GameState, content: ContentPack, target: 'valuation' | 'boardSeat'): void {
  const negotiation = state.negotiation;
  if (negotiation === null) return;
  const investor = must(content.investors, negotiation.investor, 'investor');
  const leverage =
    state.stats.reputation / 250 + (state.trust.investor - 50) / 200 + state.stats.hype / 400;
  negotiation.rounds += 1;
  negotiation.patience -= 1;
  if (target === 'boardSeat') {
    if (negotiation.offer.boardSeat && nextFloat(state.rng) < 0.3 + leverage) {
      negotiation.offer.boardSeat = false;
      if (negotiation.lastProposal !== null) negotiation.lastProposal.boardSeat = false;
      negotiation.lastReaction = 'interested';
    } else {
      negotiation.lastReaction = 'cool';
    }
  } else if (nextFloat(state.rng) < 0.35 + leverage) {
    negotiation.fairPre = Math.round(negotiation.fairPre * 1.06);
    const currentPre = impliedPreMoney(negotiation.offer);
    const improvedPre = Math.min(currentPre * 1.12, negotiation.fairPre * 1.1);
    negotiation.offer.bps = bpsFor(negotiation.offer.amount, improvedPre);
    negotiation.lastReaction = 'interested';
  } else {
    negotiation.lastReaction = 'cool';
    if (!negotiation.offer.boardSeat && chance(state.rng, investor.boardSeat / 2)) {
      negotiation.offer.boardSeat = true;
    }
    if (investor.lead) state.trust.investor = clamp(state.trust.investor - 2, 0, 100);
  }
  if (negotiation.patience <= 0) endNegotiation(state, content, true);
}

export function negotiate(state: GameState, content: ContentPack, move: NegotiationMove): void {
  const negotiation = state.negotiation;
  if (negotiation === null) return;
  switch (move.type) {
    case 'propose':
      propose(state, content, move.amount, move.bps);
      return;
    case 'push':
      push(state, content, move.target);
      return;
    case 'settle':
      closeDeal(
        state,
        content,
        negotiation.acceptable && negotiation.lastProposal !== null
          ? negotiation.lastProposal
          : negotiation.offer,
      );
      return;
    case 'walkAway':
      endNegotiation(state, content, false);
      return;
  }
}

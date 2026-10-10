import {
  bpsFor,
  economy,
  type ContentPack,
  type GameState,
  type NegotiationMove,
} from '../../engine';

/** A sensible negotiator: anchors near public valuation, settles once the investor is keen. */
export function sensibleNegotiation(
  state: GameState,
  content: ContentPack,
  ambition: number,
): NegotiationMove {
  const n = state.negotiation;
  if (n === null) return { type: 'walkAway' };
  if (n.acceptable || n.rounds >= 3 || n.patience <= 1) return { type: 'settle' };
  if (n.offer.boardSeat && n.rounds === 0 && state.stats.reputation >= 55) {
    return { type: 'push', target: 'boardSeat' };
  }
  const value = economy.valuation(state, content);
  const anchor = value * (ambition - n.rounds * 0.12);
  return {
    type: 'propose',
    amount: n.offer.amount,
    bps: Math.max(100, Math.min(6000, bpsFor(n.offer.amount, anchor))),
  };
}

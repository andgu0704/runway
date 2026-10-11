import type { ContentPack } from '../content';
import { businessModel, capacity, market, marketModel, priceRatio } from '../economy';
import { clamp } from '../math';
import type { ResolvedMods } from '../mods';
import type { GameState } from '../state';

/** At full pressure the rival holds this share of the market and adds this much monthly churn. */
const RIVAL_SHARE = 0.75;
const RIVAL_CHURN = 0.02;

/** Users the market can still give you once the rival has taken its share. */
export function marketRoom(state: GameState, content: ContentPack): number {
  const widened =
    market(state, content).saturation * (marketModel(state, content).saturationMul ?? 1);
  return widened * (1 - (state.meters.rivalThreat / 100) * RIVAL_SHARE);
}

export interface UserFlow {
  organic: number;
  paid: number;
  sales: number;
  churned: number;
}

export function userStep(state: GameState, content: ContentPack, mods: ResolvedMods): UserFlow {
  const flow: UserFlow = { organic: 0, paid: 0, sales: 0, churned: 0 };
  const m = market(state, content);
  const model = businessModel(state, content);
  const { quality, reputation, hype, bugs } = state.stats;

  if (mods.autoBudgetShare > 0) {
    state.settings.marketingBudget =
      Math.round((Math.max(0, state.stats.cash) * mods.autoBudgetShare) / 1000) * 1000;
  }
  state.stats.hype = clamp(hype * (1 - content.rules.hypeDecay), 0, 100);
  if (!state.product.launched) return flow;

  const users = state.stats.users;
  const ratio = priceRatio(state, content);
  const priceFactor = clamp(1 - m.priceSensitivity * (ratio - 1), 0.25, 1.4);
  const qualityFactor = Math.pow(quality / 60, 1.5);
  const reputationFactor = 0.6 + (0.8 * reputation) / 100;
  const room = marketRoom(state, content);
  const saturation = clamp(1 - users / room, 0, 1);
  const marketing = capacity(state, content, 'marketing', mods);
  const growthMul = mods.growthMul * model.growthMul;

  flow.organic =
    (users * m.virality * qualityFactor * reputationFactor +
      m.discovery * qualityFactor * reputationFactor +
      (hype * m.discovery) / 50) *
    priceFactor *
    growthMul *
    saturation *
    (1 + marketing * 0.01);

  const cac = m.cac * (1 + users / room);
  flow.paid =
    (state.settings.marketingBudget / cac) *
    mods.paidEfficiencyMul *
    (1 + marketing * 0.02) *
    priceFactor;
  flow.sales = capacity(state, content, 'sales', mods) * m.salesYield * priceFactor;

  const support = capacity(state, content, 'support', mods);
  const churnRate = clamp(
    (m.baseChurn *
      model.churnMul *
      mods.churnMul *
      (1.5 - quality / 100) *
      Math.pow(Math.max(0.7, ratio), m.priceSensitivity) +
      (bugs / m.bugTolerance) * 0.04 +
      (state.meters.rivalThreat / 100) * RIVAL_CHURN) *
      (1 - Math.min(0.3, support * 0.01)),
    0.002,
    0.6,
  );
  const lowFit = state.product.lowFitUsers;
  const lowFitChurn = Math.min(lowFit, lowFit * churnRate * 3);
  const coreChurn = Math.max(0, users - lowFit) * churnRate;
  const paidLowFitShare = clamp(1.2 - quality / 80, 0.1, 0.9);

  flow.churned = coreChurn + lowFitChurn;
  state.product.lowFitUsers = Math.max(
    0,
    Math.round(lowFit - lowFitChurn + flow.paid * paidLowFitShare),
  );
  state.stats.users = Math.max(
    0,
    Math.round(users + flow.organic + flow.paid + flow.sales - flow.churned),
  );
  state.product.lowFitUsers = Math.min(state.product.lowFitUsers, state.stats.users);
  return flow;
}

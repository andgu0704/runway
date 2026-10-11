import type { Department } from '../content/schema/ids';
import type { BusinessModel, Market, MarketModel } from '../content/schema/records';
import { must, type ContentPack } from './content';
import { clamp } from './math';
import { companyMods, employeeMods, type ResolvedMods } from './mods';
import type { Employee, GameState } from './state';

export function market(state: GameState, content: ContentPack): Market {
  return must(content.markets, state.setup.market, 'market');
}

export function businessModel(state: GameState, content: ContentPack): BusinessModel {
  return must(content.models, state.settings.model, 'model');
}

export function marketModel(state: GameState, content: ContentPack): MarketModel {
  const m = market(state, content);
  const config = m.models.find((x) => x.model === state.settings.model);
  if (config === undefined) throw new Error(`Model ${state.settings.model} not offered in ${m.id}`);
  return config;
}

export function teamSize(state: GameState): number {
  return 1 + (state.cofounderPresent ? 1 : 0) + state.team.length;
}

export function monthsEmployed(state: GameState, employee: Employee): number {
  return state.month - employee.hiredMonth;
}

function moraleFactor(state: GameState, employee: Employee | null): number {
  const morale = state.stats.morale + (employee?.mood ?? 0);
  return clamp(0.55 + morale / 200, 0.5, 1.1);
}

/** Output of one department this month, in work points. */
export function capacity(
  state: GameState,
  content: ContentPack,
  department: Department,
  mods: ResolvedMods = companyMods(state, content),
): number {
  const rules = content.rules;
  let total = 0;
  const founder = must(content.backgrounds, state.setup.background, 'background').founder;
  total += (founder[department] ?? 0) * rules.founderCapacity * moraleFactor(state, null);
  if (state.cofounderPresent && state.setup.cofounder !== null) {
    const cofounder = must(content.cofounders, state.setup.cofounder, 'cofounder');
    total += (cofounder.contributes[department] ?? 0) * rules.founderCapacity;
  }
  for (const employee of state.team) {
    const share = must(content.roles, employee.role, 'role').contributes[department] ?? 0;
    if (share === 0) continue;
    const own = employeeMods(employee, content);
    const ramp = Math.min(
      1,
      ((monthsEmployed(state, employee) + 1) / (rules.rampMonths + 1)) * own.rampMul * mods.rampMul,
    );
    const base = rules.capacityBase + rules.capacityPerSkill * employee.skill;
    total += share * base * ramp * own.capacityMul * moraleFactor(state, employee);
  }
  const overhead = clamp(1 - 0.006 * Math.max(0, teamSize(state) - 8), 0.8, 1);
  const exhaustion = 1 - Math.max(0, state.meters.burnout - 40) / 120;
  return total * mods.capacityMul * overhead * exhaustion;
}

export function payingShare(state: GameState, content: ContentPack, mods: ResolvedMods): number {
  const model = businessModel(state, content);
  const share = model.payingShare + model.qualitySlope * (state.stats.quality - 50);
  return clamp(share * mods.conversionMul, 0.002, 1);
}

export function priceRatio(state: GameState, content: ContentPack): number {
  return state.settings.price / marketModel(state, content).fairPrice;
}

export function mrr(
  state: GameState,
  content: ContentPack,
  mods: ResolvedMods = companyMods(state, content),
): number {
  if (!state.product.launched) return 0;
  const model = businessModel(state, content);
  const perUser =
    payingShare(state, content, mods) *
    state.settings.price *
    model.revenuePerUnit *
    mods.effectivePriceMul;
  return Math.round(state.stats.users * perUser);
}

export function salaries(state: GameState): number {
  let total = 0;
  for (const employee of state.team) total += employee.salary;
  return total / 12;
}

export function burn(
  state: GameState,
  content: ContentPack,
  mods: ResolvedMods = companyMods(state, content),
): number {
  const rules = content.rules;
  const m = market(state, content);
  const stage = must(content.stages, state.stage, 'stage');
  const heads = teamSize(state);
  const overheads =
    heads * (rules.toolsPerHead + stage.officePerHead) +
    rules.baseInfra +
    state.stats.users * m.infraPerUser;
  const cogs = mrr(state, content, mods) * (1 - m.grossMargin);
  return Math.round(
    salaries(state) * mods.salaryMul +
      overheads * mods.burnMul +
      cogs +
      state.settings.marketingBudget,
  );
}

export function netBurn(state: GameState, content: ContentPack): number {
  const mods = companyMods(state, content);
  return burn(state, content, mods) - mrr(state, content, mods);
}

export const RUNWAY_INFINITE = 999;

export function runwayMonths(state: GameState, content: ContentPack): number {
  const net = netBurn(state, content);
  if (net <= 0) return RUNWAY_INFINITE;
  return Math.max(0, state.stats.cash / net);
}

/** Average month-over-month user growth over the last three months. */
export function userGrowth(state: GameState): number {
  const h = state.history;
  if (h.length < 2) return 0;
  const now = h[h.length - 1];
  const then = h[Math.max(0, h.length - 4)];
  if (now === undefined || then === undefined || then.users <= 0) return 0;
  const months = now.month - then.month;
  if (months <= 0) return 0;
  return Math.pow(Math.max(now.users, 1) / then.users, 1 / months) - 1;
}

export function valuation(state: GameState, content: ContentPack): number {
  const mods = companyMods(state, content);
  const stage = must(content.stages, state.stage, 'stage');
  const m = market(state, content);
  const { quality, reputation, hype, users } = state.stats;
  const growth = userGrowth(state);
  const repFactor = 0.6 + (0.8 * reputation) / 100;

  const revenue =
    mrr(state, content, mods) *
    12 *
    stage.arrMultiple *
    clamp(1 + 5 * growth, 0.6, 2.5) *
    (0.7 + (0.6 * quality) / 100);
  const userBased = users * m.valuePerUser * repFactor * clamp(1 + 4 * growth, 0.6, 2);
  const shippedBonus = 1 + 0.08 * Math.min(state.product.shipped.length, 6);
  const floor = stage.valuationFloor * repFactor * (0.8 + hype / 250) * shippedBonus;

  const value = Math.max(revenue, userBased, floor) * state.marketMood * mods.valuationMul;
  return Math.round(value / 1000) * 1000;
}

export function founderOwnership(state: GameState): number {
  return state.capTable.find((e) => e.holder === 'founder')?.bps ?? 0;
}

export function investorSeats(state: GameState): number {
  return state.board.filter((seat) => seat.startsWith('investor:')).length;
}

/** Investors control the board when their seats outnumber everyone else's. */
export function investorControl(state: GameState): boolean {
  const investors = investorSeats(state);
  const independents = state.board.filter((s) => s === 'independent').length;
  const founderSide = state.board.length - investors - independents;
  const independentsSideWithFounder = state.stats.reputation >= 60;
  return independentsSideWithFounder
    ? investors > founderSide + independents
    : investors + independents > founderSide;
}

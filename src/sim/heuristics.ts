import { economy, type ContentPack, type GameState } from '../engine';
import type { ActionChoice } from './choices';

export interface TurnView {
  state: GameState;
  content: ContentPack;
  choices: ActionChoice[];
}

export function find(
  view: TurnView,
  action: string,
  match?: (c: ActionChoice) => boolean,
): ActionChoice | null {
  return view.choices.find((c) => c.action === action && (match === undefined || match(c))) ?? null;
}

export function runway(view: TurnView): number {
  return economy.runwayMonths(view.state, view.content);
}

export function monthlyBurn(view: TurnView): number {
  return economy.netBurn(view.state, view.content);
}

export function bestFeature(view: TurnView): ActionChoice | null {
  const options = view.choices.filter((c) => c.action === 'buildFeature');
  const value = (c: ActionChoice) => {
    const feature = view.content.features.get(c.params.feature ?? '');
    if (feature === undefined) return 0;
    return (feature.appeal * (feature.markets?.[view.state.setup.market] ?? 1)) / feature.cost;
  };
  return [...options].sort((a, b) => value(b) - value(a))[0] ?? null;
}

function candidateValue(view: TurnView, candidateId: string): number {
  const candidate = view.state.candidates.find((c) => c.id === candidateId);
  if (candidate === undefined) return -Infinity;
  const bad = [
    'brilliantJerk',
    'flightRisk',
    'moonlighter',
    'leaker',
    'burnedOut',
    'empireBuilder',
  ];
  const known = candidate.revealed.filter((t) => bad.includes(t)).length;
  return candidate.skill * 10 - known * 15 - candidate.salary / 20_000;
}

export function bestCandidate(view: TurnView, role: string): ActionChoice | null {
  const options = view.choices.filter((c) => {
    if (c.action !== 'hire') return false;
    return view.state.candidates.find((x) => x.id === c.params.candidate)?.role === role;
  });
  const sorted = [...options].sort(
    (a, b) =>
      candidateValue(view, b.params.candidate ?? '') -
      candidateValue(view, a.params.candidate ?? ''),
  );
  const best = sorted[0];
  if (best === undefined || candidateValue(view, best.params.candidate ?? '') < 10) return null;
  return best;
}

/** Hire if a candidate exists for the role, otherwise open the role. */
export function staff(view: TurnView, role: string): ActionChoice | null {
  return bestCandidate(view, role) ?? find(view, 'openRole', (c) => c.params.role === role);
}

export function count(view: TurnView, role: string): number {
  return view.state.team.filter((e) => e.role === role).length;
}

/** The role a sensible founder would hire next, given market and size. */
export function nextRole(view: TurnView): string {
  const { state } = view;
  const size = state.team.length;
  const engineers = count(view, 'engineer');
  const market = state.setup.market;
  if (state.stage === 'startup') {
    for (const vp of ['vpProduct', 'vpEngineering', 'vpMarketing', 'vpPeople']) {
      if (count(view, vp) === 0 && size >= 6) return vp;
    }
    if (market === 'saas' && count(view, 'vpSales') === 0 && size >= 10) return 'vpSales';
  }
  if (engineers < 2 || engineers < size * 0.45) return 'engineer';
  if (count(view, 'designer') === 0) return 'designer';
  if (count(view, 'marketer') < Math.ceil(size / 8)) return 'marketer';
  if (
    (market === 'saas' || market === 'hardware') &&
    count(view, 'salesRep') < Math.ceil(size / 6)
  ) {
    return 'salesRep';
  }
  if (count(view, 'support') < Math.floor(state.stats.users / 20_000) + (size > 6 ? 1 : 0))
    return 'support';
  return 'engineer';
}

export function priceTowards(view: TurnView, ratio: number): ActionChoice | null {
  const config = economy.marketModel(view.state, view.content);
  const target = config.fairPrice * ratio;
  const current = view.state.settings.price;
  if (Math.abs(current - target) / target < 0.25) return null;
  const options = view.choices.filter((c) => c.action === 'setPrice');
  return (
    [...options].sort(
      (a, b) =>
        Math.abs((a.params.amount ?? 0) - target) - Math.abs((b.params.amount ?? 0) - target),
    )[0] ?? null
  );
}

export function budgetTowards(view: TurnView, target: number): ActionChoice | null {
  const current = view.state.settings.marketingBudget;
  if (Math.abs(current - target) <= Math.max(2000, target * 0.3)) return null;
  const options = view.choices.filter((c) => c.action === 'setMarketingBudget');
  return (
    [...options].sort(
      (a, b) =>
        Math.abs((a.params.amount ?? 0) - target) - Math.abs((b.params.amount ?? 0) - target),
    )[0] ?? null
  );
}

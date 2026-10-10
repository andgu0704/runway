import {
  METER_IDS,
  STAT_IDS,
  type MetricId,
  type MeterId,
  type StatId,
} from '../content/schema/ids';
import type { ContentPack } from './content';
import {
  burn,
  founderOwnership,
  investorSeats,
  mrr,
  netBurn,
  priceRatio,
  runwayMonths,
  teamSize,
  userGrowth,
  valuation,
} from './economy';
import type { GameState } from './state';

/** Months since an event that has never happened. */
const NEVER = 999;

const statSet = new Set<string>(STAT_IDS);
const meterSet = new Set<string>(METER_IDS);

function isStat(id: string): id is StatId {
  return statSet.has(id);
}

function isMeter(id: string): id is MeterId {
  return meterSet.has(id);
}

function lastRaiseMonth(state: GameState): number | null {
  const last = state.rounds[state.rounds.length - 1];
  return last === undefined ? null : last.month;
}

export function metric(state: GameState, content: ContentPack, id: MetricId): number {
  if (isStat(id)) return state.stats[id];
  if (isMeter(id)) return state.meters[id];
  switch (id) {
    case 'teamSize':
      return teamSize(state);
    case 'employees':
      return state.team.length;
    case 'engineers':
      return state.team.filter((e) => e.role === 'engineer').length;
    case 'executives':
      return state.team.filter((e) => content.roles.get(e.role)?.kind === 'executive').length;
    case 'mrr':
      return mrr(state, content);
    case 'burn':
      return burn(state, content);
    case 'netBurn':
      return netBurn(state, content);
    case 'runwayMonths':
      return runwayMonths(state, content);
    case 'valuation':
      return valuation(state, content);
    case 'founderOwnership':
      return founderOwnership(state);
    case 'month':
      return state.month;
    case 'userGrowth':
      return userGrowth(state);
    case 'priceRatio':
      return priceRatio(state, content);
    case 'marketingBudget':
      return state.settings.marketingBudget;
    case 'featuresShipped':
      return state.product.shipped.length;
    case 'roadmapLength':
      return state.product.roadmap.length;
    case 'investorSeats':
      return investorSeats(state);
    case 'monthsSinceRaise': {
      const last = lastRaiseMonth(state);
      return last === null ? NEVER : state.month - last;
    }
    case 'monthsSinceLaunch':
      return state.product.launchMonth === null ? 0 : state.month - state.product.launchMonth;
    case 'candidates':
      return state.candidates.length;
  }
}

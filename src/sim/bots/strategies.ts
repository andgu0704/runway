import { economy } from '../../engine';
import type { ActionChoice } from '../choices';
import {
  bestFeature,
  budgetTowards,
  count,
  find,
  monthlyBurn,
  nextRole,
  priceTowards,
  runway,
  staff,
  type TurnView,
} from '../heuristics';
import { priorityBot } from './personality';

type Intent = (view: TurnView) => ActionChoice | null;

const buildIfIdle: Intent = (v) => (v.state.product.roadmap.length === 0 ? bestFeature(v) : null);
const launchWhen =
  (quality: number): Intent =>
  (v) =>
    v.state.stats.quality >= quality ? find(v, 'launch') : null;
const angelsWhen =
  (months: number): Intent =>
  (v) =>
    v.state.rounds.length === 0 && runway(v) < months ? find(v, 'pitchAngels') : null;
const raiseWhen =
  (months: number): Intent =>
  (v) =>
    runway(v) < months ? (find(v, 'raiseRound') ?? find(v, 'callInAFavour')) : null;
const bugsAbove =
  (share: number): Intent =>
  (v) =>
    v.state.stats.bugs > economy.market(v.state, v.content).bugTolerance * share
      ? find(v, 'bugBash')
      : null;
const debtAbove =
  (level: number): Intent =>
  (v) =>
    v.state.stats.techDebt > level ? find(v, 'refactor') : null;
const secureAbove =
  (level: number): Intent =>
  (v) =>
    v.state.meters.security >= level ? find(v, 'securityReview') : null;
/** A company that cannot build anything raises a little and hires an engineer first. */
const buildersFirst: Intent = (v) => {
  if (economy.capacity(v.state, v.content, 'engineering') >= 6) return null;
  if (v.state.rounds.length === 0) {
    const angels = find(v, 'pitchAngels');
    if (angels !== null) return angels;
  }
  const salary = (v.content.roles.get('engineer')?.salary[1] ?? 150_000) / 12;
  return v.state.stats.cash > salary * 4 ? staff(v, 'engineer') : null;
};
const careWhen: Intent = (v) =>
  v.state.meters.burnout >= 40 || v.state.stats.morale < 45 ? find(v, 'teamOffsite') : null;
const hireIfRunway =
  (months: number, maxTeam = 60): Intent =>
  (v) => {
    if (v.state.team.length >= maxTeam) return null;
    const role = nextRole(v);
    const roleDef = v.content.roles.get(role);
    const extra = ((roleDef?.salary[1] ?? 150_000) / 12) * 1.1;
    const net = Math.max(1, monthlyBurn(v) + extra);
    if (v.state.stats.cash / net < months && monthlyBurn(v) + extra > 0) return null;
    return staff(v, role);
  };
const marketing =
  (share: number, minQuality: number): Intent =>
  (v) => {
    if (!v.state.product.launched || count(v, 'vpMarketing') > 0) return null;
    const target =
      v.state.stats.quality >= minQuality ? Math.max(0, v.state.stats.cash) * share : 0;
    return budgetTowards(v, Math.round(target / 1000) * 1000);
  };
const pricing =
  (ratio: number): Intent =>
  (v) =>
    v.state.product.launched ? priceTowards(v, ratio) : null;
const shady: Intent = (v) =>
  find(v, 'spamGrowthHack') ??
  find(v, 'fakeReviews') ??
  find(v, 'inflateMetrics') ??
  find(v, 'sellUserData');
const relationships: Intent = (v) => {
  if (v.state.cofounderPresent && v.state.trust.cofounder < 55) return find(v, 'cofounderTalk');
  if (v.state.rounds.length > 0 && v.state.trust.investor < 50) return find(v, 'investorUpdate');
  if (v.state.meters.boardTension > 40) return find(v, 'boardDinner');
  return null;
};
const once =
  (action: string, minCash: number): Intent =>
  (v) =>
    v.state.stats.cash >= minCash ? find(v, action) : null;
const filler: Intent = (v) =>
  find(v, 'userInterviews') ??
  find(v, 'designSprint') ??
  find(v, 'allNighter') ??
  find(v, 'coffeeWithJournalist');

/** Careful, sustainable play: the stand-in for a skilled human. */
export const balancedBot = priorityBot(
  'balanced',
  [
    buildIfIdle,
    buildersFirst,
    launchWhen(40),
    angelsWhen(10),
    raiseWhen(9),
    secureAbove(45),
    bugsAbove(0.35),
    debtAbove(45),
    careWhen,
    relationships,
    hireIfRunway(12),
    pricing(1.05),
    marketing(0.04, 50),
    once('writeValues', 0),
    once('retainLawyer', 150_000),
    filler,
  ],
  1.15,
);

/** Hires and spends ahead of revenue, raises constantly, crunches. */
export const growthBot = priorityBot(
  'growth',
  [
    buildIfIdle,
    launchWhen(25),
    angelsWhen(30),
    raiseWhen(30),
    hireIfRunway(4),
    marketing(0.12, 0),
    (v) => find(v, 'crunch'),
    pricing(0.8),
    filler,
  ],
  1.4,
);

/** Spends as little as possible and rarely hires. */
export const frugalBot = priorityBot(
  'frugal',
  [
    buildIfIdle,
    launchWhen(45),
    angelsWhen(5),
    raiseWhen(5),
    bugsAbove(0.2),
    debtAbove(30),
    secureAbove(60),
    hireIfRunway(24, 8),
    pricing(1.2),
    marketing(0.01, 60),
    filler,
  ],
  1.0,
);

/** Takes every shortcut on offer. */
export const shadyBot = priorityBot(
  'shady',
  [
    buildIfIdle,
    buildersFirst,
    launchWhen(30),
    shady,
    angelsWhen(12),
    raiseWhen(10),
    hireIfRunway(10),
    marketing(0.05, 30),
    bugsAbove(0.5),
    filler,
  ],
  1.3,
);

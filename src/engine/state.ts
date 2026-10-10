import type { CharacterId, MeterId, StatId, Tone } from '../content/schema/ids';
import type { Mods } from '../content/schema/mods';
import type { RngState } from './rng';

export const STATE_SCHEMA_VERSION = 1;

/** Message parameters are raw values; the app formats them for display. */
export type MessageParams = Record<string, string | number>;

export interface Cause {
  month: number;
  key: string;
  params: MessageParams;
}

export interface FeedEntry {
  id: number;
  month: number;
  key: string;
  params: MessageParams;
  tone: Tone;
  /** Picks a wording variant; the renderer uses `variant % variants.length`. */
  variant: number;
  cause?: Cause;
}

export type TimelineKind = 'decision' | 'consequence' | 'milestone';

export interface TimelineEntry {
  id: number;
  month: number;
  kind: TimelineKind;
  key: string;
  params: MessageParams;
  tone: Tone;
  cause?: Cause;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  skill: number;
  /** Annual salary in dollars. */
  salary: number;
  traits: string[];
  revealed: string[];
  equityBps: number;
  hiredMonth: number;
  /** Personal mood offset added to company morale, -40..40. */
  mood: number;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  skill: number;
  salary: number;
  equityBps: number;
  traits: string[];
  revealed: string[];
  expires: number;
}

export interface RoadmapItem {
  feature: string;
  progress: number;
}

export interface CapEntry {
  holder: string;
  bps: number;
}

export type BoardHolder = 'founder' | 'cofounder' | 'independent' | `investor:${string}`;

export interface FundingRound {
  month: number;
  investor: string;
  amount: number;
  bps: number;
  preMoney: number;
}

export type Reaction = 'insulted' | 'cool' | 'interested' | 'keen' | 'eager';

export interface Terms {
  amount: number;
  bps: number;
  boardSeat: boolean;
}

export interface NegotiationState {
  investor: string;
  /** Hidden: the pre-money valuation this investor considers fair. */
  fairPre: number;
  patience: number;
  rounds: number;
  offer: Terms;
  lastProposal: Terms | null;
  lastReaction: Reaction | null;
  /** True when the investor would sign `lastProposal` as is. */
  acceptable: boolean;
}

export interface ScheduledConsequence {
  id: number;
  due: number;
  consequence: string;
  cause: Cause;
}

export interface PendingEvent {
  event: string;
  subject: string | null;
  cause: Cause | null;
}

export interface Boost {
  id: string;
  until: number;
  mods: Mods;
}

export interface MonthSnapshot {
  month: number;
  cash: number;
  users: number;
  mrr: number;
  burn: number;
  quality: number;
  morale: number;
  reputation: number;
  valuation: number;
}

export interface EndingState {
  id: string;
  month: number;
  valuation: number;
  ownershipBps: number;
  netWorth: number;
  legacy: number;
  score: number;
  headline: number;
}

export interface RunSetup {
  founderName: string;
  companyName: string;
  background: string;
  market: string;
  model: string;
  cofounder: string | null;
}

export interface GameState {
  schema: number;
  seed: number;
  rng: RngState;
  nextId: number;
  setup: RunSetup;
  month: number;
  stage: string;
  ap: { used: number; max: number };
  stats: Record<StatId, number>;
  meters: Record<MeterId, number>;
  meterWarned: Record<MeterId, number>;
  marketMood: number;
  settings: {
    price: number;
    marketingBudget: number;
    model: string;
    policies: string[];
    orders: Record<string, string>;
  };
  product: {
    launched: boolean;
    launchMonth: number | null;
    roadmap: RoadmapItem[];
    shipped: string[];
    lowFitUsers: number;
    waitlist: number;
  };
  team: Employee[];
  candidates: Candidate[];
  cofounderPresent: boolean;
  trust: Record<CharacterId, number>;
  capTable: CapEntry[];
  board: BoardHolder[];
  rounds: FundingRound[];
  investorCooldowns: Record<string, number>;
  negotiation: NegotiationState | null;
  flags: Record<string, number>;
  boosts: Boost[];
  scheduled: ScheduledConsequence[];
  pendingEvent: PendingEvent | null;
  eventLastSeen: Record<string, number>;
  actionLastUsed: Record<string, number>;
  boardLowChecks: number;
  history: MonthSnapshot[];
  feed: FeedEntry[];
  timeline: TimelineEntry[];
  ending: EndingState | null;
}

export type ActionParams = {
  feature?: string;
  candidate?: string;
  employee?: string;
  role?: string;
  policy?: string;
  character?: CharacterId;
  amount?: number;
  model?: string;
  order?: { role: string; order: string };
};

export type NegotiationMove =
  | { type: 'propose'; amount: number; bps: number }
  | { type: 'push'; target: 'valuation' | 'boardSeat' }
  | { type: 'settle' }
  | { type: 'walkAway' };

export type Command =
  | { type: 'performAction'; action: string; params?: ActionParams }
  | { type: 'resolveEvent'; option: string }
  | { type: 'negotiate'; move: NegotiationMove }
  | { type: 'endTurn' }
  | { type: 'abandon' };

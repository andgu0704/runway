import { z } from 'zod';
import { CHARACTER_IDS, METER_IDS, STAT_IDS, TONES } from '../content/schema/ids';
import { modsSchema } from '../content/schema/mods';

const record = <K extends readonly [string, ...string[]]>(keys: K) =>
  z.object(Object.fromEntries(keys.map((k) => [k, z.number()])) as Record<K[number], z.ZodNumber>);

const params = z.record(z.string(), z.union([z.string(), z.number()]));
const cause = z.object({ month: z.number(), key: z.string(), params });
const tone = z.enum(TONES);

const person = {
  id: z.string(),
  name: z.string(),
  role: z.string(),
  skill: z.number(),
  salary: z.number(),
  traits: z.array(z.string()),
  revealed: z.array(z.string()),
  equityBps: z.number(),
};

const terms = z.object({ amount: z.number(), bps: z.number(), boardSeat: z.boolean() });

/** Structural check of a saved GameState; content ids are checked separately. */
export const gameStateSchema = z.object({
  schema: z.number().int(),
  seed: z.number(),
  rng: z.object({ a: z.number(), b: z.number(), c: z.number(), d: z.number() }),
  nextId: z.number().int(),
  setup: z.object({
    founderName: z.string(),
    companyName: z.string(),
    background: z.string(),
    market: z.string(),
    model: z.string(),
    cofounder: z.string().nullable(),
  }),
  month: z.number().int(),
  stage: z.string(),
  ap: z.object({ used: z.number(), max: z.number() }),
  stats: record(STAT_IDS),
  meters: record(METER_IDS),
  meterWarned: record(METER_IDS),
  marketMood: z.number(),
  settings: z.object({
    price: z.number(),
    marketingBudget: z.number(),
    model: z.string(),
    policies: z.array(z.string()),
    orders: z.record(z.string(), z.string()),
  }),
  product: z.object({
    launched: z.boolean(),
    launchMonth: z.number().nullable(),
    roadmap: z.array(z.object({ feature: z.string(), progress: z.number() })),
    shipped: z.array(z.string()),
    lowFitUsers: z.number(),
    waitlist: z.number(),
  }),
  team: z.array(z.object({ ...person, hiredMonth: z.number(), mood: z.number() })),
  candidates: z.array(z.object({ ...person, expires: z.number() })),
  cofounderPresent: z.boolean(),
  trust: record(CHARACTER_IDS),
  capTable: z.array(z.object({ holder: z.string(), bps: z.number() })),
  board: z.array(z.string()),
  rounds: z.array(
    z.object({
      month: z.number(),
      investor: z.string(),
      amount: z.number(),
      bps: z.number(),
      preMoney: z.number(),
    }),
  ),
  investorCooldowns: z.record(z.string(), z.number()),
  negotiation: z
    .object({
      investor: z.string(),
      fairPre: z.number(),
      patience: z.number(),
      rounds: z.number(),
      offer: terms,
      lastProposal: terms.nullable(),
      lastReaction: z.enum(['insulted', 'cool', 'interested', 'keen', 'eager']).nullable(),
      acceptable: z.boolean(),
    })
    .nullable(),
  flags: z.record(z.string(), z.number()),
  boosts: z.array(z.object({ id: z.string(), until: z.number(), mods: modsSchema })),
  scheduled: z.array(z.object({ id: z.number(), due: z.number(), consequence: z.string(), cause })),
  pendingEvent: z
    .object({ event: z.string(), subject: z.string().nullable(), cause: cause.nullable() })
    .nullable(),
  eventLastSeen: z.record(z.string(), z.number()),
  actionLastUsed: z.record(z.string(), z.number()),
  boardLowChecks: z.number(),
  history: z.array(
    z.object({
      month: z.number(),
      cash: z.number(),
      users: z.number(),
      mrr: z.number(),
      burn: z.number(),
      quality: z.number(),
      morale: z.number(),
      reputation: z.number(),
      valuation: z.number(),
    }),
  ),
  feed: z.array(
    z.object({
      id: z.number(),
      month: z.number(),
      key: z.string(),
      params,
      tone,
      variant: z.number(),
      cause: cause.optional(),
    }),
  ),
  timeline: z.array(
    z.object({
      id: z.number(),
      month: z.number(),
      kind: z.enum(['decision', 'consequence', 'milestone']),
      key: z.string(),
      params,
      tone,
      cause: cause.optional(),
    }),
  ),
  ending: z
    .object({
      id: z.string(),
      month: z.number(),
      valuation: z.number(),
      ownershipBps: z.number(),
      netWorth: z.number(),
      legacy: z.number(),
      score: z.number(),
      headline: z.number(),
    })
    .nullable(),
});

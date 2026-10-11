import { z } from 'zod';
import {
  characterIdSchema,
  departmentSchema,
  idSchema,
  meterIdSchema,
  statIdSchema,
  tabSchema,
  toneSchema,
} from './ids';
import { amountSchema, conditionSchema, effectSchema } from './logic';
import { modsSchema } from './mods';

const contributionSchema = z.partialRecord(departmentSchema, z.number().nonnegative());
const intRange = z.tuple([z.number().int(), z.number().int()]);

export const rulesSchema = z
  .object({
    startCash: z.number().int().positive(),
    baseActionPoints: z.number().int().positive(),
    maxMonths: z.number().int().positive(),
    feedCap: z.number().int().positive(),
    randomEventChance: z.number().min(0).max(1),
    eventCooldownDefault: z.number().int().nonnegative(),
    toolsPerHead: z.number().nonnegative(),
    baseInfra: z.number().nonnegative(),
    candidateLifetime: z.number().int().positive(),
    boardCheckEvery: z.number().int().positive(),
    resignBase: z.number().min(0).max(1),
    rampMonths: z.number().int().nonnegative(),
    founderCapacity: z.number().nonnegative(),
    capacityPerSkill: z.number().positive(),
    capacityBase: z.number().nonnegative(),
    baseBugShare: z.number().min(0).max(1),
    bugsPerPoint: z.number().nonnegative(),
    bugFixPerPoint: z.number().nonnegative(),
    hypeDecay: z.number().min(0).max(1),
    severanceMonths: z.number().nonnegative(),
    endings: z.object({ bankrupt: idSchema, timeUp: idSchema, abandoned: idSchema }).strict(),
  })
  .strict();

export const businessModelSchema = z
  .object({
    id: idSchema,
    growthMul: z.number().positive(),
    churnMul: z.number().positive(),
    /** Share of users who pay at quality 50; rises with quality by `qualitySlope` per point. */
    payingShare: z.number().min(0).max(1),
    qualitySlope: z.number().nonnegative(),
    priceUnit: z.enum(['perMonth', 'percent', 'perThousand']),
    /** Revenue per paying user per unit of price (e.g. GMV share for take rates). */
    revenuePerUnit: z.number().positive(),
  })
  .strict();

export const marketModelSchema = z
  .object({
    model: idSchema,
    fairPrice: z.number().positive(),
    priceMin: z.number().positive(),
    priceMax: z.number().positive(),
    priceStep: z.number().positive(),
    /** A free tier widens the market; each user is then worth less. */
    saturationMul: z.number().positive().optional(),
    userValueMul: z.number().positive().optional(),
  })
  .strict();

export const marketSchema = z
  .object({
    id: idSchema,
    virality: z.number().nonnegative(),
    baseChurn: z.number().min(0).max(1),
    cac: z.number().positive(),
    discovery: z.number().nonnegative(),
    launchUsers: z.number().int().nonnegative(),
    saturation: z.number().positive(),
    infraPerUser: z.number().nonnegative(),
    grossMargin: z.number().min(0).max(1),
    valuePerUser: z.number().nonnegative(),
    bugTolerance: z.number().positive(),
    priceSensitivity: z.number().nonnegative(),
    /** New customers per point of sales capacity per month. */
    salesYield: z.number().nonnegative(),
    models: z.array(marketModelSchema).min(1),
    rivalCompany: z.string().min(1),
  })
  .strict();

export const backgroundSchema = z
  .object({
    id: idSchema,
    mods: modsSchema,
    founder: contributionSchema,
    startStats: z.partialRecord(statIdSchema, z.number()),
    startTrust: z.partialRecord(characterIdSchema, z.number()),
    uniqueAction: idSchema,
  })
  .strict();

export const cofounderSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    contributes: contributionSchema,
    equityBps: z.number().int().positive(),
    startTrust: z.number().min(0).max(100),
    mods: modsSchema,
  })
  .strict();

export const stageSchema = z
  .object({
    id: idSchema,
    order: z.number().int().nonnegative(),
    entry: conditionSchema.nullable(),
    ending: idSchema.optional(),
    arrMultiple: z.number().positive(),
    valuationFloor: z.number().nonnegative(),
    officePerHead: z.number().nonnegative(),
    salaryMul: z.number().positive(),
    actionPoints: z.number().int().positive(),
  })
  .strict();

export const featureSchema = z
  .object({
    id: idSchema,
    cost: z.number().positive(),
    appeal: z.number().nonnegative(),
    bugRate: z.number().nonnegative(),
    techDebt: z.number().nonnegative(),
    mvp: z.boolean().optional(),
    /** Can be built again after shipping, e.g. a major update. */
    repeatable: z.boolean().optional(),
    markets: z.record(idSchema, z.number().nonnegative()).optional(),
    requires: conditionSchema.optional(),
    onShip: z.array(effectSchema).optional(),
  })
  .strict();

export const orderSchema = z.object({ id: idSchema, mods: modsSchema }).strict();

export const roleSchema = z
  .object({
    id: idSchema,
    kind: z.enum(['ic', 'executive']),
    contributes: contributionSchema,
    salary: intRange,
    equityAsk: intRange,
    minStage: idSchema,
    orders: z.array(orderSchema).optional(),
    defaultOrder: idSchema.optional(),
  })
  .strict();

export const traitSchema = z
  .object({
    id: idSchema,
    roles: z.array(idSchema).optional(),
    hidden: z.boolean(),
    weight: z.number().positive(),
    self: modsSchema,
    team: modsSchema,
    skill: z.number().int().optional(),
  })
  .strict();

export const policySchema = z
  .object({ id: idSchema, minStage: idSchema, mods: modsSchema })
  .strict();

export const meterSchema = z
  .object({
    id: meterIdSchema,
    decay: z.number().nonnegative(),
    warnings: z
      .array(z.object({ at: z.number().min(0).max(100), key: z.string() }).strict())
      .min(1),
  })
  .strict();

export const characterTierSchema = z
  .object({ min: z.number(), minStage: idSchema.optional(), mods: modsSchema })
  .strict();

export const characterSchema = z
  .object({
    id: characterIdSchema,
    name: z.string().min(1),
    startTrust: z.number().min(0).max(100),
    tiers: z.array(characterTierSchema),
  })
  .strict();

export const investorSchema = z
  .object({
    id: idSchema,
    pool: z.enum(['angel', 'vc']),
    stages: z.array(idSchema).min(1),
    lead: z.boolean(),
    checkShare: z.tuple([z.number().positive(), z.number().positive()]),
    minCheck: z.number().positive(),
    maxCheck: z.number().positive(),
    valuationBias: z.number().positive(),
    patience: z.number().int().positive(),
    boardSeat: z.number().min(0).max(1),
    when: conditionSchema.optional(),
  })
  .strict();

export const paramSpecSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('feature') }).strict(),
  z.object({ kind: z.literal('candidate') }).strict(),
  z.object({ kind: z.literal('employee'), roles: z.array(idSchema).optional() }).strict(),
  z.object({ kind: z.literal('role') }).strict(),
  z.object({ kind: z.literal('policy') }).strict(),
  z.object({ kind: z.literal('character') }).strict(),
  z.object({ kind: z.literal('price') }).strict(),
  z.object({ kind: z.literal('budget') }).strict(),
  z.object({ kind: z.literal('model') }).strict(),
  z.object({ kind: z.literal('order') }).strict(),
]);

export const actionSchema = z
  .object({
    id: idSchema,
    tab: tabSchema,
    ap: z.number().int().nonnegative(),
    cost: amountSchema.optional(),
    minStage: idSchema,
    maxStage: idSchema.optional(),
    when: conditionSchema.optional(),
    visibleWhen: conditionSchema.optional(),
    param: paramSpecSchema.optional(),
    effects: z.array(effectSchema).min(1),
    cooldown: z.number().int().nonnegative().optional(),
    once: z.boolean().optional(),
    shady: z.boolean().optional(),
    timeline: z.boolean().optional(),
  })
  .strict();

export const eventTriggerSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('random'),
      weight: z.number().positive(),
      when: conditionSchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('meter'),
      meter: meterIdSchema,
      at: z.number().min(0).max(100),
      weight: z.number().positive(),
      when: conditionSchema.optional(),
    })
    .strict(),
  z.object({ kind: z.literal('scheduled') }).strict(),
  z.object({ kind: z.literal('urgent'), when: conditionSchema }).strict(),
]);

export const subjectSpecSchema = z
  .object({ roles: z.array(idSchema).optional(), trait: idSchema.optional() })
  .strict();

export const eventOptionSchema = z
  .object({
    id: idSchema,
    requires: conditionSchema.optional(),
    visibleWhen: conditionSchema.optional(),
    effects: z.array(effectSchema),
  })
  .strict();

export const eventSchema = z
  .object({
    id: idSchema,
    tone: toneSchema,
    trigger: eventTriggerSchema,
    minStage: idSchema,
    once: z.boolean().optional(),
    cooldown: z.number().int().nonnegative().optional(),
    subject: subjectSpecSchema.optional(),
    disaster: z.boolean().optional(),
    /** If cash is still negative after this event is resolved, the company is bankrupt. */
    lastChance: z.boolean().optional(),
    options: z.array(eventOptionSchema).min(3).max(4),
  })
  .strict();

export const consequenceSchema = z
  .object({
    id: idSchema,
    effects: z.array(effectSchema),
    event: idSchema.optional(),
    tone: toneSchema,
  })
  .strict();

export const endingSchema = z
  .object({
    id: idSchema,
    kind: z.enum(['failure', 'exit', 'success']),
    keepsEquityValue: z.boolean(),
  })
  .strict();

export const namesSchema = z
  .object({ first: z.array(z.string()).min(20), last: z.array(z.string()).min(20) })
  .strict();

export const contentPackSchema = z
  .object({
    rules: rulesSchema,
    models: z.array(businessModelSchema),
    markets: z.array(marketSchema),
    backgrounds: z.array(backgroundSchema),
    cofounders: z.array(cofounderSchema),
    stages: z.array(stageSchema),
    features: z.array(featureSchema),
    roles: z.array(roleSchema),
    traits: z.array(traitSchema),
    policies: z.array(policySchema),
    meters: z.array(meterSchema),
    characters: z.array(characterSchema),
    investors: z.array(investorSchema),
    actions: z.array(actionSchema),
    events: z.array(eventSchema),
    consequences: z.array(consequenceSchema),
    endings: z.array(endingSchema),
    names: namesSchema,
  })
  .strict();

export type Rules = z.infer<typeof rulesSchema>;
export type BusinessModel = z.infer<typeof businessModelSchema>;
export type Market = z.infer<typeof marketSchema>;
export type MarketModel = z.infer<typeof marketModelSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type Cofounder = z.infer<typeof cofounderSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type Feature = z.infer<typeof featureSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Trait = z.infer<typeof traitSchema>;
export type Policy = z.infer<typeof policySchema>;
export type Meter = z.infer<typeof meterSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Investor = z.infer<typeof investorSchema>;
export type ParamSpec = z.infer<typeof paramSpecSchema>;
export type Action = z.infer<typeof actionSchema>;
export type GameEvent = z.infer<typeof eventSchema>;
export type EventOption = z.infer<typeof eventOptionSchema>;
export type Consequence = z.infer<typeof consequenceSchema>;
export type Ending = z.infer<typeof endingSchema>;
export type ContentPackData = z.infer<typeof contentPackSchema>;

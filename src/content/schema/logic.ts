import { z } from 'zod';
import {
  characterIdSchema,
  idSchema,
  meterIdSchema,
  metricIdSchema,
  statIdSchema,
  toneSchema,
  type CharacterId,
  type MeterId,
  type MetricId,
  type StatId,
  type Tone,
} from './ids';
import { modsSchema, type Mods } from './mods';

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { metric: MetricId; gte?: number; lte?: number }
  | { flag: string; is?: boolean; gte?: number }
  | { trust: CharacterId; gte?: number; lte?: number }
  | { stage: string[] }
  | { stageAtLeast: string }
  | { hasRole: string; count?: number }
  | { hasTrait: string }
  | { policy: string }
  | { market: string[] }
  | { background: string[] }
  | { model: string[] }
  | { launched: boolean }
  | { cofounder: boolean }
  | { shipped: string }
  | { subjectRole: string[] }
  | { subjectTrait: string }
  | { investorControl: boolean };

const range = { gte: z.number().optional(), lte: z.number().optional() };

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(conditionSchema).min(1) }).strict(),
    z.object({ any: z.array(conditionSchema).min(1) }).strict(),
    z.object({ not: conditionSchema }).strict(),
    z.object({ metric: metricIdSchema, ...range }).strict(),
    z.object({ flag: idSchema, is: z.boolean().optional(), gte: z.number().optional() }).strict(),
    z.object({ trust: characterIdSchema, ...range }).strict(),
    z.object({ stage: z.array(idSchema).min(1) }).strict(),
    z.object({ stageAtLeast: idSchema }).strict(),
    z.object({ hasRole: idSchema, count: z.number().int().positive().optional() }).strict(),
    z.object({ hasTrait: idSchema }).strict(),
    z.object({ policy: idSchema }).strict(),
    z.object({ market: z.array(idSchema).min(1) }).strict(),
    z.object({ background: z.array(idSchema).min(1) }).strict(),
    z.object({ model: z.array(idSchema).min(1) }).strict(),
    z.object({ launched: z.boolean() }).strict(),
    z.object({ cofounder: z.boolean() }).strict(),
    z.object({ shipped: idSchema }).strict(),
    z.object({ subjectRole: z.array(idSchema).min(1) }).strict(),
    z.object({ subjectTrait: idSchema }).strict(),
    z.object({ investorControl: z.boolean() }).strict(),
  ]),
) as z.ZodType<Condition>;

/** A number, a uniform range, or a value scaled from a metric. */
export type Amount =
  | number
  | { min: number; max: number }
  | { metric: MetricId; times: number; min?: number; max?: number };

export const amountSchema: z.ZodType<Amount> = z.union([
  z.number(),
  z.object({ min: z.number(), max: z.number() }).strict(),
  z
    .object({
      metric: metricIdSchema,
      times: z.number(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .strict(),
]) as z.ZodType<Amount>;

export type SettingId = 'price' | 'marketingBudget' | 'model';
export type EmployeeTarget = 'param' | 'subject' | 'all' | 'random';

export type Effect =
  | { op: 'stat'; stat: StatId; add?: Amount; mul?: number }
  | { op: 'meter'; meter: MeterId; add: Amount }
  | { op: 'flag'; flag: string; set?: boolean | number; add?: number }
  | { op: 'trust'; character: CharacterId; add: Amount }
  | { op: 'schedule'; consequence: string; in: Amount }
  | {
      op: 'chance';
      p: number;
      per?: { metric: MetricId; slope: number };
      then: Effect[];
      else?: Effect[];
    }
  | { op: 'feed'; key: string; tone: Tone; params?: Record<string, MetricId> }
  | { op: 'boost'; id: string; months: number; mods: Mods }
  | {
      op: 'employee';
      target: EmployeeTarget;
      mood?: Amount;
      salaryMul?: number;
      reveal?: boolean;
      equityBps?: number;
      leave?: boolean;
      fire?: boolean;
    }
  | { op: 'layoff'; share: number }
  | { op: 'hire' }
  | { op: 'candidates'; role?: string; count: number }
  | { op: 'queueFeature' }
  | { op: 'progress'; add: Amount }
  | { op: 'launch' }
  | { op: 'setting'; setting: SettingId }
  | { op: 'policy' }
  | { op: 'order' }
  | { op: 'negotiate'; pool: 'angel' | 'vc' }
  | { op: 'ending'; ending: string; valueMul?: number }
  | { op: 'equity'; holder: string; bps: number }
  | { op: 'ap'; add: number }
  | { op: 'cofounderLeaves' };

export const effectSchema: z.ZodType<Effect> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z
      .object({
        op: z.literal('stat'),
        stat: statIdSchema,
        add: amountSchema.optional(),
        mul: z.number().optional(),
      })
      .strict(),
    z.object({ op: z.literal('meter'), meter: meterIdSchema, add: amountSchema }).strict(),
    z
      .object({
        op: z.literal('flag'),
        flag: idSchema,
        set: z.union([z.boolean(), z.number()]).optional(),
        add: z.number().optional(),
      })
      .strict(),
    z.object({ op: z.literal('trust'), character: characterIdSchema, add: amountSchema }).strict(),
    z.object({ op: z.literal('schedule'), consequence: idSchema, in: amountSchema }).strict(),
    z
      .object({
        op: z.literal('chance'),
        p: z.number(),
        per: z.object({ metric: metricIdSchema, slope: z.number() }).strict().optional(),
        then: z.array(effectSchema),
        else: z.array(effectSchema).optional(),
      })
      .strict(),
    z
      .object({
        op: z.literal('feed'),
        key: z.string().min(1),
        tone: toneSchema,
        params: z.record(z.string(), metricIdSchema).optional(),
      })
      .strict(),
    z
      .object({
        op: z.literal('boost'),
        id: idSchema,
        months: z.number().int().positive(),
        mods: modsSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal('employee'),
        target: z.enum(['param', 'subject', 'all', 'random']),
        mood: amountSchema.optional(),
        salaryMul: z.number().positive().optional(),
        reveal: z.boolean().optional(),
        equityBps: z.number().int().positive().optional(),
        leave: z.boolean().optional(),
        fire: z.boolean().optional(),
      })
      .strict(),
    z.object({ op: z.literal('layoff'), share: z.number().min(0).max(1) }).strict(),
    z.object({ op: z.literal('hire') }).strict(),
    z
      .object({
        op: z.literal('candidates'),
        role: idSchema.optional(),
        count: z.number().int().positive(),
      })
      .strict(),
    z.object({ op: z.literal('queueFeature') }).strict(),
    z.object({ op: z.literal('progress'), add: amountSchema }).strict(),
    z.object({ op: z.literal('launch') }).strict(),
    z
      .object({ op: z.literal('setting'), setting: z.enum(['price', 'marketingBudget', 'model']) })
      .strict(),
    z.object({ op: z.literal('policy') }).strict(),
    z.object({ op: z.literal('order') }).strict(),
    z.object({ op: z.literal('negotiate'), pool: z.enum(['angel', 'vc']) }).strict(),
    z
      .object({
        op: z.literal('ending'),
        ending: idSchema,
        valueMul: z.number().positive().optional(),
      })
      .strict(),
    z
      .object({
        op: z.literal('equity'),
        holder: z.string().min(1),
        bps: z.number().int().positive(),
      })
      .strict(),
    z.object({ op: z.literal('ap'), add: z.number().int() }).strict(),
    z.object({ op: z.literal('cofounderLeaves') }).strict(),
  ]),
) as z.ZodType<Effect>;

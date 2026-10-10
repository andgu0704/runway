import { z } from 'zod';

export const STAT_IDS = [
  'cash',
  'users',
  'quality',
  'morale',
  'reputation',
  'bugs',
  'techDebt',
  'hype',
] as const;
export const statIdSchema = z.enum(STAT_IDS);
export type StatId = z.infer<typeof statIdSchema>;

/** Hidden pressures that build up and foreshadow trouble. */
export const METER_IDS = ['burnout', 'scandal', 'security', 'boardTension', 'rivalThreat'] as const;
export const meterIdSchema = z.enum(METER_IDS);
export type MeterId = z.infer<typeof meterIdSchema>;

export const CHARACTER_IDS = ['cofounder', 'investor', 'rival', 'journalist'] as const;
export const characterIdSchema = z.enum(CHARACTER_IDS);
export type CharacterId = z.infer<typeof characterIdSchema>;

/** Values derived from state that conditions and amounts can read. */
export const DERIVED_METRIC_IDS = [
  'teamSize',
  'employees',
  'engineers',
  'executives',
  'mrr',
  'burn',
  'netBurn',
  'runwayMonths',
  'valuation',
  'founderOwnership',
  'month',
  'userGrowth',
  'priceRatio',
  'marketingBudget',
  'featuresShipped',
  'roadmapLength',
  'investorSeats',
  'monthsSinceRaise',
  'monthsSinceLaunch',
  'candidates',
] as const;
export const metricIdSchema = z.enum([...STAT_IDS, ...METER_IDS, ...DERIVED_METRIC_IDS]);
export type MetricId = z.infer<typeof metricIdSchema>;

export const TABS = ['product', 'people', 'money', 'world', 'company'] as const;
export const tabSchema = z.enum(TABS);
export type Tab = z.infer<typeof tabSchema>;

export const DEPARTMENTS = [
  'engineering',
  'design',
  'marketing',
  'sales',
  'support',
  'people',
] as const;
export const departmentSchema = z.enum(DEPARTMENTS);
export type Department = z.infer<typeof departmentSchema>;

export const TONES = ['neutral', 'good', 'bad', 'warn', 'milestone', 'quote'] as const;
export const toneSchema = z.enum(TONES);
export type Tone = z.infer<typeof toneSchema>;

export const idSchema = z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'ids are camelCase');

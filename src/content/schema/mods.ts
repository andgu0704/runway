import { z } from 'zod';

/**
 * Modifiers are the one currency every system speaks: traits, policies,
 * backgrounds, character tiers, executive orders and temporary boosts.
 * `*Mul` keys multiply (combined by product), everything else adds (combined by sum).
 */
export const MOD_KEYS = {
  capacityMul: 'mul',
  bugRateMul: 'mul',
  techDebtMul: 'mul',
  resignMul: 'mul',
  hypeMul: 'mul',
  paidEfficiencyMul: 'mul',
  churnMul: 'mul',
  growthMul: 'mul',
  burnMul: 'mul',
  salaryMul: 'mul',
  featureAppealMul: 'mul',
  valuationMul: 'mul',
  conversionMul: 'mul',
  effectivePriceMul: 'mul',
  rampMul: 'mul',
  moraleDrift: 'add',
  reputationDrift: 'add',
  scandalDrift: 'add',
  securityDrift: 'add',
  burnoutDrift: 'add',
  qualityTarget: 'add',
  apBonus: 'add',
  bugShare: 'add',
  autoQueue: 'add',
  autoBudgetShare: 'add',
  freeCandidates: 'add',
  candidateSkill: 'add',
} as const;

export type ModKey = keyof typeof MOD_KEYS;

export const modsSchema = z
  .object(
    Object.fromEntries(Object.keys(MOD_KEYS).map((k) => [k, z.number().optional()])) as Record<
      ModKey,
      z.ZodOptional<z.ZodNumber>
    >,
  )
  .strict();

export type Mods = { [K in ModKey]?: number | undefined };

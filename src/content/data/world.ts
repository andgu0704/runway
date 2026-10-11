import type { Character, Investor, Meter, Policy } from '../schema/records';

export const policies: Policy[] = [
  {
    id: 'remoteFirst',
    minStage: 'garage',
    mods: { burnMul: 0.85, moraleDrift: 0.3, capacityMul: 0.97 },
  },
  {
    id: 'unlimitedPto',
    minStage: 'garage',
    mods: { moraleDrift: 0.5, capacityMul: 0.95, burnoutDrift: -0.6 },
  },
  { id: 'equityForAll', minStage: 'garage', mods: { resignMul: 0.8, moraleDrift: 0.3 } },
  {
    id: 'hustleCulture',
    minStage: 'garage',
    mods: { capacityMul: 1.15, burnoutDrift: 1.5, moraleDrift: -0.4 },
  },
  { id: 'noMeetingWednesdays', minStage: 'garage', mods: { capacityMul: 1.04, moraleDrift: 0.2 } },
  {
    id: 'openSalaries',
    minStage: 'startup',
    mods: { moraleDrift: -0.2, resignMul: 0.9, reputationDrift: 0.1 },
  },
  {
    id: 'fourDayWeek',
    minStage: 'startup',
    mods: { capacityMul: 0.88, moraleDrift: 1, resignMul: 0.75, burnoutDrift: -1 },
  },
  { id: 'freeLunch', minStage: 'startup', mods: { burnMul: 1.06, moraleDrift: 0.4 } },
];

export const meters: Meter[] = [
  {
    id: 'burnout',
    decay: 3,
    warnings: [
      { at: 35, key: 'meter.burnout.warn1' },
      { at: 60, key: 'meter.burnout.warn2' },
      { at: 80, key: 'meter.burnout.warn3' },
    ],
  },
  {
    id: 'scandal',
    decay: 0.5,
    warnings: [
      { at: 25, key: 'meter.scandal.warn1' },
      { at: 50, key: 'meter.scandal.warn2' },
      { at: 75, key: 'meter.scandal.warn3' },
    ],
  },
  {
    id: 'security',
    decay: 0,
    warnings: [
      { at: 40, key: 'meter.security.warn1' },
      { at: 65, key: 'meter.security.warn2' },
      { at: 85, key: 'meter.security.warn3' },
    ],
  },
  {
    id: 'boardTension',
    decay: 2,
    warnings: [
      { at: 35, key: 'meter.boardTension.warn1' },
      { at: 60, key: 'meter.boardTension.warn2' },
      { at: 80, key: 'meter.boardTension.warn3' },
    ],
  },
  {
    id: 'rivalThreat',
    decay: 1,
    warnings: [
      { at: 30, key: 'meter.rivalThreat.warn1' },
      { at: 55, key: 'meter.rivalThreat.warn2' },
      { at: 80, key: 'meter.rivalThreat.warn3' },
    ],
  },
];

export const characters: Character[] = [
  {
    id: 'cofounder',
    name: 'Co-founder',
    startTrust: 60,
    tiers: [
      { min: 60, mods: { moraleDrift: 0.2 } },
      { min: 75, minStage: 'startup', mods: { apBonus: 1 } },
    ],
  },
  {
    id: 'investor',
    name: 'Margot Vell',
    startTrust: 35,
    tiers: [{ min: 70, mods: { valuationMul: 1.05 } }],
  },
  {
    id: 'rival',
    name: 'Brexton Hale',
    startTrust: 30,
    tiers: [{ min: 70, mods: { growthMul: 1.03 } }],
  },
  {
    id: 'journalist',
    name: 'Dana Okafor',
    startTrust: 40,
    tiers: [{ min: 70, mods: { reputationDrift: 0.2 } }],
  },
];

export const investors: Investor[] = [
  {
    id: 'dentistAngel',
    pool: 'angel',
    stages: ['garage'],
    lead: false,
    checkShare: [0.03, 0.08],
    minCheck: 25_000,
    maxCheck: 150_000,
    valuationBias: 1.1,
    patience: 3,
    boardSeat: 0,
  },
  {
    id: 'exFounderAngel',
    pool: 'angel',
    stages: ['garage'],
    lead: false,
    checkShare: [0.05, 0.12],
    minCheck: 50_000,
    maxCheck: 400_000,
    valuationBias: 0.95,
    patience: 2,
    boardSeat: 0,
  },
  {
    id: 'supperClub',
    pool: 'angel',
    stages: ['garage'],
    lead: false,
    checkShare: [0.08, 0.15],
    minCheck: 100_000,
    maxCheck: 750_000,
    valuationBias: 0.9,
    patience: 3,
    boardSeat: 0.1,
  },
  {
    id: 'hollowpine',
    pool: 'vc',
    stages: ['garage', 'startup'],
    lead: true,
    checkShare: [0.15, 0.25],
    minCheck: 500_000,
    maxCheck: 8_000_000,
    valuationBias: 1,
    patience: 3,
    boardSeat: 0.85,
    when: {
      any: [
        { metric: 'mrr', gte: 3000 },
        { metric: 'userGrowth', gte: 0.1 },
      ],
    },
  },
  {
    id: 'quarryCapital',
    pool: 'vc',
    stages: ['garage', 'startup'],
    lead: false,
    checkShare: [0.15, 0.25],
    minCheck: 750_000,
    maxCheck: 10_000_000,
    valuationBias: 0.9,
    patience: 2,
    boardSeat: 0.9,
    when: {
      any: [
        { metric: 'mrr', gte: 5000 },
        { metric: 'userGrowth', gte: 0.15 },
      ],
    },
  },
  {
    id: 'blueMeridian',
    pool: 'vc',
    stages: ['startup'],
    lead: false,
    checkShare: [0.18, 0.3],
    minCheck: 3_000_000,
    maxCheck: 20_000_000,
    valuationBias: 1.05,
    patience: 3,
    boardSeat: 1,
    when: {
      all: [
        { metric: 'mrr', gte: 40_000 },
        { metric: 'userGrowth', gte: 0.05 },
      ],
    },
  },
  {
    id: 'sovereignTech',
    pool: 'vc',
    stages: ['startup'],
    lead: false,
    checkShare: [0.2, 0.35],
    minCheck: 8_000_000,
    maxCheck: 40_000_000,
    valuationBias: 1.2,
    patience: 2,
    boardSeat: 0.5,
    when: { metric: 'mrr', gte: 120_000 },
  },
];

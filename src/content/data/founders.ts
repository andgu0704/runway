import type { Background, Cofounder } from '../schema/records';

export const backgrounds: Background[] = [
  {
    id: 'engineer',
    mods: { bugRateMul: 0.85, valuationMul: 0.95 },
    founder: { engineering: 1, design: 0.2 },
    startStats: { quality: 5 },
    startTrust: { investor: -5 },
    uniqueAction: 'allNighter',
  },
  {
    id: 'operator',
    mods: { valuationMul: 1.1, paidEfficiencyMul: 1.1 },
    founder: { sales: 0.8, marketing: 0.4, people: 0.3 },
    startStats: { reputation: 5 },
    startTrust: { investor: 10 },
    uniqueAction: 'callInAFavour',
  },
  {
    id: 'designer',
    mods: { featureAppealMul: 1.15, qualityTarget: 4 },
    founder: { design: 1, engineering: 0.3 },
    startStats: { hype: 10 },
    startTrust: { journalist: 10 },
    uniqueAction: 'designSprint',
  },
  {
    id: 'secondTimer',
    mods: { valuationMul: 1.15 },
    founder: { engineering: 0.4, sales: 0.4, people: 0.4 },
    startStats: { cash: 25_000, reputation: 10 },
    startTrust: { investor: 15, journalist: -10, rival: -10 },
    uniqueAction: 'oldNetwork',
  },
];

export const cofounders: Cofounder[] = [
  {
    id: 'priya',
    name: 'Priya Raman',
    contributes: { engineering: 1 },
    equityBps: 3000,
    startTrust: 65,
    mods: { bugRateMul: 0.9 },
  },
  {
    id: 'theo',
    name: 'Theo Marsh',
    contributes: { sales: 0.8, marketing: 0.6 },
    equityBps: 2500,
    startTrust: 60,
    mods: {},
  },
  {
    id: 'jun',
    name: 'Jun Abara',
    contributes: { design: 0.9, engineering: 0.3 },
    equityBps: 2500,
    startTrust: 70,
    mods: { featureAppealMul: 1.1 },
  },
];

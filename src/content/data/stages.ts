import type { Ending, Stage } from '../schema/records';

export const stages: Stage[] = [
  {
    id: 'garage',
    order: 0,
    entry: null,
    arrMultiple: 10,
    valuationFloor: 1_200_000,
    officePerHead: 0,
    salaryMul: 0.8,
    actionPoints: 3,
  },
  {
    id: 'startup',
    order: 1,
    entry: {
      all: [
        { metric: 'teamSize', gte: 5 },
        { any: [{ flag: 'pricedRound' }, { metric: 'mrr', gte: 20_000 }] },
      ],
    },
    arrMultiple: 12,
    valuationFloor: 3_000_000,
    officePerHead: 900,
    salaryMul: 1,
    actionPoints: 3,
  },
  {
    id: 'scaleup',
    order: 2,
    entry: {
      all: [
        { metric: 'teamSize', gte: 30 },
        {
          any: [
            {
              all: [
                { metric: 'mrr', gte: 250_000 },
                { metric: 'userGrowth', gte: 0.04 },
              ],
            },
            { metric: 'valuation', gte: 100_000_000 },
          ],
        },
      ],
    },
    ending: 'reachedScaleup',
    arrMultiple: 14,
    valuationFloor: 30_000_000,
    officePerHead: 1100,
    salaryMul: 1.1,
    actionPoints: 3,
  },
];

export const endings: Ending[] = [
  { id: 'bankrupt', kind: 'failure', keepsEquityValue: false },
  { id: 'firedByBoard', kind: 'failure', keepsEquityValue: true },
  { id: 'scandalCollapse', kind: 'failure', keepsEquityValue: false },
  { id: 'acquired', kind: 'exit', keepsEquityValue: true },
  { id: 'acquihired', kind: 'exit', keepsEquityValue: true },
  { id: 'reachedScaleup', kind: 'success', keepsEquityValue: true },
  { id: 'lifestyleBusiness', kind: 'success', keepsEquityValue: true },
  { id: 'walkedAway', kind: 'failure', keepsEquityValue: true },
];

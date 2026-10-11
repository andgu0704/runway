import type { Consequence } from '../schema/records';

/** Delayed effects scheduled by the character, startup and garage events. */
export const moreConsequences: Consequence[] = [
  {
    id: 'cofounderReturns',
    tone: 'good',
    effects: [
      { op: 'trust', character: 'cofounder', add: 5 },
      { op: 'stat', stat: 'morale', add: 5 },
    ],
  },
  {
    id: 'cofounderSnaps',
    tone: 'bad',
    event: 'cofounderMeltdown',
    effects: [{ op: 'stat', stat: 'morale', add: -4 }],
  },
  { id: 'margotQuarterDue', tone: 'warn', event: 'margotScorecard', effects: [] },
  {
    id: 'margotInsiderRound',
    tone: 'good',
    effects: [
      { op: 'stat', stat: 'cash', add: { metric: 'burn', times: 4, min: 80_000 } },
      { op: 'equity', holder: 'inv:hollowpine', bps: 600 },
      { op: 'meter', meter: 'boardTension', add: 5 },
    ],
  },
  {
    id: 'stageFeatureDue',
    tone: 'bad',
    effects: [
      { op: 'stat', stat: 'reputation', add: -5 },
      { op: 'stat', stat: 'hype', add: -10 },
      { op: 'trust', character: 'rival', add: 5 },
    ],
  },
  { id: 'rivalTermSheet', tone: 'milestone', event: 'rivalOffer', effects: [] },
  {
    id: 'scoopChecked',
    tone: 'bad',
    event: 'danaCorrection',
    effects: [{ op: 'meter', meter: 'scandal', add: 5 }],
  },
  {
    id: 'regulatorFine',
    tone: 'bad',
    effects: [
      { op: 'stat', stat: 'cash', add: { metric: 'cash', times: -0.1, max: -25_000 } },
      { op: 'stat', stat: 'reputation', add: -5 },
    ],
  },
  {
    id: 'indemnityClaim',
    tone: 'bad',
    effects: [
      { op: 'stat', stat: 'cash', add: { metric: 'mrr', times: -4, max: -40_000 } },
      { op: 'stat', stat: 'morale', add: -3 },
    ],
  },
  {
    id: 'postmortemLeaks',
    tone: 'bad',
    effects: [
      { op: 'stat', stat: 'reputation', add: -6 },
      { op: 'trust', character: 'journalist', add: -8 },
      { op: 'meter', meter: 'scandal', add: 8 },
    ],
  },
  {
    id: 'friendCheckIn',
    tone: 'neutral',
    effects: [{ op: 'stat', stat: 'morale', add: -4 }],
  },
  { id: 'parentsDeadline', tone: 'neutral', effects: [{ op: 'stat', stat: 'morale', add: -5 }] },
  {
    id: 'squatterRedirect',
    tone: 'bad',
    effects: [
      { op: 'stat', stat: 'users', mul: 0.97 },
      { op: 'meter', meter: 'rivalThreat', add: 10 },
    ],
  },
];

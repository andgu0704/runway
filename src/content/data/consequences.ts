import type { Consequence } from '../schema/records';

export const consequences: Consequence[] = [
  {
    id: 'grantDecision',
    tone: 'neutral',
    effects: [
      {
        op: 'chance',
        p: 0.45,
        then: [
          { op: 'stat', stat: 'cash', add: 25_000 },
          { op: 'feed', key: 'consequence.grantDecision.won', tone: 'good' },
        ],
        else: [{ op: 'feed', key: 'consequence.grantDecision.lost', tone: 'neutral' }],
      },
    ],
  },
  { id: 'creditCardsDue', tone: 'bad', effects: [{ op: 'stat', stat: 'cash', add: -26_000 }] },
  {
    id: 'breachFromSkippedReview',
    tone: 'bad',
    event: 'dataBreach',
    effects: [{ op: 'meter', meter: 'security', add: 40 }],
  },
  { id: 'dueDiligence', tone: 'warn', event: 'diligenceQuestions', effects: [] },
  { id: 'dataSaleSurfaces', tone: 'bad', event: 'dataBrokerExposed', effects: [] },
  {
    id: 'coverupLeaks',
    tone: 'bad',
    event: 'theStoryDrops',
    effects: [{ op: 'meter', meter: 'scandal', add: 30 }],
  },
  { id: 'diligenceLeaks', tone: 'bad', event: 'theStoryDrops', effects: [] },
  {
    id: 'deferredPayDue',
    tone: 'bad',
    effects: [{ op: 'stat', stat: 'cash', add: { metric: 'burn', times: -1.2 } }],
  },
  {
    id: 'enterpriseAngry',
    tone: 'bad',
    effects: [
      { op: 'stat', stat: 'users', mul: 0.97 },
      { op: 'stat', stat: 'reputation', add: -4 },
    ],
  },
  {
    id: 'trollSues',
    tone: 'bad',
    effects: [{ op: 'stat', stat: 'cash', add: { metric: 'cash', times: -0.15, max: -30_000 } }],
  },
  { id: 'cofounderWalks', tone: 'bad', effects: [{ op: 'cofounderLeaves' }] },
];

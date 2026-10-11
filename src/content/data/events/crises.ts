import type { GameEvent } from '../../schema/records';

export const crisisEvents: GameEvent[] = [
  {
    id: 'cashCrunch',
    tone: 'bad',
    trigger: { kind: 'urgent', when: { metric: 'cash', lte: -1 } },
    minStage: 'garage',
    cooldown: 6,
    disaster: true,
    lastChance: true,
    options: [
      {
        id: 'bridgeFromMargot',
        requires: { all: [{ flag: 'pricedRound' }, { trust: 'investor', gte: 55 }] },
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'burn', times: 3, min: 50_000 } },
          { op: 'equity', holder: 'inv:hollowpine', bps: 500 },
          { op: 'trust', character: 'investor', add: -10 },
        ],
      },
      {
        id: 'deferSalaries',
        requires: { metric: 'morale', gte: 50 },
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'burn', times: 1, min: 10_000 } },
          { op: 'stat', stat: 'morale', add: -15 },
          { op: 'trust', character: 'cofounder', add: -10 },
          { op: 'schedule', consequence: 'deferredPayDue', in: 6 },
        ],
      },
      {
        id: 'personalSavings',
        visibleWhen: { not: { flag: 'savingsGone' } },
        effects: [
          { op: 'stat', stat: 'cash', add: 15_000 },
          { op: 'flag', flag: 'savingsGone', set: true },
          { op: 'stat', stat: 'morale', add: -3 },
        ],
      },
      {
        id: 'closeTheDoors',
        effects: [
          { op: 'flag', flag: 'goodDeeds', add: 1 },
          { op: 'ending', ending: 'bankrupt' },
        ],
      },
    ],
  },
  {
    id: 'boardVote',
    tone: 'bad',
    trigger: {
      kind: 'urgent',
      when: { all: [{ metric: 'boardTension', gte: 85 }, { investorControl: true }] },
    },
    minStage: 'garage',
    cooldown: 6,
    disaster: true,
    options: [
      {
        id: 'rallyMargot',
        requires: { trust: 'investor', gte: 65 },
        effects: [
          { op: 'meter', meter: 'boardTension', add: -40 },
          { op: 'trust', character: 'investor', add: -10 },
        ],
      },
      {
        id: 'cofounderStands',
        requires: { trust: 'cofounder', gte: 70 },
        effects: [
          { op: 'meter', meter: 'boardTension', add: -30 },
          { op: 'trust', character: 'cofounder', add: -10 },
        ],
      },
      {
        id: 'turnaroundPlan',
        effects: [
          {
            op: 'chance',
            p: 0.15,
            per: { metric: 'reputation', slope: 0.005 },
            then: [
              { op: 'meter', meter: 'boardTension', add: -35 },
              { op: 'feed', key: 'event.boardVote.survived', tone: 'good' },
            ],
            else: [{ op: 'ending', ending: 'firedByBoard' }],
          },
        ],
      },
      { id: 'stepDown', effects: [{ op: 'ending', ending: 'firedByBoard' }] },
    ],
  },
  {
    id: 'scandalCollapse',
    tone: 'bad',
    trigger: {
      kind: 'urgent',
      when: {
        all: [
          { metric: 'scandal', gte: 95 },
          { metric: 'reputation', lte: 25 },
        ],
      },
    },
    minStage: 'garage',
    once: true,
    disaster: true,
    options: [
      { id: 'pressConference', effects: [{ op: 'ending', ending: 'scandalCollapse' }] },
      { id: 'notesAppApology', effects: [{ op: 'ending', ending: 'scandalCollapse' }] },
      { id: 'moveToLisbon', effects: [{ op: 'ending', ending: 'scandalCollapse' }] },
    ],
  },
  {
    id: 'dataBreach',
    tone: 'bad',
    trigger: { kind: 'meter', meter: 'security', at: 70, weight: 3 },
    minStage: 'garage',
    cooldown: 10,
    disaster: true,
    options: [
      {
        id: 'discloseNow',
        effects: [
          { op: 'stat', stat: 'reputation', add: -8 },
          { op: 'stat', stat: 'users', mul: 0.95 },
          { op: 'trust', character: 'journalist', add: 8 },
          { op: 'meter', meter: 'security', add: -40 },
        ],
      },
      {
        id: 'quietPatch',
        effects: [
          { op: 'meter', meter: 'security', add: -30 },
          { op: 'meter', meter: 'scandal', add: 25 },
          { op: 'schedule', consequence: 'coverupLeaks', in: { min: 6, max: 12 } },
        ],
      },
      {
        id: 'blameIntern',
        requires: { metric: 'employees', gte: 1 },
        effects: [
          { op: 'stat', stat: 'reputation', add: -4 },
          { op: 'stat', stat: 'morale', add: -10 },
          { op: 'meter', meter: 'scandal', add: 10 },
          { op: 'meter', meter: 'security', add: -30 },
        ],
      },
      {
        id: 'lawyerUp',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -10_000 },
          { op: 'stat', stat: 'reputation', add: -3 },
          { op: 'meter', meter: 'security', add: -35 },
        ],
      },
    ],
  },
  {
    id: 'theStoryDrops',
    tone: 'bad',
    trigger: { kind: 'meter', meter: 'scandal', at: 60, weight: 3 },
    minStage: 'garage',
    cooldown: 8,
    disaster: true,
    options: [
      {
        id: 'comeClean',
        effects: [
          { op: 'stat', stat: 'reputation', add: -10 },
          { op: 'meter', meter: 'scandal', add: -40 },
          { op: 'trust', character: 'journalist', add: 10 },
          { op: 'flag', flag: 'scandalsExposed', add: 1 },
        ],
      },
      {
        id: 'deny',
        effects: [
          {
            op: 'chance',
            p: 0.9,
            per: { metric: 'scandal', slope: -0.008 },
            then: [
              { op: 'meter', meter: 'scandal', add: -10 },
              { op: 'feed', key: 'event.theStoryDrops.denyWorked', tone: 'neutral' },
            ],
            else: [
              { op: 'stat', stat: 'reputation', add: -20 },
              { op: 'meter', meter: 'scandal', add: 20 },
              { op: 'flag', flag: 'scandalsExposed', add: 1 },
              { op: 'feed', key: 'event.theStoryDrops.denyFailed', tone: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'fightInCourt',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -25_000 },
          { op: 'meter', meter: 'scandal', add: -25 },
          { op: 'stat', stat: 'reputation', add: -4 },
        ],
      },
      {
        id: 'offerExclusive',
        requires: { trust: 'journalist', gte: 60 },
        effects: [
          { op: 'meter', meter: 'scandal', add: -30 },
          { op: 'stat', stat: 'reputation', add: -4 },
          { op: 'trust', character: 'journalist', add: -5 },
        ],
      },
    ],
  },
  {
    id: 'diligenceQuestions',
    tone: 'warn',
    trigger: { kind: 'scheduled' },
    minStage: 'garage',
    options: [
      {
        id: 'confess',
        effects: [
          { op: 'trust', character: 'investor', add: -20 },
          { op: 'flag', flag: 'inflatedMetrics', set: false },
          { op: 'meter', meter: 'scandal', add: -10 },
          { op: 'stat', stat: 'reputation', add: -3 },
        ],
      },
      {
        id: 'doubleDown',
        effects: [
          {
            op: 'chance',
            p: 0.5,
            then: [{ op: 'meter', meter: 'scandal', add: 10 }],
            else: [
              { op: 'trust', character: 'investor', add: -30 },
              { op: 'meter', meter: 'scandal', add: 30 },
              { op: 'schedule', consequence: 'diligenceLeaks', in: 2 },
            ],
          },
        ],
      },
      {
        id: 'blameSpreadsheet',
        effects: [
          { op: 'trust', character: 'investor', add: -8 },
          { op: 'meter', meter: 'scandal', add: -5 },
          { op: 'flag', flag: 'inflatedMetrics', set: false },
          { op: 'stat', stat: 'morale', add: -5 },
        ],
      },
    ],
  },
  {
    id: 'dataBrokerExposed',
    tone: 'bad',
    trigger: { kind: 'scheduled' },
    minStage: 'garage',
    disaster: true,
    options: [
      {
        id: 'apologise',
        effects: [
          { op: 'stat', stat: 'reputation', add: -12 },
          { op: 'stat', stat: 'users', mul: 0.9 },
          { op: 'meter', meter: 'scandal', add: -20 },
          { op: 'flag', flag: 'scandalsExposed', add: 1 },
        ],
      },
      {
        id: 'spinIt',
        effects: [
          { op: 'stat', stat: 'reputation', add: -6 },
          { op: 'meter', meter: 'scandal', add: 10 },
          { op: 'trust', character: 'journalist', add: -10 },
        ],
      },
      {
        id: 'giveItBack',
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'users', times: -2, max: -5000 } },
          { op: 'stat', stat: 'reputation', add: -4 },
          { op: 'meter', meter: 'scandal', add: -30 },
          { op: 'flag', flag: 'goodDeeds', add: 1 },
        ],
      },
    ],
  },
];

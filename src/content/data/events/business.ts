import type { GameEvent } from '../../schema/records';

export const businessEvents: GameEvent[] = [
  {
    id: 'viralMoment',
    tone: 'good',
    trigger: { kind: 'random', weight: 1, when: { launched: true } },
    minStage: 'garage',
    cooldown: 10,
    options: [
      {
        id: 'rideIt',
        effects: [
          { op: 'stat', stat: 'hype', add: 25 },
          { op: 'stat', stat: 'users', add: { metric: 'users', times: 0.1, min: 100 } },
          { op: 'stat', stat: 'bugs', add: 4 },
        ],
      },
      {
        id: 'scaleServers',
        requires: { metric: 'cash', gte: 5000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -5000 },
          { op: 'stat', stat: 'hype', add: 15 },
          { op: 'stat', stat: 'users', add: { metric: 'users', times: 0.1, min: 100 } },
        ],
      },
      { id: 'stayHumble', effects: [{ op: 'stat', stat: 'reputation', add: 3 }] },
    ],
  },
  {
    id: 'bigCustomer',
    tone: 'neutral',
    trigger: {
      kind: 'random',
      weight: 1.2,
      when: { all: [{ launched: true }, { market: ['saas', 'hardware'] }] },
    },
    minStage: 'garage',
    cooldown: 8,
    options: [
      {
        id: 'buildIt',
        effects: [
          { op: 'boost', id: 'customWork', months: 2, mods: { capacityMul: 0.85 } },
          { op: 'stat', stat: 'cash', add: { metric: 'mrr', times: 3, min: 20_000 } },
          { op: 'stat', stat: 'techDebt', add: 8 },
        ],
      },
      { id: 'decline', effects: [{ op: 'stat', stat: 'reputation', add: 1 }] },
      {
        id: 'promiseLater',
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'mrr', times: 2, min: 10_000 } },
          { op: 'schedule', consequence: 'enterpriseAngry', in: 4 },
        ],
      },
    ],
  },
  {
    id: 'cloudBill',
    tone: 'warn',
    trigger: { kind: 'random', weight: 1, when: { metric: 'users', gte: 2000 } },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'optimise',
        effects: [
          { op: 'boost', id: 'optimising', months: 1, mods: { capacityMul: 0.9 } },
          { op: 'boost', id: 'optimisedInfra', months: 12, mods: { burnMul: 0.95 } },
        ],
      },
      { id: 'pay', effects: [{ op: 'stat', stat: 'cash', add: { metric: 'burn', times: -0.3 } }] },
      {
        id: 'migrate',
        effects: [
          { op: 'stat', stat: 'techDebt', add: 10 },
          { op: 'stat', stat: 'bugs', add: 5 },
          { op: 'boost', id: 'migrated', months: 24, mods: { burnMul: 0.9 } },
        ],
      },
    ],
  },
  {
    id: 'conferenceInvite',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 0.8 },
    minStage: 'garage',
    cooldown: 9,
    options: [
      {
        id: 'accept',
        requires: { metric: 'cash', gte: 2000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -2000 },
          { op: 'stat', stat: 'hype', add: 10 },
          { op: 'stat', stat: 'reputation', add: 2 },
        ],
      },
      {
        id: 'sendCofounder',
        requires: { cofounder: true },
        effects: [
          { op: 'stat', stat: 'hype', add: 6 },
          { op: 'trust', character: 'cofounder', add: 5 },
        ],
      },
      { id: 'decline', effects: [{ op: 'ap', add: 1 }] },
    ],
  },
  {
    id: 'investorDinner',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 0.8, when: { trust: 'investor', gte: 40 } },
    minStage: 'garage',
    cooldown: 8,
    options: [
      { id: 'go', effects: [{ op: 'trust', character: 'investor', add: 8 }] },
      {
        id: 'pitchHer',
        requires: { launched: true },
        effects: [{ op: 'negotiate', pool: 'vc' }],
      },
      { id: 'decline', effects: [{ op: 'trust', character: 'investor', add: -4 }] },
    ],
  },
  {
    id: 'patentTroll',
    tone: 'bad',
    trigger: { kind: 'random', weight: 0.6, when: { launched: true } },
    minStage: 'startup',
    cooldown: 18,
    options: [
      {
        id: 'fight',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -20_000 },
          {
            op: 'chance',
            p: 0.7,
            then: [
              { op: 'stat', stat: 'reputation', add: 5 },
              { op: 'feed', key: 'event.patentTroll.won', tone: 'good' },
            ],
            else: [
              { op: 'stat', stat: 'cash', add: -40_000 },
              { op: 'feed', key: 'event.patentTroll.lost', tone: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'settle',
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'cash', times: -0.08, max: -15_000 } },
        ],
      },
      { id: 'ignore', effects: [{ op: 'schedule', consequence: 'trollSues', in: 3 }] },
    ],
  },
  {
    id: 'aiPivotPressure',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1, when: { not: { flag: 'aiFeature' } } },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'pivotDeck',
        effects: [
          { op: 'stat', stat: 'hype', add: 20 },
          { op: 'boost', id: 'aiNarrative', months: 6, mods: { valuationMul: 1.15 } },
          { op: 'stat', stat: 'techDebt', add: 10 },
          { op: 'stat', stat: 'reputation', add: -2 },
          { op: 'flag', flag: 'aiPivot', set: true },
        ],
      },
      {
        id: 'renameIt',
        effects: [
          { op: 'stat', stat: 'hype', add: 8 },
          { op: 'stat', stat: 'reputation', add: -4 },
        ],
      },
      {
        id: 'stayCourse',
        effects: [
          { op: 'trust', character: 'investor', add: -4 },
          { op: 'stat', stat: 'reputation', add: 2 },
          { op: 'stat', stat: 'morale', add: 3 },
        ],
      },
    ],
  },
  {
    id: 'pressProfile',
    tone: 'good',
    trigger: {
      kind: 'random',
      weight: 1,
      when: { all: [{ launched: true }, { trust: 'journalist', gte: 55 }] },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'openBook',
        effects: [
          {
            op: 'chance',
            p: 1,
            per: { metric: 'scandal', slope: -0.02 },
            then: [
              { op: 'stat', stat: 'reputation', add: 6 },
              { op: 'stat', stat: 'hype', add: 10 },
            ],
            else: [
              { op: 'meter', meter: 'scandal', add: 20 },
              { op: 'feed', key: 'event.pressProfile.foundSomething', tone: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'polishedPr',
        effects: [
          { op: 'stat', stat: 'hype', add: 6 },
          { op: 'trust', character: 'journalist', add: -3 },
        ],
      },
      { id: 'decline', effects: [{ op: 'trust', character: 'journalist', add: -5 }] },
    ],
  },
];

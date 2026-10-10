import type { GameEvent } from '../../schema/records';

export const pressureEvents: GameEvent[] = [
  {
    id: 'burnoutWave',
    tone: 'warn',
    trigger: { kind: 'meter', meter: 'burnout', at: 60, weight: 3 },
    minStage: 'garage',
    cooldown: 6,
    disaster: true,
    options: [
      {
        id: 'weekOff',
        effects: [
          { op: 'boost', id: 'weekOff', months: 1, mods: { capacityMul: 0.6 } },
          { op: 'meter', meter: 'burnout', add: -35 },
          { op: 'stat', stat: 'morale', add: 8 },
        ],
      },
      {
        id: 'pizzaParty',
        effects: [
          { op: 'stat', stat: 'cash', add: -500 },
          { op: 'stat', stat: 'morale', add: 1 },
          { op: 'meter', meter: 'burnout', add: -3 },
        ],
      },
      {
        id: 'pushThrough',
        effects: [
          { op: 'employee', target: 'random', leave: true },
          { op: 'stat', stat: 'morale', add: -8 },
          { op: 'meter', meter: 'burnout', add: 5 },
        ],
      },
      {
        id: 'hireHelp',
        effects: [
          { op: 'candidates', role: 'engineer', count: 3 },
          { op: 'meter', meter: 'burnout', add: -5 },
        ],
      },
    ],
  },
  {
    id: 'rivalCopycat',
    tone: 'warn',
    trigger: { kind: 'meter', meter: 'rivalThreat', at: 55, weight: 2, when: { launched: true } },
    minStage: 'garage',
    cooldown: 9,
    options: [
      {
        id: 'outship',
        effects: [
          { op: 'boost', id: 'outship', months: 1, mods: { capacityMul: 1.15 } },
          { op: 'meter', meter: 'burnout', add: 10 },
          { op: 'meter', meter: 'rivalThreat', add: -10 },
        ],
      },
      {
        id: 'sue',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -15_000 },
          { op: 'meter', meter: 'rivalThreat', add: -30 },
          { op: 'stat', stat: 'reputation', add: -2 },
        ],
      },
      {
        id: 'publicCallout',
        effects: [
          { op: 'stat', stat: 'hype', add: 10 },
          { op: 'trust', character: 'rival', add: -15 },
          { op: 'meter', meter: 'rivalThreat', add: -10 },
        ],
      },
      {
        id: 'ignore',
        effects: [
          { op: 'stat', stat: 'users', mul: 0.95 },
          { op: 'meter', meter: 'rivalThreat', add: -15 },
        ],
      },
    ],
  },
  {
    id: 'securityChecklist',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1.2,
      when: {
        all: [{ launched: true }, { metric: 'users', gte: 200 }, { metric: 'security', gte: 20 }],
      },
    },
    minStage: 'garage',
    cooldown: 10,
    options: [
      {
        id: 'doIt',
        requires: { metric: 'cash', gte: 4000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -4000 },
          { op: 'meter', meter: 'security', add: -30 },
        ],
      },
      {
        id: 'skipIt',
        effects: [
          { op: 'flag', flag: 'skippedSecurity', add: 1 },
          { op: 'schedule', consequence: 'breachFromSkippedReview', in: { min: 6, max: 14 } },
        ],
      },
      {
        id: 'delegate',
        requires: { hasTrait: 'securityMinded' },
        effects: [{ op: 'meter', meter: 'security', add: -25 }],
      },
      {
        id: 'buyBadge',
        effects: [
          { op: 'stat', stat: 'cash', add: -1500 },
          { op: 'stat', stat: 'reputation', add: 2 },
          { op: 'meter', meter: 'security', add: 5 },
          { op: 'meter', meter: 'scandal', add: 5 },
        ],
      },
    ],
  },
  {
    id: 'cofounderConflict',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 2,
      when: { all: [{ cofounder: true }, { trust: 'cofounder', lte: 40 }] },
    },
    minStage: 'garage',
    cooldown: 6,
    options: [
      {
        id: 'shareControl',
        effects: [
          { op: 'trust', character: 'cofounder', add: 20 },
          { op: 'flag', flag: 'cofounderControl', set: true },
        ],
      },
      {
        id: 'buyOut',
        requires: { metric: 'cash', gte: 30_000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -30_000 },
          { op: 'cofounderLeaves' },
          { op: 'stat', stat: 'morale', add: -8 },
        ],
      },
      {
        id: 'mediation',
        requires: { metric: 'cash', gte: 3000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -3000 },
          { op: 'trust', character: 'cofounder', add: 10 },
        ],
      },
      {
        id: 'ignoreIt',
        effects: [
          { op: 'trust', character: 'cofounder', add: -10 },
          { op: 'schedule', consequence: 'cofounderWalks', in: { min: 2, max: 5 } },
        ],
      },
    ],
  },
  {
    id: 'acquisitionOffer',
    tone: 'milestone',
    trigger: { kind: 'random', weight: 1.5, when: { metric: 'users', gte: 1000 } },
    minStage: 'startup',
    cooldown: 18,
    options: [
      { id: 'accept', effects: [{ op: 'ending', ending: 'acquired', valueMul: 1.3 }] },
      {
        id: 'counter',
        effects: [
          {
            op: 'chance',
            p: 0.45,
            then: [{ op: 'ending', ending: 'acquired', valueMul: 1.6 }],
            else: [
              { op: 'meter', meter: 'rivalThreat', add: 10 },
              { op: 'feed', key: 'event.acquisitionOffer.counterFailed', tone: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'decline',
        effects: [
          { op: 'flag', flag: 'declinedAcquisition', set: true },
          { op: 'stat', stat: 'morale', add: 5 },
          { op: 'stat', stat: 'hype', add: 5 },
          { op: 'meter', meter: 'rivalThreat', add: 15 },
        ],
      },
      {
        id: 'leakIt',
        requires: { trust: 'journalist', gte: 50 },
        effects: [
          { op: 'stat', stat: 'hype', add: 15 },
          { op: 'stat', stat: 'reputation', add: 3 },
          { op: 'boost', id: 'acquisitionBuzz', months: 6, mods: { valuationMul: 1.1 } },
        ],
      },
    ],
  },
  {
    id: 'acquihireOffer',
    tone: 'neutral',
    trigger: {
      kind: 'random',
      weight: 2,
      when: { all: [{ launched: true }, { metric: 'runwayMonths', lte: 4 }] },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      { id: 'accept', effects: [{ op: 'ending', ending: 'acquihired', valueMul: 0.6 }] },
      {
        id: 'holdOut',
        effects: [
          {
            op: 'chance',
            p: 0.35,
            then: [{ op: 'ending', ending: 'acquihired', valueMul: 0.9 }],
            else: [{ op: 'feed', key: 'event.acquihireOffer.holdOutFailed', tone: 'bad' }],
          },
        ],
      },
      {
        id: 'decline',
        effects: [
          { op: 'stat', stat: 'morale', add: 4 },
          { op: 'trust', character: 'cofounder', add: 4 },
        ],
      },
    ],
  },
];

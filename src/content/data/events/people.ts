import type { GameEvent } from '../../schema/records';

export const peopleEvents: GameEvent[] = [
  {
    id: 'raiseRequest',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1.2 },
    minStage: 'garage',
    cooldown: 5,
    subject: {},
    options: [
      {
        id: 'giveRaise',
        effects: [{ op: 'employee', target: 'subject', salaryMul: 1.15, mood: 20 }],
      },
      {
        id: 'equityInstead',
        effects: [{ op: 'employee', target: 'subject', equityBps: 40, mood: 12 }],
      },
      { id: 'notNow', effects: [{ op: 'employee', target: 'subject', mood: -20 }] },
      {
        id: 'fancyTitle',
        effects: [
          { op: 'employee', target: 'subject', mood: 6 },
          { op: 'flag', flag: 'titleInflation', add: 1 },
        ],
      },
    ],
  },
  {
    id: 'recruiterCalling',
    tone: 'warn',
    trigger: { kind: 'random', weight: 1, when: { metric: 'rivalThreat', gte: 20 } },
    minStage: 'garage',
    cooldown: 6,
    subject: { roles: ['engineer', 'designer'] },
    options: [
      {
        id: 'matchOffer',
        effects: [{ op: 'employee', target: 'subject', salaryMul: 1.2, mood: 10 }],
      },
      {
        id: 'appealToMission',
        requires: { flag: 'hasValues' },
        effects: [{ op: 'employee', target: 'subject', mood: 8 }],
      },
      { id: 'letThemGo', effects: [{ op: 'employee', target: 'subject', leave: true }] },
      {
        id: 'askWho',
        effects: [
          { op: 'employee', target: 'subject', mood: -5 },
          { op: 'trust', character: 'rival', add: -5 },
          { op: 'meter', meter: 'rivalThreat', add: 5 },
        ],
      },
    ],
  },
  {
    id: 'weekendPrototype',
    tone: 'good',
    trigger: { kind: 'random', weight: 1 },
    minStage: 'garage',
    cooldown: 8,
    subject: { roles: ['engineer', 'designer'] },
    options: [
      {
        id: 'greenlight',
        effects: [
          { op: 'progress', add: 8 },
          { op: 'stat', stat: 'hype', add: 5 },
          { op: 'stat', stat: 'techDebt', add: 4 },
          { op: 'employee', target: 'subject', mood: 15 },
        ],
      },
      { id: 'shelve', effects: [{ op: 'employee', target: 'subject', mood: -10 }] },
      {
        id: 'takeCredit',
        effects: [
          { op: 'stat', stat: 'hype', add: 8 },
          { op: 'employee', target: 'subject', mood: -25 },
          { op: 'stat', stat: 'morale', add: -3 },
          { op: 'flag', flag: 'tookCredit', set: true },
        ],
      },
    ],
  },
  {
    id: 'firstHireWantsTitle',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1.5 },
    minStage: 'startup',
    once: true,
    subject: { roles: ['engineer'] },
    options: [
      {
        id: 'promote',
        effects: [
          { op: 'employee', target: 'subject', mood: 25 },
          { op: 'flag', flag: 'promotedFirstHire', set: true },
          { op: 'boost', id: 'newManager', months: 6, mods: { capacityMul: 0.95 } },
        ],
      },
      {
        id: 'hireAbove',
        effects: [
          { op: 'employee', target: 'subject', mood: -20 },
          { op: 'candidates', role: 'vpEngineering', count: 2 },
        ],
      },
      { id: 'foundingEngineer', effects: [{ op: 'employee', target: 'subject', mood: 10 }] },
    ],
  },
  {
    id: 'growingPains',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 2, when: { metric: 'teamSize', gte: 4 } },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'leaseOffice',
        effects: [
          { op: 'boost', id: 'office', months: 999, mods: { burnMul: 1.1 } },
          { op: 'stat', stat: 'morale', add: 8 },
          { op: 'stat', stat: 'reputation', add: 2 },
        ],
      },
      {
        id: 'goRemote',
        effects: [
          { op: 'boost', id: 'remoteGarage', months: 999, mods: { burnMul: 0.95 } },
          { op: 'stat', stat: 'morale', add: 3 },
        ],
      },
      {
        id: 'coworking',
        effects: [
          { op: 'boost', id: 'coworking', months: 999, mods: { burnMul: 1.04 } },
          { op: 'stat', stat: 'morale', add: 4 },
          { op: 'stat', stat: 'hype', add: 2 },
        ],
      },
    ],
  },
  {
    id: 'kombuchaTap',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 0.8, when: { metric: 'teamSize', gte: 8 } },
    minStage: 'startup',
    once: true,
    options: [
      {
        id: 'install',
        effects: [
          { op: 'stat', stat: 'cash', add: -3000 },
          { op: 'stat', stat: 'morale', add: 4 },
        ],
      },
      { id: 'memo', effects: [{ op: 'stat', stat: 'morale', add: -2 }] },
      {
        id: 'vote',
        effects: [
          { op: 'stat', stat: 'morale', add: 2 },
          { op: 'stat', stat: 'cash', add: -1500 },
        ],
      },
    ],
  },
];

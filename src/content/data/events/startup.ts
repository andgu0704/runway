import type { GameEvent } from '../../schema/records';

const VPS = ['vpEngineering', 'vpProduct', 'vpMarketing', 'vpSales', 'vpPeople'];

/** Problems that only exist once there is an org chart. */
export const startupEvents: GameEvent[] = [
  {
    id: 'vpHeadcountPlan',
    tone: 'warn',
    trigger: { kind: 'random', weight: 1.5 },
    minStage: 'startup',
    cooldown: 10,
    subject: { roles: VPS, trait: 'empireBuilder' },
    options: [
      {
        id: 'approveAll',
        effects: [
          { op: 'candidates', role: 'engineer', count: 3 },
          { op: 'boost', id: 'empireBudget', months: 6, mods: { burnMul: 1.06 } },
          { op: 'employee', target: 'subject', mood: 15 },
        ],
      },
      {
        id: 'halveIt',
        effects: [
          { op: 'candidates', role: 'engineer', count: 1 },
          { op: 'employee', target: 'subject', mood: -6 },
        ],
      },
      {
        id: 'routeToPeople',
        requires: { hasRole: 'vpPeople' },
        effects: [
          { op: 'employee', target: 'subject', mood: -8 },
          { op: 'stat', stat: 'morale', add: 2 },
        ],
      },
      {
        id: 'readTheSpreadsheet',
        effects: [
          { op: 'employee', target: 'subject', reveal: true, mood: -12 },
          { op: 'meter', meter: 'boardTension', add: -4 },
        ],
      },
    ],
  },
  {
    id: 'vpOffsite',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1.2 },
    minStage: 'startup',
    cooldown: 12,
    subject: { roles: VPS, trait: 'exBigCo' },
    options: [
      {
        id: 'fundOffsite',
        requires: { metric: 'cash', gte: 25_000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -25_000 },
          { op: 'stat', stat: 'morale', add: 5 },
          { op: 'employee', target: 'subject', mood: 12 },
        ],
      },
      {
        id: 'okrsOnly',
        effects: [
          { op: 'boost', id: 'okrRollout', months: 3, mods: { capacityMul: 0.95 } },
          { op: 'meter', meter: 'boardTension', add: -6 },
          { op: 'employee', target: 'subject', mood: 5 },
        ],
      },
      {
        id: 'pairWithOperator',
        requires: { hasTrait: 'operator' },
        effects: [
          { op: 'boost', id: 'operatorPairing', months: 3, mods: { capacityMul: 1.05 } },
          { op: 'employee', target: 'subject', mood: 3 },
        ],
      },
      { id: 'notYet', effects: [{ op: 'employee', target: 'subject', mood: -12 }] },
    ],
  },
  {
    id: 'turfWar',
    tone: 'warn',
    trigger: { kind: 'random', weight: 1.2, when: { metric: 'executives', gte: 2 } },
    minStage: 'startup',
    cooldown: 10,
    subject: { roles: VPS },
    options: [
      {
        id: 'backThem',
        effects: [
          { op: 'employee', target: 'subject', mood: 15 },
          { op: 'stat', stat: 'morale', add: -4 },
        ],
      },
      {
        id: 'backTheOther',
        effects: [
          { op: 'employee', target: 'subject', mood: -15 },
          { op: 'stat', stat: 'morale', add: -1 },
        ],
      },
      {
        id: 'cofounderRefs',
        requires: { trust: 'cofounder', gte: 60 },
        effects: [
          { op: 'trust', character: 'cofounder', add: -3 },
          { op: 'stat', stat: 'morale', add: 3 },
        ],
      },
      {
        id: 'operatorDrawsChart',
        requires: { subjectTrait: 'operator' },
        effects: [
          { op: 'employee', target: 'subject', mood: 6 },
          { op: 'boost', id: 'clearOwnership', months: 6, mods: { capacityMul: 1.04 } },
        ],
      },
    ],
  },
  {
    id: 'theReorg',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1, when: { metric: 'teamSize', gte: 12 } },
    minStage: 'startup',
    cooldown: 18,
    options: [
      {
        id: 'bigReorg',
        effects: [
          { op: 'boost', id: 'reorgChaos', months: 2, mods: { capacityMul: 0.85 } },
          { op: 'boost', id: 'reorgPayoff', months: 12, mods: { capacityMul: 1.06 } },
          { op: 'stat', stat: 'morale', add: -5 },
        ],
      },
      {
        id: 'renameTeams',
        effects: [
          { op: 'stat', stat: 'morale', add: -2 },
          { op: 'stat', stat: 'hype', add: 2 },
        ],
      },
      {
        id: 'vpPeopleRuns',
        requires: { hasRole: 'vpPeople' },
        effects: [
          { op: 'boost', id: 'gentleReorg', months: 6, mods: { capacityMul: 1.05 } },
          { op: 'stat', stat: 'morale', add: 3 },
        ],
      },
      {
        id: 'leaveIt',
        effects: [
          { op: 'stat', stat: 'morale', add: 2 },
          { op: 'stat', stat: 'techDebt', add: 5 },
        ],
      },
    ],
  },
  {
    id: 'regulatorLetter',
    tone: 'warn',
    trigger: { kind: 'random', weight: 1, when: { metric: 'users', gte: 2000 } },
    minStage: 'startup',
    cooldown: 18,
    options: [
      {
        id: 'hireCompliance',
        requires: { metric: 'cash', gte: 30_000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -30_000 },
          { op: 'meter', meter: 'security', add: -20 },
          { op: 'stat', stat: 'reputation', add: 3 },
        ],
      },
      {
        id: 'lawyerReplies',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -10_000 },
          { op: 'meter', meter: 'security', add: -10 },
        ],
      },
      {
        id: 'biggerBanner',
        effects: [
          { op: 'stat', stat: 'users', mul: 0.98 },
          { op: 'meter', meter: 'scandal', add: 5 },
          { op: 'schedule', consequence: 'regulatorFine', in: { min: 4, max: 8 } },
        ],
      },
      {
        id: 'blameTheVendor',
        effects: [
          { op: 'meter', meter: 'scandal', add: 8 },
          { op: 'stat', stat: 'reputation', add: -3 },
        ],
      },
    ],
  },
  {
    id: 'procurementPortal',
    tone: 'neutral',
    trigger: {
      kind: 'random',
      weight: 1.2,
      when: { all: [{ launched: true }, { metric: 'mrr', gte: 10_000 }] },
    },
    minStage: 'startup',
    cooldown: 12,
    options: [
      {
        id: 'fillPortal',
        effects: [
          { op: 'ap', add: -1 },
          { op: 'stat', stat: 'cash', add: { metric: 'mrr', times: 3, min: 30_000 } },
        ],
      },
      {
        id: 'signIndemnity',
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'mrr', times: 5, min: 50_000 } },
          { op: 'schedule', consequence: 'indemnityClaim', in: { min: 6, max: 12 } },
        ],
      },
      {
        id: 'lawyerRedlines',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'mrr', times: 4, min: 40_000 } },
          { op: 'stat', stat: 'cash', add: -8000 },
        ],
      },
      { id: 'walkAway', effects: [{ op: 'stat', stat: 'reputation', add: 1 }] },
    ],
  },
  {
    id: 'allHandsMishap',
    tone: 'bad',
    trigger: { kind: 'random', weight: 1, when: { metric: 'teamSize', gte: 10 } },
    minStage: 'startup',
    cooldown: 15,
    options: [
      {
        id: 'fullTransparency',
        effects: [
          { op: 'stat', stat: 'morale', add: 6 },
          { op: 'stat', stat: 'reputation', add: 2 },
          { op: 'meter', meter: 'scandal', add: 4 },
        ],
      },
      {
        id: 'pivotToVision',
        effects: [
          { op: 'stat', stat: 'morale', add: -6 },
          { op: 'stat', stat: 'hype', add: 3 },
        ],
      },
      {
        id: 'quoteTheValues',
        requires: { flag: 'hasValues' },
        effects: [
          { op: 'stat', stat: 'morale', add: 3 },
          { op: 'meter', meter: 'burnout', add: -5 },
        ],
      },
      {
        id: 'endEarly',
        effects: [
          { op: 'stat', stat: 'morale', add: -8 },
          { op: 'meter', meter: 'burnout', add: 4 },
        ],
      },
    ],
  },
  {
    id: 'bigOutage',
    tone: 'bad',
    trigger: {
      kind: 'random',
      weight: 1.2,
      when: { all: [{ launched: true }, { metric: 'techDebt', gte: 35 }] },
    },
    minStage: 'startup',
    cooldown: 10,
    options: [
      {
        id: 'warRoom',
        effects: [
          { op: 'meter', meter: 'burnout', add: 12 },
          { op: 'stat', stat: 'bugs', add: -5 },
          { op: 'stat', stat: 'reputation', add: 2 },
        ],
      },
      {
        id: 'honestPostmortem',
        effects: [
          { op: 'stat', stat: 'users', mul: 0.98 },
          { op: 'stat', stat: 'reputation', add: 5 },
          { op: 'stat', stat: 'techDebt', add: -5 },
        ],
      },
      {
        id: 'blameProvider',
        effects: [
          { op: 'stat', stat: 'users', mul: 0.98 },
          { op: 'schedule', consequence: 'postmortemLeaks', in: { min: 2, max: 4 } },
        ],
      },
      {
        id: 'vpEngineeringLeads',
        requires: { hasRole: 'vpEngineering' },
        effects: [
          { op: 'stat', stat: 'techDebt', add: -10 },
          { op: 'stat', stat: 'bugs', add: -5 },
          { op: 'stat', stat: 'reputation', add: 1 },
        ],
      },
    ],
  },
];

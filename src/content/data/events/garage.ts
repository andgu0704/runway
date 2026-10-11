import type { GameEvent } from '../../schema/records';

/** Small, personal problems from the days before there was an office. */
export const garageEvents: GameEvent[] = [
  {
    id: 'firstCustomer',
    tone: 'good',
    trigger: {
      kind: 'random',
      weight: 2,
      when: { all: [{ stage: ['garage'] }, { launched: true }] },
    },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'driveOver',
        effects: [
          { op: 'ap', add: -1 },
          { op: 'stat', stat: 'reputation', add: 4 },
          { op: 'stat', stat: 'hype', add: 3 },
        ],
      },
      { id: 'frameIt', effects: [{ op: 'stat', stat: 'morale', add: 6 }] },
      {
        id: 'upsell',
        effects: [
          { op: 'stat', stat: 'cash', add: 2000 },
          { op: 'stat', stat: 'reputation', add: -2 },
        ],
      },
      {
        id: 'caseStudy',
        requires: { flag: 'hasValues' },
        effects: [
          { op: 'stat', stat: 'reputation', add: 3 },
          { op: 'stat', stat: 'users', add: 50 },
        ],
      },
    ],
  },
  {
    id: 'landlordNotices',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1,
      when: { all: [{ stage: ['garage'] }, { metric: 'teamSize', gte: 2 }] },
    },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'payExtra',
        effects: [
          { op: 'stat', stat: 'cash', add: -3000 },
          { op: 'boost', id: 'garageRent', months: 12, mods: { burnMul: 1.02 } },
        ],
      },
      {
        id: 'offerEquity',
        effects: [
          { op: 'equity', holder: 'note:landlord', bps: 50 },
          { op: 'stat', stat: 'morale', add: 2 },
        ],
      },
      {
        id: 'lawyerQuotesLease',
        requires: { flag: 'lawyer' },
        effects: [{ op: 'stat', stat: 'morale', add: 3 }],
      },
      {
        id: 'hideTheWhiteboard',
        effects: [
          {
            op: 'chance',
            p: 0.6,
            then: [{ op: 'feed', key: 'event.landlordNotices.gotAway', tone: 'good' }],
            else: [
              { op: 'stat', stat: 'cash', add: -6000 },
              { op: 'stat', stat: 'morale', add: -4 },
              { op: 'feed', key: 'event.landlordNotices.caught', tone: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'friendInvests',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1, when: { stage: ['garage'] } },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'takeIt',
        effects: [
          { op: 'stat', stat: 'cash', add: 25_000 },
          { op: 'equity', holder: 'note:friend', bps: 250 },
          { op: 'flag', flag: 'friendInvestor', set: true },
          { op: 'schedule', consequence: 'friendCheckIn', in: { min: 5, max: 8 } },
        ],
      },
      {
        id: 'properPaperwork',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: 25_000 },
          { op: 'equity', holder: 'note:friend', bps: 200 },
          { op: 'flag', flag: 'friendInvestor', set: true },
        ],
      },
      {
        id: 'smallerCheque',
        effects: [
          { op: 'stat', stat: 'cash', add: 5000 },
          { op: 'equity', holder: 'note:friend', bps: 50 },
          { op: 'flag', flag: 'friendInvestor', set: true },
        ],
      },
      { id: 'keepTheFriend', effects: [{ op: 'stat', stat: 'morale', add: 2 }] },
    ],
  },
  {
    id: 'parentsWorried',
    tone: 'neutral',
    trigger: {
      kind: 'random',
      weight: 1,
      when: { all: [{ stage: ['garage'] }, { metric: 'month', gte: 3 }] },
    },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'explainSaas',
        effects: [
          { op: 'ap', add: -1 },
          { op: 'stat', stat: 'morale', add: 4 },
        ],
      },
      {
        id: 'promiseDeadline',
        effects: [
          { op: 'stat', stat: 'morale', add: 2 },
          { op: 'schedule', consequence: 'parentsDeadline', in: 6 },
        ],
      },
      { id: 'acceptCheque', effects: [{ op: 'stat', stat: 'cash', add: 10_000 }] },
      {
        id: 'friendVouches',
        requires: { flag: 'friendInvestor' },
        effects: [
          { op: 'stat', stat: 'morale', add: 3 },
          { op: 'stat', stat: 'cash', add: 5000 },
        ],
      },
    ],
  },
  {
    id: 'hackathonPrize',
    tone: 'good',
    trigger: { kind: 'random', weight: 0.8, when: { stage: ['garage'] } },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'takeTheCash',
        effects: [
          { op: 'stat', stat: 'cash', add: 10_000 },
          { op: 'stat', stat: 'hype', add: 4 },
        ],
      },
      { id: 'recruitRunnersUp', effects: [{ op: 'candidates', role: 'engineer', count: 2 }] },
      {
        id: 'pitchTheJudges',
        effects: [
          { op: 'stat', stat: 'hype', add: 6 },
          { op: 'trust', character: 'investor', add: 6 },
        ],
      },
      {
        id: 'demoTheAi',
        requires: { flag: 'aiFeature' },
        effects: [
          { op: 'stat', stat: 'cash', add: 10_000 },
          { op: 'stat', stat: 'hype', add: 12 },
        ],
      },
    ],
  },
  {
    id: 'domainSquatter',
    tone: 'warn',
    trigger: { kind: 'random', weight: 1, when: { stage: ['garage'] } },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'payHim',
        requires: { metric: 'cash', gte: 15_000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -15_000 },
          { op: 'stat', stat: 'reputation', add: 2 },
        ],
      },
      {
        id: 'settleForPrefix',
        effects: [
          { op: 'stat', stat: 'hype', add: -2 },
          { op: 'schedule', consequence: 'squatterRedirect', in: { min: 4, max: 8 } },
        ],
      },
      {
        id: 'lawyerLetter',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -3000 },
          {
            op: 'chance',
            p: 0.6,
            then: [
              { op: 'stat', stat: 'reputation', add: 3 },
              { op: 'feed', key: 'event.domainSquatter.handedOver', tone: 'good' },
            ],
            else: [{ op: 'feed', key: 'event.domainSquatter.priceDoubled', tone: 'bad' }],
          },
        ],
      },
      {
        id: 'dropTheVowels',
        effects: [
          { op: 'stat', stat: 'hype', add: 4 },
          { op: 'stat', stat: 'reputation', add: -2 },
        ],
      },
    ],
  },
];

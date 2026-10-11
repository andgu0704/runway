import type { GameEvent } from '../../schema/records';

/** Recurring-character arcs: the co-founder, Margot, Brexton and Dana. */
export const characterEvents: GameEvent[] = [
  // Co-founder
  {
    id: 'cofounderTitle',
    tone: 'neutral',
    trigger: {
      kind: 'random',
      weight: 1,
      when: { all: [{ cofounder: true }, { metric: 'month', gte: 4 }] },
    },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'topUpEquity',
        effects: [
          { op: 'equity', holder: 'cofounder', bps: 300 },
          { op: 'trust', character: 'cofounder', add: 15 },
        ],
      },
      {
        id: 'coCeo',
        effects: [
          { op: 'flag', flag: 'coCeos', set: true },
          { op: 'trust', character: 'cofounder', add: 10 },
          { op: 'meter', meter: 'boardTension', add: 8 },
        ],
      },
      {
        id: 'visionaryTitle',
        effects: [
          { op: 'trust', character: 'cofounder', add: -4 },
          { op: 'flag', flag: 'titleInflation', add: 1 },
          { op: 'stat', stat: 'hype', add: 3 },
        ],
      },
      { id: 'sayNo', effects: [{ op: 'trust', character: 'cofounder', add: -12 }] },
    ],
  },
  {
    id: 'cofounderBurnout',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1.2,
      when: {
        all: [
          { cofounder: true },
          {
            any: [
              { metric: 'burnout', gte: 30 },
              { metric: 'month', gte: 10 },
            ],
          },
        ],
      },
    },
    minStage: 'garage',
    cooldown: 14,
    options: [
      {
        id: 'sabbatical',
        effects: [
          { op: 'boost', id: 'cofounderAway', months: 2, mods: { capacityMul: 0.9 } },
          { op: 'trust', character: 'cofounder', add: 10 },
          { op: 'schedule', consequence: 'cofounderReturns', in: 3 },
        ],
      },
      {
        id: 'coverForThem',
        effects: [
          { op: 'ap', add: -1 },
          { op: 'trust', character: 'cofounder', add: 8 },
          { op: 'meter', meter: 'burnout', add: 5 },
        ],
      },
      {
        id: 'payForTherapy',
        requires: { metric: 'cash', gte: 5000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -5000 },
          { op: 'trust', character: 'cofounder', add: 6 },
          { op: 'meter', meter: 'burnout', add: -10 },
        ],
      },
      {
        id: 'toughLove',
        effects: [
          { op: 'trust', character: 'cofounder', add: -10 },
          { op: 'schedule', consequence: 'cofounderSnaps', in: { min: 2, max: 4 } },
        ],
      },
    ],
  },
  {
    id: 'cofounderVision',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1.5,
      when: { all: [{ cofounder: true }, { trust: 'cofounder', lte: 50 }] },
    },
    minStage: 'garage',
    cooldown: 10,
    options: [
      {
        id: 'theirWay',
        effects: [
          { op: 'trust', character: 'cofounder', add: 15 },
          { op: 'stat', stat: 'techDebt', add: 6 },
          { op: 'stat', stat: 'hype', add: 4 },
        ],
      },
      {
        id: 'yourWay',
        effects: [
          { op: 'trust', character: 'cofounder', add: -12 },
          { op: 'stat', stat: 'morale', add: -4 },
        ],
      },
      {
        id: 'coCeoVote',
        requires: { flag: 'coCeos' },
        effects: [
          { op: 'trust', character: 'cofounder', add: 8 },
          { op: 'meter', meter: 'boardTension', add: 6 },
          { op: 'boost', id: 'twoRoadmaps', months: 2, mods: { capacityMul: 0.92 } },
        ],
      },
      {
        id: 'partWays',
        requires: { trust: 'cofounder', lte: 35 },
        effects: [{ op: 'cofounderLeaves' }, { op: 'stat', stat: 'morale', add: -6 }],
      },
    ],
  },
  {
    id: 'cofounderCovers',
    tone: 'good',
    trigger: {
      kind: 'random',
      weight: 1,
      when: { all: [{ cofounder: true }, { trust: 'cofounder', gte: 70 }] },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'thankPublicly',
        effects: [
          { op: 'trust', character: 'cofounder', add: 6 },
          { op: 'stat', stat: 'morale', add: 4 },
        ],
      },
      {
        id: 'returnFavour',
        effects: [
          { op: 'ap', add: 1 },
          { op: 'trust', character: 'cofounder', add: 4 },
        ],
      },
      {
        id: 'takeCredit',
        effects: [
          { op: 'trust', character: 'cofounder', add: -15 },
          { op: 'trust', character: 'investor', add: 5 },
        ],
      },
      {
        id: 'giveThemTheRoom',
        requires: { flag: 'pricedRound' },
        effects: [
          { op: 'trust', character: 'cofounder', add: 10 },
          { op: 'meter', meter: 'boardTension', add: -10 },
        ],
      },
    ],
  },
  {
    id: 'cofounderMeltdown',
    tone: 'bad',
    trigger: { kind: 'scheduled' },
    minStage: 'garage',
    options: [
      {
        id: 'apologise',
        effects: [
          { op: 'trust', character: 'cofounder', add: 12 },
          { op: 'stat', stat: 'morale', add: -3 },
        ],
      },
      {
        id: 'forcedLeave',
        effects: [
          { op: 'boost', id: 'cofounderLeave', months: 2, mods: { capacityMul: 0.85 } },
          { op: 'trust', character: 'cofounder', add: 4 },
          { op: 'meter', meter: 'burnout', add: -10 },
        ],
      },
      {
        id: 'pointAtValues',
        requires: { flag: 'hasValues' },
        effects: [
          { op: 'trust', character: 'cofounder', add: -6 },
          { op: 'stat', stat: 'morale', add: 2 },
        ],
      },
      {
        id: 'letThemGo',
        effects: [{ op: 'cofounderLeaves' }, { op: 'stat', stat: 'morale', add: -8 }],
      },
    ],
  },

  // Margot Vell, Hollowpine Ventures
  {
    id: 'margotProCeo',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1.5,
      when: { all: [{ flag: 'pricedRound' }, { metric: 'boardTension', gte: 40 }] },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'meetCandidate',
        effects: [
          { op: 'trust', character: 'investor', add: 8 },
          { op: 'meter', meter: 'boardTension', add: -12 },
          { op: 'stat', stat: 'morale', add: -4 },
        ],
      },
      {
        id: 'promiseQuarter',
        effects: [
          { op: 'trust', character: 'investor', add: 4 },
          { op: 'meter', meter: 'boardTension', add: -10 },
          { op: 'schedule', consequence: 'margotQuarterDue', in: 3 },
        ],
      },
      {
        id: 'cofounderVouches',
        requires: { trust: 'cofounder', gte: 65 },
        effects: [
          { op: 'meter', meter: 'boardTension', add: -15 },
          { op: 'trust', character: 'cofounder', add: -4 },
        ],
      },
      {
        id: 'refuse',
        effects: [
          { op: 'trust', character: 'investor', add: -12 },
          { op: 'meter', meter: 'boardTension', add: 10 },
        ],
      },
    ],
  },
  {
    id: 'margotScorecard',
    tone: 'warn',
    trigger: { kind: 'scheduled' },
    minStage: 'garage',
    options: [
      {
        id: 'showProfit',
        requires: { metric: 'netBurn', lte: 0 },
        effects: [
          { op: 'trust', character: 'investor', add: 15 },
          { op: 'meter', meter: 'boardTension', add: -20 },
        ],
      },
      {
        id: 'showGrowth',
        requires: { metric: 'userGrowth', gte: 0.1 },
        effects: [
          { op: 'trust', character: 'investor', add: 8 },
          { op: 'meter', meter: 'boardTension', add: -10 },
        ],
      },
      {
        id: 'admitMiss',
        effects: [
          { op: 'trust', character: 'investor', add: -5 },
          { op: 'meter', meter: 'boardTension', add: 8 },
        ],
      },
      {
        id: 'redefineQuarter',
        effects: [
          { op: 'trust', character: 'investor', add: -12 },
          { op: 'meter', meter: 'boardTension', add: 15 },
          { op: 'meter', meter: 'scandal', add: 5 },
        ],
      },
    ],
  },
  {
    id: 'margotBridge',
    tone: 'good',
    trigger: {
      kind: 'random',
      weight: 1.5,
      when: {
        all: [
          { flag: 'pricedRound' },
          { trust: 'investor', gte: 65 },
          { metric: 'runwayMonths', lte: 8 },
        ],
      },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'takeBridge',
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'burn', times: 3, min: 60_000 } },
          { op: 'equity', holder: 'inv:hollowpine', bps: 300 },
          { op: 'trust', character: 'investor', add: -3 },
        ],
      },
      {
        id: 'askForIntros',
        effects: [
          { op: 'stat', stat: 'reputation', add: 3 },
          { op: 'stat', stat: 'hype', add: 8 },
          { op: 'trust', character: 'investor', add: -2 },
        ],
      },
      {
        id: 'askForCustomers',
        requires: { launched: true },
        effects: [
          { op: 'stat', stat: 'cash', add: { metric: 'mrr', times: 2, min: 15_000 } },
          { op: 'trust', character: 'investor', add: -4 },
        ],
      },
      { id: 'decline', effects: [{ op: 'trust', character: 'investor', add: 4 }] },
    ],
  },
  {
    id: 'margotSeat',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1.5,
      when: { all: [{ flag: 'pricedRound' }, { trust: 'investor', lte: 30 }] },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'giveObserver',
        effects: [
          { op: 'trust', character: 'investor', add: 15 },
          { op: 'meter', meter: 'boardTension', add: 6 },
          { op: 'flag', flag: 'margotObserver', set: true },
        ],
      },
      {
        id: 'monthlyUpdates',
        effects: [
          { op: 'ap', add: -1 },
          { op: 'trust', character: 'investor', add: 8 },
        ],
      },
      {
        id: 'lawyerReads',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'trust', character: 'investor', add: -5 },
          { op: 'meter', meter: 'boardTension', add: -10 },
        ],
      },
      {
        id: 'refuse',
        effects: [
          { op: 'trust', character: 'investor', add: -10 },
          { op: 'meter', meter: 'boardTension', add: 12 },
        ],
      },
    ],
  },
  {
    id: 'margotDownRound',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1,
      when: {
        all: [
          { flag: 'pricedRound' },
          { metric: 'monthsSinceRaise', gte: 9 },
          { metric: 'userGrowth', lte: 0.05 },
        ],
      },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'cutBurn',
        effects: [
          { op: 'boost', id: 'preemptiveCuts', months: 6, mods: { burnMul: 0.9 } },
          { op: 'stat', stat: 'morale', add: -6 },
          { op: 'trust', character: 'investor', add: 8 },
        ],
      },
      {
        id: 'bluff',
        effects: [
          {
            op: 'chance',
            p: 0.4,
            then: [
              { op: 'trust', character: 'investor', add: 5 },
              { op: 'meter', meter: 'boardTension', add: -10 },
              { op: 'feed', key: 'event.margotDownRound.bluffWorked', tone: 'good' },
            ],
            else: [
              { op: 'trust', character: 'investor', add: -12 },
              { op: 'feed', key: 'event.margotDownRound.bluffCalled', tone: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'insiderRound',
        requires: { trust: 'investor', gte: 55 },
        effects: [
          { op: 'trust', character: 'investor', add: -5 },
          { op: 'schedule', consequence: 'margotInsiderRound', in: 2 },
        ],
      },
      { id: 'changeSubject', effects: [{ op: 'meter', meter: 'boardTension', add: 8 }] },
    ],
  },

  // Brexton Hale, the rival
  {
    id: 'rivalPanel',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1, when: { metric: 'month', gte: 3 } },
    minStage: 'garage',
    cooldown: 14,
    options: [
      {
        id: 'beGracious',
        effects: [
          { op: 'trust', character: 'rival', add: 10 },
          { op: 'stat', stat: 'reputation', add: 3 },
        ],
      },
      {
        id: 'roastHim',
        effects: [
          { op: 'stat', stat: 'hype', add: 12 },
          { op: 'trust', character: 'rival', add: -12 },
          { op: 'meter', meter: 'rivalThreat', add: 8 },
        ],
      },
      {
        id: 'preAnnounce',
        requires: { launched: true },
        effects: [
          { op: 'stat', stat: 'hype', add: 15 },
          { op: 'meter', meter: 'rivalThreat', add: 5 },
          { op: 'schedule', consequence: 'stageFeatureDue', in: { min: 3, max: 5 } },
        ],
      },
      {
        id: 'agreeWithEverything',
        effects: [
          { op: 'trust', character: 'rival', add: 4 },
          { op: 'stat', stat: 'reputation', add: -2 },
        ],
      },
    ],
  },
  {
    id: 'rivalPartnership',
    tone: 'good',
    trigger: {
      kind: 'random',
      weight: 1.5,
      when: { all: [{ launched: true }, { trust: 'rival', gte: 60 }] },
    },
    minStage: 'garage',
    cooldown: 18,
    options: [
      {
        id: 'integrate',
        effects: [
          { op: 'boost', id: 'rivalIntegration', months: 6, mods: { growthMul: 1.08 } },
          { op: 'trust', character: 'rival', add: 10 },
          { op: 'meter', meter: 'rivalThreat', add: -15 },
        ],
      },
      {
        id: 'coMarket',
        requires: { metric: 'cash', gte: 10_000 },
        effects: [
          { op: 'stat', stat: 'cash', add: -10_000 },
          { op: 'stat', stat: 'hype', add: 12 },
          { op: 'trust', character: 'rival', add: 5 },
        ],
      },
      {
        id: 'lawyerFirst',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'boost', id: 'rivalIntegrationSafe', months: 6, mods: { growthMul: 1.05 } },
          { op: 'meter', meter: 'rivalThreat', add: -20 },
          { op: 'trust', character: 'rival', add: 3 },
        ],
      },
      { id: 'decline', effects: [{ op: 'trust', character: 'rival', add: -6 }] },
    ],
  },
  {
    id: 'rivalFeud',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1.2,
      when: { all: [{ launched: true }, { trust: 'rival', lte: 35 }] },
    },
    minStage: 'garage',
    cooldown: 10,
    options: [
      {
        id: 'fireBack',
        effects: [
          { op: 'stat', stat: 'hype', add: 15 },
          { op: 'stat', stat: 'reputation', add: -4 },
          { op: 'trust', character: 'rival', add: -10 },
          { op: 'meter', meter: 'scandal', add: 5 },
        ],
      },
      {
        id: 'highRoad',
        effects: [
          { op: 'stat', stat: 'reputation', add: 4 },
          { op: 'trust', character: 'rival', add: 5 },
        ],
      },
      {
        id: 'briefDana',
        requires: { trust: 'journalist', gte: 55 },
        effects: [
          { op: 'meter', meter: 'rivalThreat', add: -15 },
          { op: 'trust', character: 'journalist', add: 4 },
          { op: 'trust', character: 'rival', add: -15 },
        ],
      },
      {
        id: 'internAccount',
        effects: [
          { op: 'stat', stat: 'hype', add: 20 },
          {
            op: 'chance',
            p: 0.35,
            then: [
              { op: 'meter', meter: 'scandal', add: 15 },
              { op: 'feed', key: 'event.rivalFeud.internWentTooFar', tone: 'bad' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rivalFeeler',
    tone: 'neutral',
    trigger: {
      kind: 'random',
      weight: 1,
      when: {
        all: [{ launched: true }, { trust: 'rival', gte: 50 }, { metric: 'users', gte: 500 }],
      },
    },
    minStage: 'garage',
    once: true,
    options: [
      {
        id: 'hearHimOut',
        effects: [
          { op: 'trust', character: 'rival', add: 5 },
          { op: 'schedule', consequence: 'rivalTermSheet', in: 2 },
        ],
      },
      {
        id: 'reverseIt',
        effects: [
          { op: 'trust', character: 'rival', add: -8 },
          { op: 'stat', stat: 'hype', add: 8 },
        ],
      },
      {
        id: 'tipOffDana',
        requires: { trust: 'journalist', gte: 50 },
        effects: [
          { op: 'stat', stat: 'hype', add: 10 },
          { op: 'boost', id: 'rivalInterest', months: 4, mods: { valuationMul: 1.05 } },
          { op: 'trust', character: 'rival', add: -10 },
        ],
      },
      {
        id: 'decline',
        effects: [
          { op: 'trust', character: 'rival', add: -3 },
          { op: 'stat', stat: 'morale', add: 3 },
        ],
      },
    ],
  },
  {
    id: 'rivalOffer',
    tone: 'milestone',
    trigger: { kind: 'scheduled' },
    minStage: 'garage',
    options: [
      { id: 'sell', effects: [{ op: 'ending', ending: 'acquired', valueMul: 1.1 }] },
      {
        id: 'haggle',
        effects: [
          {
            op: 'chance',
            p: 0.4,
            then: [{ op: 'ending', ending: 'acquired', valueMul: 1.4 }],
            else: [
              { op: 'trust', character: 'rival', add: -10 },
              { op: 'meter', meter: 'rivalThreat', add: 15 },
              { op: 'feed', key: 'event.rivalOffer.walkedAway', tone: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'leverage',
        requires: { flag: 'pricedRound' },
        effects: [
          { op: 'boost', id: 'rivalLeverage', months: 6, mods: { valuationMul: 1.1 } },
          { op: 'trust', character: 'investor', add: 6 },
          { op: 'trust', character: 'rival', add: -15 },
        ],
      },
      {
        id: 'decline',
        effects: [
          { op: 'trust', character: 'rival', add: -8 },
          { op: 'meter', meter: 'rivalThreat', add: 12 },
          { op: 'stat', stat: 'morale', add: 4 },
        ],
      },
    ],
  },

  // Dana Okafor, The Daily Byline
  {
    id: 'danaScoop',
    tone: 'neutral',
    trigger: { kind: 'random', weight: 1, when: { launched: true } },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'realNews',
        effects: [
          { op: 'trust', character: 'journalist', add: 12 },
          { op: 'stat', stat: 'hype', add: 6 },
        ],
      },
      {
        id: 'embellish',
        effects: [
          { op: 'stat', stat: 'hype', add: 15 },
          { op: 'meter', meter: 'scandal', add: 8 },
          { op: 'schedule', consequence: 'scoopChecked', in: { min: 2, max: 3 } },
        ],
      },
      {
        id: 'aiAngle',
        requires: { flag: 'aiFeature' },
        effects: [
          { op: 'stat', stat: 'hype', add: 12 },
          { op: 'trust', character: 'journalist', add: 4 },
        ],
      },
      { id: 'noComment', effects: [{ op: 'trust', character: 'journalist', add: -6 }] },
    ],
  },
  {
    id: 'danaCorrection',
    tone: 'bad',
    trigger: { kind: 'scheduled' },
    minStage: 'garage',
    options: [
      {
        id: 'admitIt',
        effects: [
          { op: 'trust', character: 'journalist', add: -6 },
          { op: 'stat', stat: 'reputation', add: -4 },
          { op: 'meter', meter: 'scandal', add: -8 },
        ],
      },
      {
        id: 'doubleDown',
        effects: [
          { op: 'trust', character: 'journalist', add: -15 },
          { op: 'meter', meter: 'scandal', add: 15 },
          { op: 'stat', stat: 'reputation', add: -3 },
        ],
      },
      {
        id: 'blameCofounder',
        requires: { cofounder: true },
        effects: [
          { op: 'trust', character: 'cofounder', add: -15 },
          { op: 'trust', character: 'journalist', add: -3 },
          { op: 'meter', meter: 'scandal', add: -5 },
        ],
      },
      {
        id: 'tradeUp',
        requires: { trust: 'journalist', gte: 45 },
        effects: [
          { op: 'trust', character: 'journalist', add: 3 },
          { op: 'stat', stat: 'hype', add: -5 },
          { op: 'meter', meter: 'scandal', add: -8 },
        ],
      },
    ],
  },
  {
    id: 'danaFactCheck',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 1,
      when: { all: [{ launched: true }, { metric: 'users', gte: 300 }] },
    },
    minStage: 'garage',
    cooldown: 14,
    options: [
      {
        id: 'fixWebsite',
        effects: [
          { op: 'trust', character: 'journalist', add: 8 },
          { op: 'stat', stat: 'reputation', add: 3 },
          { op: 'stat', stat: 'hype', add: -5 },
        ],
      },
      {
        id: 'standByIt',
        effects: [
          {
            op: 'chance',
            p: 0.5,
            then: [
              { op: 'stat', stat: 'hype', add: 5 },
              { op: 'feed', key: 'event.danaFactCheck.heldUp', tone: 'good' },
            ],
            else: [
              { op: 'stat', stat: 'reputation', add: -8 },
              { op: 'meter', meter: 'scandal', add: 10 },
              { op: 'trust', character: 'journalist', add: -8 },
              { op: 'feed', key: 'event.danaFactCheck.fellApart', tone: 'bad' },
            ],
          },
        ],
      },
      {
        id: 'sendDashboard',
        requires: { trust: 'journalist', gte: 40 },
        effects: [
          { op: 'trust', character: 'journalist', add: 10 },
          { op: 'stat', stat: 'reputation', add: 4 },
        ],
      },
      {
        id: 'lawyerLetter',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'trust', character: 'journalist', add: -12 },
          { op: 'stat', stat: 'cash', add: -3000 },
        ],
      },
    ],
  },
  {
    id: 'danaHeadsUp',
    tone: 'warn',
    trigger: {
      kind: 'random',
      weight: 2,
      when: {
        all: [
          { trust: 'journalist', gte: 65 },
          { metric: 'scandal', gte: 25 },
        ],
      },
    },
    minStage: 'garage',
    cooldown: 10,
    options: [
      {
        id: 'getAhead',
        effects: [
          { op: 'stat', stat: 'reputation', add: -3 },
          { op: 'meter', meter: 'scandal', add: -25 },
          { op: 'trust', character: 'journalist', add: 5 },
        ],
      },
      {
        id: 'giveComment',
        effects: [
          { op: 'meter', meter: 'scandal', add: -10 },
          { op: 'trust', character: 'journalist', add: 3 },
        ],
      },
      {
        id: 'askToSpike',
        effects: [
          { op: 'trust', character: 'journalist', add: -15 },
          { op: 'meter', meter: 'scandal', add: -5 },
        ],
      },
      {
        id: 'lawyerCall',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -10_000 },
          { op: 'meter', meter: 'scandal', add: -15 },
          { op: 'trust', character: 'journalist', add: -5 },
        ],
      },
    ],
  },
  {
    id: 'danaHitPiece',
    tone: 'bad',
    trigger: {
      kind: 'random',
      weight: 1.5,
      when: { all: [{ launched: true }, { trust: 'journalist', lte: 25 }] },
    },
    minStage: 'garage',
    cooldown: 12,
    options: [
      {
        id: 'respondCalmly',
        effects: [
          { op: 'stat', stat: 'reputation', add: -3 },
          { op: 'trust', character: 'journalist', add: 5 },
        ],
      },
      {
        id: 'threadAtMidnight',
        effects: [
          { op: 'stat', stat: 'hype', add: 10 },
          { op: 'stat', stat: 'reputation', add: -8 },
          { op: 'trust', character: 'journalist', add: -10 },
          { op: 'meter', meter: 'scandal', add: 5 },
        ],
      },
      {
        id: 'lawyerUp',
        requires: { flag: 'lawyer' },
        effects: [
          { op: 'stat', stat: 'cash', add: -15_000 },
          { op: 'stat', stat: 'reputation', add: -2 },
          { op: 'trust', character: 'journalist', add: -10 },
        ],
      },
      {
        id: 'inviteHerIn',
        effects: [
          {
            op: 'chance',
            p: 1,
            per: { metric: 'scandal', slope: -0.015 },
            then: [
              { op: 'trust', character: 'journalist', add: 15 },
              { op: 'stat', stat: 'reputation', add: 3 },
              { op: 'feed', key: 'event.danaHitPiece.visitWentWell', tone: 'good' },
            ],
            else: [
              { op: 'meter', meter: 'scandal', add: 15 },
              { op: 'feed', key: 'event.danaHitPiece.visitBackfired', tone: 'bad' },
            ],
          },
        ],
      },
    ],
  },
];

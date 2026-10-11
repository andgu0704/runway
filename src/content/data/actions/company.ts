import type { Action } from '../../schema/records';

export const companyActions: Action[] = [
  {
    id: 'writeValues',
    tab: 'company',
    ap: 1,
    minStage: 'garage',
    once: true,
    timeline: true,
    effects: [
      { op: 'stat', stat: 'morale', add: 6 },
      { op: 'stat', stat: 'reputation', add: 2 },
      { op: 'flag', flag: 'hasValues', set: true },
      { op: 'feed', key: 'action.writeValues.feed', tone: 'good' },
    ],
  },
  {
    id: 'retainLawyer',
    tab: 'company',
    ap: 1,
    cost: 6000,
    minStage: 'garage',
    once: true,
    timeline: true,
    effects: [
      { op: 'flag', flag: 'lawyer', set: true },
      { op: 'boost', id: 'lawyerRetainer', months: 999, mods: { burnMul: 1.03 } },
      { op: 'feed', key: 'action.retainLawyer.feed', tone: 'neutral' },
    ],
  },
  {
    id: 'boardDinner',
    tab: 'company',
    ap: 1,
    cost: 1500,
    minStage: 'garage',
    cooldown: 3,
    visibleWhen: { metric: 'investorSeats', gte: 1 },
    effects: [
      { op: 'meter', meter: 'boardTension', add: -15 },
      { op: 'trust', character: 'investor', add: 4 },
      { op: 'feed', key: 'action.boardDinner.feed', tone: 'quote' },
    ],
  },
  {
    id: 'donateToCause',
    tab: 'company',
    ap: 1,
    cost: { metric: 'cash', times: 0.02, min: 1000 },
    minStage: 'garage',
    cooldown: 12,
    effects: [
      { op: 'stat', stat: 'reputation', add: 3 },
      { op: 'stat', stat: 'morale', add: 3 },
      { op: 'flag', flag: 'goodDeeds', add: 1 },
      { op: 'feed', key: 'action.donateToCause.feed', tone: 'good' },
    ],
  },
];

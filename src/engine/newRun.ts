import { CHARACTER_IDS, METER_IDS, type CharacterId, type MeterId } from '../content/schema/ids';
import { must, type ContentPack } from './content';
import { addFeed } from './log';
import { clamp } from './math';
import { seedRng } from './rng';
import { STATE_SCHEMA_VERSION, type GameState, type RunSetup } from './state';

export type SetupError =
  'unknownBackground' | 'unknownMarket' | 'modelNotInMarket' | 'unknownCofounder' | 'badName';

export function validateSetup(setup: RunSetup, content: ContentPack): SetupError | null {
  if (!content.backgrounds.has(setup.background)) return 'unknownBackground';
  const market = content.markets.get(setup.market);
  if (market === undefined) return 'unknownMarket';
  if (!market.models.some((m) => m.model === setup.model)) return 'modelNotInMarket';
  if (setup.cofounder !== null && !content.cofounders.has(setup.cofounder))
    return 'unknownCofounder';
  const valid = (name: string) => name.trim().length > 0 && name.trim().length <= 40;
  if (!valid(setup.companyName) || !valid(setup.founderName)) return 'badName';
  return null;
}

export function newRun(seed: number, setup: RunSetup, content: ContentPack): GameState {
  const error = validateSetup(setup, content);
  if (error !== null) throw new Error(`Invalid run setup: ${error}`);
  const background = must(content.backgrounds, setup.background, 'background');
  const market = must(content.markets, setup.market, 'market');
  const modelConfig = market.models.find((m) => m.model === setup.model);
  const cofounder =
    setup.cofounder === null ? null : must(content.cofounders, setup.cofounder, 'cofounder');
  const firstStage = content.stageOrder[0];
  if (firstStage === undefined || modelConfig === undefined)
    throw new Error('Content has no stages');

  const trust = {} as Record<CharacterId, number>;
  for (const id of CHARACTER_IDS) {
    const base = must(content.characters, id, 'character').startTrust;
    const start = id === 'cofounder' && cofounder !== null ? cofounder.startTrust : base;
    trust[id] = clamp(start + (background.startTrust[id] ?? 0), 0, 100);
  }
  const meters = {} as Record<MeterId, number>;
  const meterWarned = {} as Record<MeterId, number>;
  for (const id of METER_IDS) {
    meters[id] = 0;
    meterWarned[id] = 0;
  }

  const stats: GameState['stats'] = {
    cash: content.rules.startCash,
    users: 0,
    quality: 20,
    morale: 75,
    reputation: 40,
    bugs: 0,
    techDebt: 0,
    hype: 10,
  };
  for (const [stat, delta] of Object.entries(background.startStats)) {
    stats[stat as keyof typeof stats] += delta;
  }

  const cofounderBps = cofounder?.equityBps ?? 0;
  const state: GameState = {
    schema: STATE_SCHEMA_VERSION,
    seed,
    rng: seedRng(seed),
    nextId: 0,
    setup: {
      ...setup,
      companyName: setup.companyName.trim(),
      founderName: setup.founderName.trim(),
    },
    month: 0,
    stage: firstStage.id,
    ap: { used: 0, max: firstStage.actionPoints },
    stats,
    meters,
    meterWarned,
    marketMood: 1,
    settings: {
      price: modelConfig.fairPrice,
      marketingBudget: 0,
      model: setup.model,
      policies: [],
      orders: {},
    },
    product: {
      launched: false,
      launchMonth: null,
      roadmap: [],
      shipped: [],
      lowFitUsers: 0,
      waitlist: 0,
    },
    team: [],
    candidates: [],
    cofounderPresent: cofounder !== null,
    trust,
    capTable:
      cofounder === null
        ? [{ holder: 'founder', bps: 10_000 }]
        : [
            { holder: 'founder', bps: 10_000 - cofounderBps },
            { holder: 'cofounder', bps: cofounderBps },
          ],
    board: cofounder === null ? ['founder'] : ['founder', 'cofounder'],
    rounds: [],
    investorCooldowns: {},
    negotiation: null,
    flags: {},
    boosts: [],
    scheduled: [],
    pendingEvent: null,
    eventLastSeen: {},
    actionLastUsed: {},
    boardLowChecks: 0,
    history: [],
    feed: [],
    timeline: [],
    ending: null,
  };
  addFeed(state, content, 'feed.intro.dayOne', 'milestone', {
    background: background.id,
    market: market.id,
  });
  addFeed(state, content, 'feed.intro.howTo', 'neutral');
  if (cofounder !== null)
    addFeed(state, content, 'feed.intro.cofounder', 'quote', { name: cofounder.name });
  return state;
}

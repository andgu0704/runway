import type {
  Action,
  Background,
  BusinessModel,
  Character,
  Cofounder,
  Consequence,
  ContentPackData,
  Ending,
  Feature,
  GameEvent,
  Investor,
  Market,
  Meter,
  Policy,
  Role,
  Stage,
  Trait,
} from '../content/schema/records';
import type { CharacterId, MeterId } from '../content/schema/ids';

export interface ContentPack {
  data: ContentPackData;
  rules: ContentPackData['rules'];
  models: Map<string, BusinessModel>;
  markets: Map<string, Market>;
  backgrounds: Map<string, Background>;
  cofounders: Map<string, Cofounder>;
  stages: Map<string, Stage>;
  stageOrder: Stage[];
  features: Map<string, Feature>;
  roles: Map<string, Role>;
  traits: Map<string, Trait>;
  policies: Map<string, Policy>;
  meters: Map<MeterId, Meter>;
  characters: Map<CharacterId, Character>;
  investors: Map<string, Investor>;
  actions: Map<string, Action>;
  events: Map<string, GameEvent>;
  consequences: Map<string, Consequence>;
  endings: Map<string, Ending>;
}

function byId<T extends { id: K }, K extends string>(items: readonly T[]): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Duplicate content id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

export function indexContent(data: ContentPackData): ContentPack {
  return {
    data,
    rules: data.rules,
    models: byId(data.models),
    markets: byId(data.markets),
    backgrounds: byId(data.backgrounds),
    cofounders: byId(data.cofounders),
    stages: byId(data.stages),
    stageOrder: [...data.stages].sort((a, b) => a.order - b.order),
    features: byId(data.features),
    roles: byId(data.roles),
    traits: byId(data.traits),
    policies: byId(data.policies),
    meters: byId(data.meters),
    characters: byId(data.characters),
    investors: byId(data.investors),
    actions: byId(data.actions),
    events: byId(data.events),
    consequences: byId(data.consequences),
    endings: byId(data.endings),
  };
}

/** Looks up a record and throws a descriptive error when content is inconsistent. */
export function must<T>(map: Map<string, T>, id: string, kind: string): T {
  const value = map.get(id);
  if (value === undefined) throw new Error(`Unknown ${kind}: ${id}`);
  return value;
}

export function stageIndex(content: ContentPack, stageId: string): number {
  return must(content.stages, stageId, 'stage').order;
}

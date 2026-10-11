import type { ContentPackData } from './schema/records';
import { effectSites, walkEffects } from './walk';

/** Message keys the engine emits directly, independent of content. */
export const ENGINE_MESSAGE_KEYS = [
  'feed.hired',
  'feed.resigned',
  'feed.fired',
  'feed.poached',
  'feed.traitRevealed',
  'feed.noInvestors',
  'feed.negotiationOpened',
  'feed.investorWalked',
  'feed.youWalked',
  'feed.dealClosed',
  'feed.boardSeatAdded',
  'feed.launched',
  'feed.cofounderLeft',
  'feed.layoffs',
  'feed.autoQueued',
  'feed.shipped',
  'feed.pipelineCandidates',
  'feed.monthClosed',
  'feed.monthClosedPrelaunch',
  'feed.stageReached',
  'feed.intro.dayOne',
  'feed.intro.howTo',
  'feed.intro.cofounder',
  'timeline.dealClosed',
  'timeline.shipped',
  'timeline.stageReached',
  'timeline.eventChoice',
  'cause.shipped',
] as const;

function hasSchedule(effects: Parameters<typeof walkEffects>[0]): boolean {
  let found = false;
  walkEffects(effects, (e) => {
    if (e.op === 'schedule') found = true;
  });
  return found;
}

/** Every key the content needs a translation for. */
export function requiredMessageKeys(data: ContentPackData): string[] {
  const keys = new Set<string>(ENGINE_MESSAGE_KEYS);
  const add = (...items: string[]) => {
    for (const k of items) keys.add(k);
  };

  for (const m of data.markets) add(`market.${m.id}.name`, `market.${m.id}.pitch`);
  for (const m of data.models)
    add(`model.${m.id}.name`, `model.${m.id}.desc`, `model.${m.id}.unit`);
  for (const b of data.backgrounds)
    add(
      `background.${b.id}.name`,
      `background.${b.id}.desc`,
      `background.${b.id}.drawback`,
      `background.${b.id}.article`,
    );
  for (const c of data.cofounders) add(`cofounder.${c.id}.pitch`);
  for (const s of data.stages) add(`stage.${s.id}.name`, `stage.${s.id}.desc`);
  for (const f of data.features) add(`feature.${f.id}.name`, `feature.${f.id}.desc`);
  for (const r of data.roles) {
    add(`role.${r.id}.name`);
    for (const o of r.orders ?? []) add(`order.${r.id}.${o.id}.name`, `order.${r.id}.${o.id}.desc`);
  }
  for (const t of data.traits) add(`trait.${t.id}.name`, `trait.${t.id}.desc`);
  for (const p of data.policies) add(`policy.${p.id}.name`, `policy.${p.id}.desc`);
  for (const m of data.meters) for (const w of m.warnings) add(w.key);
  for (const c of data.characters) add(`character.${c.id}.role`, `character.${c.id}.bio`);
  for (const i of data.investors) add(`investor.${i.id}.name`, `investor.${i.id}.blurb`);
  for (const e of data.endings) {
    add(
      `ending.${e.id}.title`,
      `ending.${e.id}.headline`,
      `ending.${e.id}.deck`,
      `ending.${e.id}.feed`,
      `ending.${e.id}.timeline`,
    );
  }
  for (const a of data.actions) {
    add(`action.${a.id}.name`, `action.${a.id}.desc`);
    if (a.timeline === true) add(`action.${a.id}.timeline`);
    if (hasSchedule(a.effects)) add(`action.${a.id}.cause`);
  }
  for (const e of data.events) {
    add(`event.${e.id}.title`, `event.${e.id}.body`);
    for (const o of e.options) {
      add(`event.${e.id}.option.${o.id}.label`, `event.${e.id}.option.${o.id}.result`);
      if (hasSchedule(o.effects)) add(`event.${e.id}.option.${o.id}.cause`);
    }
  }
  for (const c of data.consequences)
    add(`consequence.${c.id}.feed`, `consequence.${c.id}.timeline`);
  for (const site of effectSites(data)) {
    walkEffects(site.effects, (e) => {
      if (e.op === 'feed') add(e.key);
    });
  }
  return [...keys].sort();
}

/** Looks up a dotted key in nested resources; strings and arrays of strings both count. */
export function hasMessage(resources: Record<string, unknown>, key: string): boolean {
  let node: unknown = resources;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node === 'string') return node.trim().length > 0;
  return (
    Array.isArray(node) &&
    node.length > 0 &&
    node.every((v) => typeof v === 'string' && v.trim().length > 0)
  );
}

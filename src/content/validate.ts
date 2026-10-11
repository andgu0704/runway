import { contentPackSchema, type ContentPackData } from './schema/records';
import { conditionSites, effectSites, walkConditions, walkEffects } from './walk';

/** Flags the engine sets itself, outside of content effects. */
const ENGINE_FLAGS = ['pricedRound', 'angelRound', 'shadyActs', 'layoffs'];

export interface ValidationReport {
  ok: boolean;
  errors: string[];
}

function crossReference(data: ContentPackData): string[] {
  const errors: string[] = [];
  const ids = (items: readonly { id: string }[]) => new Set(items.map((i) => i.id));
  const stages = ids(data.stages);
  const roles = ids(data.roles);
  const traits = ids(data.traits);
  const policies = ids(data.policies);
  const markets = ids(data.markets);
  const backgrounds = ids(data.backgrounds);
  const models = ids(data.models);
  const features = ids(data.features);
  const consequences = ids(data.consequences);
  const endings = ids(data.endings);
  const events = ids(data.events);
  const actions = ids(data.actions);

  const need = (set: Set<string>, id: string, kind: string, where: string) => {
    if (!set.has(id)) errors.push(`${where}: unknown ${kind} "${id}"`);
  };

  for (const id of Object.values(data.rules.endings)) need(endings, id, 'ending', 'rules.endings');
  for (const s of data.stages)
    if (s.ending !== undefined) need(endings, s.ending, 'ending', `stage.${s.id}`);
  for (const m of data.markets)
    for (const mm of m.models) need(models, mm.model, 'model', `market.${m.id}`);
  for (const b of data.backgrounds) need(actions, b.uniqueAction, 'action', `background.${b.id}`);
  for (const r of data.roles) need(stages, r.minStage, 'stage', `role.${r.id}`);
  for (const p of data.policies) need(stages, p.minStage, 'stage', `policy.${p.id}`);
  for (const t of data.traits)
    for (const r of t.roles ?? []) need(roles, r, 'role', `trait.${t.id}`);
  for (const f of data.features) {
    for (const m of Object.keys(f.markets ?? {})) need(markets, m, 'market', `feature.${f.id}`);
  }
  for (const i of data.investors)
    for (const s of i.stages) need(stages, s, 'stage', `investor.${i.id}`);
  for (const c of data.characters)
    for (const t of c.tiers) {
      if (t.minStage !== undefined) need(stages, t.minStage, 'stage', `character.${c.id}`);
    }
  for (const a of data.actions) {
    need(stages, a.minStage, 'stage', `action.${a.id}`);
    if (a.maxStage !== undefined) need(stages, a.maxStage, 'stage', `action.${a.id}`);
  }
  for (const e of data.events) {
    need(stages, e.minStage, 'stage', `event.${e.id}`);
    for (const r of e.subject?.roles ?? []) need(roles, r, 'role', `event.${e.id}.subject`);
    if (e.subject?.trait !== undefined)
      need(traits, e.subject.trait, 'trait', `event.${e.id}.subject`);
    const optionIds = new Set(e.options.map((o) => o.id));
    if (optionIds.size !== e.options.length) errors.push(`event.${e.id}: duplicate option ids`);
  }
  for (const c of data.consequences)
    if (c.event !== undefined) need(events, c.event, 'event', `consequence.${c.id}`);

  for (const site of conditionSites(data)) {
    walkConditions(site.condition, (c) => {
      if ('stage' in c) for (const s of c.stage) need(stages, s, 'stage', site.where);
      if ('stageAtLeast' in c) need(stages, c.stageAtLeast, 'stage', site.where);
      if ('hasRole' in c) need(roles, c.hasRole, 'role', site.where);
      if ('hasTrait' in c) need(traits, c.hasTrait, 'trait', site.where);
      if ('policy' in c) need(policies, c.policy, 'policy', site.where);
      if ('market' in c) for (const m of c.market) need(markets, m, 'market', site.where);
      if ('background' in c)
        for (const b of c.background) need(backgrounds, b, 'background', site.where);
      if ('model' in c) for (const m of c.model) need(models, m, 'model', site.where);
      if ('shipped' in c) need(features, c.shipped, 'feature', site.where);
      if ('subjectRole' in c) for (const r of c.subjectRole) need(roles, r, 'role', site.where);
      if ('subjectTrait' in c) need(traits, c.subjectTrait, 'trait', site.where);
    });
  }

  const settableFlags = new Set(ENGINE_FLAGS);
  const scheduled = new Set<string>();
  const raisedByConsequence = new Set(
    data.consequences.flatMap((c) => (c.event === undefined ? [] : [c.event])),
  );
  for (const site of effectSites(data)) {
    walkEffects(site.effects, (e) => {
      if (e.op === 'flag' && (e.set !== false || e.add !== undefined)) settableFlags.add(e.flag);
      if (e.op === 'schedule') {
        scheduled.add(e.consequence);
        need(consequences, e.consequence, 'consequence', site.where);
      }
      if (e.op === 'ending') need(endings, e.ending, 'ending', site.where);
      if (e.op === 'candidates' && e.role !== undefined) need(roles, e.role, 'role', site.where);
    });
  }
  for (const site of conditionSites(data)) {
    walkConditions(site.condition, (c) => {
      if ('flag' in c && !settableFlags.has(c.flag)) {
        errors.push(`${site.where}: flag "${c.flag}" is never set by any content`);
      }
    });
  }
  for (const c of data.consequences) {
    if (!scheduled.has(c.id)) errors.push(`consequence.${c.id}: never scheduled`);
  }
  for (const e of data.events) {
    if (e.trigger.kind === 'scheduled' && !raisedByConsequence.has(e.id)) {
      errors.push(`event.${e.id}: scheduled but no consequence raises it`);
    }
    if (e.trigger.kind === 'meter' && e.disaster === true) {
      const meterId = e.trigger.meter;
      const meter = data.meters.find((m) => m.id === meterId);
      const first = meter?.warnings[0]?.at ?? Infinity;
      if (first > e.trigger.at)
        errors.push(`event.${e.id}: disaster fires before any foreshadowing`);
    }
  }
  return errors;
}

export function validateContent(input: unknown): ValidationReport {
  const parsed = contentPackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }
  const errors = crossReference(parsed.data);
  return { ok: errors.length === 0, errors };
}

import type { Condition, Effect } from './schema/logic';
import type { ContentPackData } from './schema/records';

/** Every condition in a tree, including nested ones. */
export function walkConditions(
  condition: Condition | undefined,
  visit: (c: Condition) => void,
): void {
  if (condition === undefined) return;
  visit(condition);
  if ('all' in condition) for (const c of condition.all) walkConditions(c, visit);
  if ('any' in condition) for (const c of condition.any) walkConditions(c, visit);
  if ('not' in condition) walkConditions(condition.not, visit);
}

/** Every effect in a list, including the branches of `chance` effects. */
export function walkEffects(
  effects: readonly Effect[] | undefined,
  visit: (e: Effect) => void,
): void {
  for (const effect of effects ?? []) {
    visit(effect);
    if (effect.op === 'chance') {
      walkEffects(effect.then, visit);
      walkEffects(effect.else, visit);
    }
  }
}

export interface EffectSite {
  where: string;
  effects: readonly Effect[];
}

export interface ConditionSite {
  where: string;
  condition: Condition | undefined;
}

export function effectSites(data: ContentPackData): EffectSite[] {
  return [
    ...data.actions.map((a) => ({ where: `action.${a.id}`, effects: a.effects })),
    ...data.events.flatMap((e) =>
      e.options.map((o) => ({ where: `event.${e.id}.option.${o.id}`, effects: o.effects })),
    ),
    ...data.consequences.map((c) => ({ where: `consequence.${c.id}`, effects: c.effects })),
    ...data.features.map((f) => ({ where: `feature.${f.id}`, effects: f.onShip ?? [] })),
  ];
}

export function conditionSites(data: ContentPackData): ConditionSite[] {
  return [
    ...data.actions.flatMap((a) => [
      { where: `action.${a.id}.when`, condition: a.when },
      { where: `action.${a.id}.visibleWhen`, condition: a.visibleWhen },
    ]),
    ...data.events.flatMap((e) => [
      {
        where: `event.${e.id}.trigger`,
        condition: 'when' in e.trigger ? e.trigger.when : undefined,
      },
      ...e.options.flatMap((o) => [
        { where: `event.${e.id}.option.${o.id}.requires`, condition: o.requires },
        { where: `event.${e.id}.option.${o.id}.visibleWhen`, condition: o.visibleWhen },
      ]),
    ]),
    ...data.stages.map((s) => ({ where: `stage.${s.id}.entry`, condition: s.entry ?? undefined })),
    ...data.features.map((f) => ({ where: `feature.${f.id}.requires`, condition: f.requires })),
    ...data.investors.map((i) => ({ where: `investor.${i.id}.when`, condition: i.when })),
  ];
}

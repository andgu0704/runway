import { MOD_KEYS, type ModKey, type Mods } from '../content/schema/mods';
import { must, stageIndex, type ContentPack } from './content';
import type { Employee, GameState } from './state';

export type ResolvedMods = Record<ModKey, number>;

const KEYS = Object.keys(MOD_KEYS) as ModKey[];

export function neutralMods(): ResolvedMods {
  const out = {} as ResolvedMods;
  for (const key of KEYS) out[key] = MOD_KEYS[key] === 'mul' ? 1 : 0;
  return out;
}

export function combineInto(target: ResolvedMods, mods: Mods, scale = 1): void {
  for (const key of KEYS) {
    const value = mods[key];
    if (value === undefined) continue;
    if (MOD_KEYS[key] === 'mul') target[key] *= 1 + (value - 1) * scale;
    else target[key] += value * scale;
  }
}

/** How well an executive carries out their standing order (0.7 to 1.2). */
export function executiveEfficiency(employee: Employee, content: ContentPack): number {
  let skill = employee.skill;
  for (const traitId of employee.traits) skill += content.traits.get(traitId)?.skill ?? 0;
  return Math.min(1.2, Math.max(0.7, 0.6 + 0.1 * skill));
}

/** Company-wide modifiers from every source currently in play. */
export function companyMods(state: GameState, content: ContentPack): ResolvedMods {
  const mods = neutralMods();
  combineInto(mods, must(content.backgrounds, state.setup.background, 'background').mods);
  if (state.cofounderPresent && state.setup.cofounder !== null) {
    combineInto(mods, must(content.cofounders, state.setup.cofounder, 'cofounder').mods);
  }
  for (const policyId of state.settings.policies) {
    combineInto(mods, must(content.policies, policyId, 'policy').mods);
  }
  for (const boost of state.boosts) combineInto(mods, boost.mods);

  const currentStage = stageIndex(content, state.stage);
  for (const character of content.data.characters) {
    if (character.id === 'cofounder' && !state.cofounderPresent) continue;
    const trust = state.trust[character.id];
    for (const tier of character.tiers) {
      if (trust < tier.min) continue;
      if (tier.minStage !== undefined && currentStage < stageIndex(content, tier.minStage)) {
        continue;
      }
      combineInto(mods, tier.mods);
    }
  }

  for (const employee of state.team) {
    for (const traitId of employee.traits) {
      combineInto(mods, must(content.traits, traitId, 'trait').team);
    }
    const role = must(content.roles, employee.role, 'role');
    if (role.kind !== 'executive' || role.orders === undefined) continue;
    const orderId = state.settings.orders[role.id] ?? role.defaultOrder;
    const order = role.orders.find((o) => o.id === orderId);
    if (order !== undefined) combineInto(mods, order.mods, executiveEfficiency(employee, content));
  }
  return mods;
}

/** Modifiers that only apply to one employee's own output and behaviour. */
export function employeeMods(employee: Employee, content: ContentPack): ResolvedMods {
  const mods = neutralMods();
  for (const traitId of employee.traits) {
    combineInto(mods, must(content.traits, traitId, 'trait').self);
  }
  return mods;
}

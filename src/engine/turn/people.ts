import type { ContentPack } from '../content';
import { capacity, runwayMonths } from '../economy';
import { addFeed } from '../log';
import { clamp } from '../math';
import { employeeMods, type ResolvedMods } from '../mods';
import { chance, pick } from '../rng';
import type { GameState } from '../state';
import { addCandidates, expireCandidates, removeEmployee, revealOverTime } from '../team';

export function moraleTarget(state: GameState, content: ContentPack, mods: ResolvedMods): number {
  const people = capacity(state, content, 'people', mods);
  const runway = runwayMonths(state, content);
  const fear = runway < 3 ? 12 : runway < 6 ? 5 : 0;
  return clamp(66 - state.meters.burnout * 0.3 + Math.min(12, people * 0.6) - fear, 5, 95);
}

export function peopleStep(state: GameState, content: ContentPack, mods: ResolvedMods): void {
  const target = moraleTarget(state, content, mods);
  state.stats.morale = clamp(
    state.stats.morale + (target - state.stats.morale) * 0.2 + mods.moraleDrift,
    0,
    100,
  );

  const departures: string[] = [];
  for (const employee of state.team) {
    employee.mood = Math.round(employee.mood * 0.8);
    const own = employeeMods(employee, content);
    const unhappiness = Math.max(0, 55 - state.stats.morale - employee.mood) / 15;
    const p =
      content.rules.resignBase *
      own.resignMul *
      mods.resignMul *
      (1 + unhappiness) *
      (1 + state.meters.burnout / 50) *
      (1 + state.meters.rivalThreat / 200);
    if (chance(state.rng, clamp(p, 0, 0.6))) departures.push(employee.id);
  }
  for (const id of departures) {
    const poached = state.meters.rivalThreat > 50 && chance(state.rng, 0.4);
    removeEmployee(state, content, id, poached ? 'poached' : 'resigned');
    state.stats.morale = clamp(state.stats.morale - 2, 0, 100);
  }

  revealOverTime(state, content);
  expireCandidates(state);
  const free = Math.round(mods.freeCandidates);
  if (free > 0) {
    const roles = content.data.roles.filter((r) => r.kind === 'ic').map((r) => r.id);
    for (let i = 0; i < free; i++) addCandidates(state, content, pick(state.rng, roles), 1);
    addFeed(state, content, 'feed.pipelineCandidates', 'neutral', { count: free });
  }
}

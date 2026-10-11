import type { Trait } from '../content/schema/records';
import { grantFromPool } from './capTable';
import { must, type ContentPack } from './content';
import { addFeed, newId } from './log';
import { clamp, lerp } from './math';
import { companyMods } from './mods';
import { chance, pick, pickWeighted, randInt, randRange } from './rng';
import type { Candidate, Employee, GameState } from './state';

function uniqueName(state: GameState, content: ContentPack): string {
  const taken = new Set([...state.team.map((e) => e.name), ...state.candidates.map((c) => c.name)]);
  for (let attempt = 0; attempt < 20; attempt++) {
    const name = `${pick(state.rng, content.data.names.first)} ${pick(state.rng, content.data.names.last)}`;
    if (!taken.has(name)) return name;
  }
  return `${pick(state.rng, content.data.names.first)} ${pick(state.rng, content.data.names.last)}-${state.nextId}`;
}

function drawTraits(state: GameState, content: ContentPack, role: string): string[] {
  const eligible = content.data.traits.filter(
    (t) => t.roles === undefined || t.roles.includes(role),
  );
  const count = pickWeighted(state.rng, [1, 2, 3], (n) => (n === 1 ? 3 : n === 2 ? 5 : 2)) ?? 2;
  const chosen: Trait[] = [];
  for (let i = 0; i < count; i++) {
    const remaining = eligible.filter((t) => !chosen.includes(t));
    const trait = pickWeighted(state.rng, remaining, (t) => t.weight);
    if (trait !== null) chosen.push(trait);
  }
  return chosen.map((t) => t.id);
}

export function generateCandidate(
  state: GameState,
  content: ContentPack,
  roleId: string,
): Candidate {
  const role = must(content.roles, roleId, 'role');
  const stage = must(content.stages, state.stage, 'stage');
  const mods = companyMods(state, content);
  const reputationBonus = state.stats.reputation >= 70 ? 1 : state.stats.reputation < 30 ? -1 : 0;
  const traits = drawTraits(state, content, roleId);
  const traitSkill = traits.reduce((acc, id) => acc + (content.traits.get(id)?.skill ?? 0), 0);
  const skill = clamp(
    randInt(state.rng, 1, 4) + reputationBonus + Math.round(mods.candidateSkill) + traitSkill,
    1,
    5,
  );
  const t = (skill - 1) / 4;
  const salary =
    Math.round(
      (lerp(role.salary[0], role.salary[1], t) *
        stage.salaryMul *
        randRange(state.rng, 0.92, 1.08)) /
        1000,
    ) * 1000;
  const equityScale = Math.pow(1 / stage.salaryMul, 1.5);
  const equityBps = Math.round(lerp(role.equityAsk[0], role.equityAsk[1], t) * equityScale);
  const revealed = traits.filter((id) => content.traits.get(id)?.hidden !== true);
  return {
    id: `c${newId(state)}`,
    name: uniqueName(state, content),
    role: roleId,
    skill,
    salary,
    equityBps,
    traits,
    revealed,
    expires: state.month + content.rules.candidateLifetime,
  };
}

export function addCandidates(
  state: GameState,
  content: ContentPack,
  roleId: string,
  count: number,
): void {
  for (let i = 0; i < count; i++) state.candidates.push(generateCandidate(state, content, roleId));
}

export function hireCandidate(
  state: GameState,
  content: ContentPack,
  candidateId: string,
): Employee {
  const index = state.candidates.findIndex((c) => c.id === candidateId);
  const candidate = state.candidates[index];
  if (candidate === undefined) throw new Error(`Unknown candidate: ${candidateId}`);
  state.candidates.splice(index, 1);
  const employee: Employee = {
    id: `e${newId(state)}`,
    name: candidate.name,
    role: candidate.role,
    skill: candidate.skill,
    salary: candidate.salary,
    traits: candidate.traits,
    revealed: candidate.revealed,
    equityBps: candidate.equityBps,
    hiredMonth: state.month,
    mood: 5,
  };
  state.team.push(employee);
  if (employee.equityBps > 0) grantFromPool(state, `emp:${employee.id}`, employee.equityBps);
  addFeed(state, content, 'feed.hired', 'good', { name: employee.name, role: employee.role });
  return employee;
}

export type DepartureReason = 'resigned' | 'fired' | 'poached';

export function removeEmployee(
  state: GameState,
  content: ContentPack,
  employeeId: string,
  reason: DepartureReason,
): void {
  const index = state.team.findIndex((e) => e.id === employeeId);
  const employee = state.team[index];
  if (employee === undefined) return;
  state.team.splice(index, 1);
  const role = content.roles.get(employee.role);
  if (role?.kind === 'executive') Reflect.deleteProperty(state.settings.orders, employee.role);
  if (reason === 'fired') {
    state.stats.cash -= Math.round((employee.salary / 12) * content.rules.severanceMonths);
  }
  const tone = reason === 'fired' ? 'neutral' : 'bad';
  addFeed(state, content, `feed.${reason}`, tone, { name: employee.name, role: employee.role });
}

/** Hidden traits surface over time once someone has joined. */
export function revealOverTime(state: GameState, content: ContentPack): void {
  for (const employee of state.team) {
    for (const traitId of employee.traits) {
      if (employee.revealed.includes(traitId)) continue;
      const months = state.month - employee.hiredMonth;
      if (months >= 1 && chance(state.rng, 0.25)) {
        employee.revealed.push(traitId);
        addFeed(state, content, 'feed.traitRevealed', 'neutral', {
          name: employee.name,
          trait: traitId,
        });
      }
    }
  }
}

export function expireCandidates(state: GameState): void {
  state.candidates = state.candidates.filter((c) => c.expires > state.month);
}

import { contentData } from '../content';
import { applyInPlace, indexContent, newRun, type ContentPack, type GameState } from '../engine';
import type { ActionParams, Command, Employee, RunSetup } from '../engine/state';

export const content: ContentPack = indexContent(contentData);

export const SETUP: RunSetup = {
  founderName: 'Robin Vale',
  companyName: 'Fernworks',
  background: 'engineer',
  market: 'saas',
  model: 'subscription',
  cofounder: 'priya',
};

export function freshRun(overrides: Partial<RunSetup> = {}, seed = 1): GameState {
  return newRun(seed, { ...SETUP, ...overrides }, content);
}

/** Applies a command and fails loudly if the engine rejects it. */
export function must(state: GameState, command: Command): void {
  const error = applyInPlace(state, content, command);
  if (error !== null) throw new Error(`${command.type} rejected: ${error}`);
}

export function act(state: GameState, action: string, params: ActionParams = {}): void {
  must(state, { type: 'performAction', action, params });
}

/** Ends the turn, resolving any event with its first unlocked option. */
export function nextMonth(state: GameState): void {
  if (state.pendingEvent !== null) clearEvent(state);
  must(state, { type: 'endTurn' });
}

export function clearEvent(state: GameState): void {
  const pending = state.pendingEvent;
  if (pending === null) return;
  const event = content.events.get(pending.event);
  for (const option of event?.options ?? []) {
    if (applyInPlace(state, content, { type: 'resolveEvent', option: option.id }) === null) return;
  }
  throw new Error(`No option could resolve ${pending.event}`);
}

/** Puts a launched product with users in place, skipping the early game. */
export function launchedCompany(seed = 1): GameState {
  const state = freshRun({}, seed);
  state.product.launched = true;
  state.product.launchMonth = 0;
  state.product.shipped = ['coreProduct'];
  state.stats.users = 2000;
  state.stats.quality = 60;
  state.stats.cash = 500_000;
  return state;
}

let employeeCounter = 0;

export function employee(overrides: Partial<Employee> = {}): Employee {
  employeeCounter += 1;
  return {
    id: `test${employeeCounter}`,
    name: 'Test Person',
    role: 'engineer',
    skill: 3,
    salary: 120_000,
    traits: [],
    revealed: [],
    equityBps: 0,
    hiredMonth: -12,
    mood: 0,
    ...overrides,
  };
}

import { applyInPlace, newRun, type ContentPack, type GameState } from '../engine';
import type { Command, RunSetup } from '../engine/state';
import { pick, seedRng } from '../engine/rng';
import type { Bot } from './bots';
import { actionChoices, actionCommand, eventChoices } from './choices';
import { BASE_WEIGHTS, scoreEffects } from './score';

export interface RunResult {
  state: GameState;
  commands: Command[];
  errors: number;
}

const MAX_ACTIONS_PER_TURN = 6;
const MAX_STEPS = 6000;

/** A setup drawn from the seed so batches cover every market, background and co-founder choice. */
export function randomSetup(seed: number, content: ContentPack): RunSetup {
  const rng = seedRng(seed ^ 0x5bd1e995);
  const market = pick(rng, content.data.markets);
  const model = pick(rng, market.models).model;
  const cofounder = pick(rng, [null, ...content.data.cofounders.map((c) => c.id)]);
  return {
    founderName: 'Alex Doe',
    companyName: 'Simco',
    background: pick(rng, content.data.backgrounds).id,
    market: market.id,
    model,
    cofounder,
  };
}

/** Plays one run to its end with a bot. Deterministic for a given seed, setup and bot. */
export function playRun(seed: number, setup: RunSetup, bot: Bot, content: ContentPack): RunResult {
  const state = newRun(seed, setup, content);
  const rng = seedRng(seed ^ 0x9e3779b9);
  const commands: Command[] = [];
  let errors = 0;
  let actionsThisTurn = 0;

  const run = (command: Command): boolean => {
    const error = applyInPlace(state, content, command);
    if (error !== null) {
      errors += 1;
      return false;
    }
    commands.push(command);
    return true;
  };

  for (let step = 0; step < MAX_STEPS && state.ending === null; step++) {
    if (state.pendingEvent !== null) {
      const options = eventChoices(state, content).map((o) => ({
        id: o.id,
        score: scoreEffects(o.effects, state, BASE_WEIGHTS),
      }));
      if (options.length === 0) break;
      run({ type: 'resolveEvent', option: bot.choose(state, content, options, rng) });
      continue;
    }
    if (state.negotiation !== null) {
      if (!run({ type: 'negotiate', move: bot.negotiate(state, content, rng) })) {
        run({ type: 'negotiate', move: { type: 'settle' } });
      }
      continue;
    }
    const choice =
      actionsThisTurn < MAX_ACTIONS_PER_TURN
        ? bot.act({ state, content, choices: actionChoices(state, content) }, rng)
        : null;
    if (choice !== null && run(actionCommand(choice))) {
      actionsThisTurn += 1;
      continue;
    }
    actionsThisTurn = 0;
    if (!run({ type: 'endTurn' })) break;
  }
  return { state, commands, errors };
}

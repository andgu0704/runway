import { must, type ContentPack } from '../content';
import { burn, mrr, runwayMonths, valuation } from '../economy';
import { declareEnding, hasEnded } from '../endings';
import { addFeed } from '../log';
import { companyMods } from '../mods';
import type { GameState } from '../state';
import { boardStep } from './board';
import { consequenceStep, selectEvent } from './events';
import { driftMeters, foreshadow } from './meters';
import { peopleStep } from './people';
import { productStep } from './product';
import { stageStep } from './stage';
import { userStep } from './users';

export function actionPointsFor(state: GameState, content: ContentPack): number {
  const stage = must(content.stages, state.stage, 'stage');
  return Math.max(1, stage.actionPoints + Math.floor(companyMods(state, content).apBonus));
}

/** Raises a last-chance event when cash runs out, or ends the run if none is available. */
export function insolvencyCheck(state: GameState, content: ContentPack): void {
  if (state.ending !== null || state.stats.cash >= 0 || state.pendingEvent !== null) return;
  selectEvent(state, content);
  const pending = state.pendingEvent as GameState['pendingEvent'];
  const event = pending === null ? undefined : content.events.get(pending.event);
  if (event?.lastChance === true) return;
  state.pendingEvent = null;
  declareEnding(state, content, content.rules.endings.bankrupt);
}

function closeBooks(state: GameState, content: ContentPack): void {
  const mods = companyMods(state, content);
  const revenue = mrr(state, content, mods);
  const spend = burn(state, content, mods);
  state.stats.cash += revenue - spend;
  const previous = state.history[state.history.length - 1];
  const usersDelta = state.stats.users - (previous?.users ?? 0);
  const runway = runwayMonths(state, content);
  const key = state.product.launched ? 'feed.monthClosed' : 'feed.monthClosedPrelaunch';
  addFeed(state, content, key, 'neutral', {
    usersDelta,
    users: state.stats.users,
    mrr: revenue,
    burn: spend,
    cash: state.stats.cash,
    runway: Math.floor(runway),
  });
  state.history.push({
    month: state.month,
    cash: state.stats.cash,
    users: state.stats.users,
    mrr: revenue,
    burn: spend,
    quality: Math.round(state.stats.quality),
    morale: Math.round(state.stats.morale),
    reputation: Math.round(state.stats.reputation),
    valuation: valuation(state, content),
  });
}

/** Resolves the month: the order of steps is part of the game's rules. */
export function endTurn(state: GameState, content: ContentPack): void {
  const mods = companyMods(state, content);
  productStep(state, content, mods);
  userStep(state, content, mods);
  closeBooks(state, content);
  peopleStep(state, content, mods);
  driftMeters(state, content, mods);
  boardStep(state, content);
  foreshadow(state, content);

  if (state.month + 1 >= content.rules.maxMonths) {
    declareEnding(state, content, content.rules.endings.timeUp);
    return;
  }
  stageStep(state, content);
  if (state.ending !== null) return;

  state.month += 1;
  state.boosts = state.boosts.filter((b) => b.until >= state.month);
  state.ap = { used: 0, max: actionPointsFor(state, content) };

  consequenceStep(state, content);
  if (hasEnded(state)) return;
  if (state.stats.cash < 0) insolvencyCheck(state, content);
  else selectEvent(state, content);
}

import { performAction, type ActionError } from './actions';
import { check } from './conditions';
import type { ContentPack } from './content';
import { runEffects } from './effects';
import { declareEnding, hasEnded } from './endings';
import { addFeed, addTimeline } from './log';
import { negotiate } from './negotiation';
import type { Command, FeedEntry, GameState } from './state';
import { endTurn, insolvencyCheck } from './turn';

export type Signal =
  'turnEnded' | 'dealClosed' | 'disaster' | 'stageChanged' | 'eventRaised' | 'runEnded';

export type RuleError =
  | ActionError
  | 'noEventPending'
  | 'unknownOption'
  | 'optionLocked'
  | 'noNegotiation'
  | 'invalidTerms';

export type StepResult =
  | { ok: true; state: GameState; signals: Signal[]; feed: FeedEntry[] }
  | { ok: false; error: RuleError };

/** Event options are visible unless `visibleWhen` fails; locked when `requires` fails. */
export function optionState(state: GameState, content: ContentPack, optionId: string) {
  const pending = state.pendingEvent;
  const event = pending === null ? undefined : content.events.get(pending.event);
  const option = event?.options.find((o) => o.id === optionId);
  if (pending === null || event === undefined || option === undefined) return null;
  const subject = state.team.find((e) => e.id === pending.subject) ?? null;
  const ctx = { state, content, subject, params: {} };
  return {
    event,
    option,
    subject,
    visible: check(option.visibleWhen, ctx),
    unlocked: check(option.requires, ctx),
  };
}

function resolveEvent(state: GameState, content: ContentPack, optionId: string): RuleError | null {
  const pending = state.pendingEvent;
  if (pending === null || state.ending !== null) return 'noEventPending';
  const resolved = optionState(state, content, optionId);
  if (resolved === null || !resolved.visible) return 'unknownOption';
  if (!resolved.unlocked) return 'optionLocked';
  const { event, option, subject } = resolved;

  state.pendingEvent = null;
  const timelineParams = { event: event.id, option: option.id };
  addTimeline(
    state,
    content,
    'decision',
    'timeline.eventChoice',
    event.tone,
    timelineParams,
    pending.cause ?? undefined,
  );
  const subjectParams = subject === null ? {} : { name: subject.name, role: subject.role };
  addFeed(
    state,
    content,
    `event.${event.id}.option.${option.id}.result`,
    event.tone,
    subjectParams,
  );
  runEffects(option.effects, {
    state,
    content,
    subject,
    params: subject === null ? {} : { employee: subject.id },
    cause: { month: state.month, key: `event.${event.id}.option.${option.id}.cause`, params: {} },
  });
  if (hasEnded(state)) return null;
  if (event.lastChance === true && state.stats.cash < 0) {
    declareEnding(state, content, content.rules.endings.bankrupt);
  } else {
    insolvencyCheck(state, content);
  }
  return null;
}

/** Applies a command to a state the caller owns. Mutates `state`. */
export function applyInPlace(
  state: GameState,
  content: ContentPack,
  command: Command,
): RuleError | null {
  switch (command.type) {
    case 'performAction':
      return performAction(state, content, command.action, command.params ?? {});
    case 'resolveEvent':
      return resolveEvent(state, content, command.option);
    case 'negotiate': {
      if (state.negotiation === null || state.ending !== null) return 'noNegotiation';
      const move = command.move;
      if (
        move.type === 'propose' &&
        (!Number.isFinite(move.amount) || move.amount <= 0 || move.bps < 100 || move.bps > 6000)
      ) {
        return 'invalidTerms';
      }
      negotiate(state, content, move);
      return null;
    }
    case 'endTurn':
      if (state.ending !== null) return 'ended';
      if (state.pendingEvent !== null) return 'eventPending';
      if (state.negotiation !== null) return 'negotiating';
      endTurn(state, content);
      return null;
    case 'abandon':
      if (state.ending !== null) return 'ended';
      declareEnding(state, content, content.rules.endings.abandoned);
      return null;
  }
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function signalsBetween(
  before: GameState,
  after: GameState,
  content: ContentPack,
  command: Command,
): Signal[] {
  const signals: Signal[] = [];
  if (command.type === 'endTurn') signals.push('turnEnded');
  if (after.rounds.length > before.rounds.length) signals.push('dealClosed');
  if (after.stage !== before.stage) signals.push('stageChanged');
  const raised =
    after.pendingEvent !== null && after.pendingEvent.event !== before.pendingEvent?.event;
  if (raised) signals.push('eventRaised');
  const event =
    after.pendingEvent === null ? undefined : content.events.get(after.pendingEvent.event);
  const failed = after.ending !== null && content.endings.get(after.ending.id)?.kind === 'failure';
  if ((raised && event?.disaster === true) || (before.ending === null && failed))
    signals.push('disaster');
  if (before.ending === null && after.ending !== null) signals.push('runEnded');
  return signals;
}

/** Pure entry point: returns a new state and never mutates the input. */
export function apply(state: GameState, content: ContentPack, command: Command): StepResult {
  const next = cloneState(state);
  const error = applyInPlace(next, content, command);
  if (error !== null) return { ok: false, error };
  const lastId = state.feed[state.feed.length - 1]?.id ?? 0;
  return {
    ok: true,
    state: next,
    signals: signalsBetween(state, next, content, command),
    feed: next.feed.filter((f) => f.id > lastId),
  };
}

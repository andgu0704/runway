import type { GameEvent } from '../../content/schema/records';
import { check, type EvalContext } from '../conditions';
import { stageIndex, type ContentPack } from '../content';
import { runEffects } from '../effects';
import { addFeed, addTimeline } from '../log';
import { chance, pick, pickWeighted } from '../rng';
import type { Employee, GameState, PendingEvent } from '../state';

function onCooldown(state: GameState, content: ContentPack, event: GameEvent): boolean {
  const last = state.eventLastSeen[event.id];
  if (last === undefined) return false;
  if (event.once === true) return true;
  return state.month - last < (event.cooldown ?? content.rules.eventCooldownDefault);
}

function pickSubject(state: GameState, event: GameEvent): Employee | null | undefined {
  if (event.subject === undefined) return null;
  const spec = event.subject;
  const pool = state.team.filter(
    (e) =>
      (spec.roles === undefined || spec.roles.includes(e.role)) &&
      (spec.trait === undefined || e.traits.includes(spec.trait)),
  );
  return pool.length === 0 ? undefined : pick(state.rng, pool);
}

interface Candidate {
  event: GameEvent;
  subject: Employee | null;
  weight: number;
}

function eligible(state: GameState, content: ContentPack, event: GameEvent): Candidate | null {
  if (stageIndex(content, state.stage) < stageIndex(content, event.minStage)) return null;
  if (onCooldown(state, content, event)) return null;
  const trigger = event.trigger;
  if (trigger.kind === 'scheduled') return null;
  const subject = pickSubject(state, event);
  if (subject === undefined) return null;
  const ctx: EvalContext = { state, content, subject, params: {} };
  if (!check(trigger.when, ctx)) return null;
  if (trigger.kind === 'urgent') return { event, subject, weight: Number.POSITIVE_INFINITY };
  if (trigger.kind === 'meter') {
    const value = state.meters[trigger.meter];
    if (value < trigger.at) return null;
    return { event, subject, weight: trigger.weight * (1 + (value - trigger.at) / 20) };
  }
  return { event, subject, weight: trigger.weight };
}

export function raiseEvent(state: GameState, pending: PendingEvent): void {
  state.pendingEvent = pending;
  state.eventLastSeen[pending.event] = state.month;
}

/** Urgent events always win; otherwise at most one event, usually. */
export function selectEvent(state: GameState, content: ContentPack): void {
  if (state.pendingEvent !== null || state.ending !== null) return;
  const candidates: Candidate[] = [];
  for (const event of content.data.events) {
    const candidate = eligible(state, content, event);
    if (candidate !== null) candidates.push(candidate);
  }
  const urgent = candidates.find((c) => c.weight === Number.POSITIVE_INFINITY);
  if (urgent !== undefined) {
    raiseEvent(state, { event: urgent.event.id, subject: urgent.subject?.id ?? null, cause: null });
    return;
  }
  const pressured = candidates.some((c) => c.event.trigger.kind === 'meter');
  if (!pressured && !chance(state.rng, content.rules.randomEventChance)) return;
  const chosen = pickWeighted(state.rng, candidates, (c) => c.weight);
  if (chosen === null) return;
  raiseEvent(state, { event: chosen.event.id, subject: chosen.subject?.id ?? null, cause: null });
}

/** Runs due consequences; ones that raise an event wait if another event is pending. */
export function consequenceStep(state: GameState, content: ContentPack): void {
  const due = state.scheduled.filter((s) => s.due <= state.month).sort((a, b) => a.id - b.id);
  for (const item of due) {
    const consequence = content.consequences.get(item.consequence);
    if (consequence === undefined) continue;
    if (consequence.event !== undefined && state.pendingEvent !== null) {
      item.due = state.month + 1;
      continue;
    }
    state.scheduled = state.scheduled.filter((s) => s.id !== item.id);
    const key = `consequence.${consequence.id}`;
    addFeed(state, content, `${key}.feed`, consequence.tone, {}, item.cause);
    addTimeline(state, content, 'consequence', `${key}.timeline`, consequence.tone, {}, item.cause);
    runEffects(consequence.effects, {
      state,
      content,
      subject: null,
      params: {},
      cause: item.cause,
    });
    const event =
      consequence.event === undefined ? undefined : content.events.get(consequence.event);
    if (event !== undefined && state.ending === null) {
      const subject = pickSubject(state, event);
      if (subject !== undefined) {
        raiseEvent(state, { event: event.id, subject: subject?.id ?? null, cause: item.cause });
      }
    }
  }
}

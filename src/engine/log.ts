import type { Tone } from '../content/schema/ids';
import type { ContentPack } from './content';
import { nextUint32 } from './rng';
import type { Cause, GameState, MessageParams, TimelineKind } from './state';

export function newId(state: GameState): number {
  state.nextId += 1;
  return state.nextId;
}

/** Standard parameters every message can use. */
export function baseParams(state: GameState, content: ContentPack): MessageParams {
  const market = content.markets.get(state.setup.market);
  return {
    company: state.setup.companyName,
    founder: state.setup.founderName,
    rival: market?.rivalCompany ?? '',
    month: state.month,
  };
}

export function addFeed(
  state: GameState,
  content: ContentPack,
  key: string,
  tone: Tone,
  params: MessageParams = {},
  cause?: Cause,
): void {
  state.feed.push({
    id: newId(state),
    month: state.month,
    key,
    params: { ...baseParams(state, content), ...params },
    tone,
    variant: nextUint32(state.rng) % 997,
    ...(cause === undefined ? {} : { cause }),
  });
  const overflow = state.feed.length - content.rules.feedCap;
  if (overflow > 0) state.feed.splice(0, overflow);
}

export function addTimeline(
  state: GameState,
  content: ContentPack,
  kind: TimelineKind,
  key: string,
  tone: Tone,
  params: MessageParams = {},
  cause?: Cause,
): void {
  state.timeline.push({
    id: newId(state),
    month: state.month,
    kind,
    key,
    params: { ...baseParams(state, content), ...params },
    tone,
    ...(cause === undefined ? {} : { cause }),
  });
}

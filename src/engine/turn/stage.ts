import { check } from '../conditions';
import type { ContentPack } from '../content';
import { declareEnding } from '../endings';
import { addFeed, addTimeline } from '../log';
import type { GameState } from '../state';

/** Advances at most one stage per turn; a stage with an ending finishes the run. */
export function stageStep(state: GameState, content: ContentPack): void {
  const current = content.stages.get(state.stage);
  if (current === undefined) return;
  const next = content.stageOrder.find((s) => s.order === current.order + 1);
  if (next?.entry == null) return;
  if (!check(next.entry, { state, content, subject: null, params: {} })) return;
  if (next.ending !== undefined) {
    state.stage = next.id;
    declareEnding(state, content, next.ending);
    return;
  }
  state.stage = next.id;
  addFeed(state, content, 'feed.stageReached', 'milestone', { stage: next.id });
  addTimeline(state, content, 'milestone', 'timeline.stageReached', 'milestone', {
    stage: next.id,
  });
}

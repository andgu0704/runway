import type { Effect } from '../content/schema/logic';
import {
  optionState,
  paramOptions,
  visibleActions,
  type ContentPack,
  type GameState,
} from '../engine';
import type { ActionParams, Command } from '../engine/state';

export interface ActionChoice {
  action: string;
  params: ActionParams;
  cost: number;
}

/** Every concrete action command available now; ranged params are offered at a few levels. */
export function actionChoices(state: GameState, content: ContentPack): ActionChoice[] {
  const out: ActionChoice[] = [];
  for (const status of visibleActions(state, content)) {
    if (!status.available) continue;
    const { action } = status;
    if (action.param === undefined) {
      out.push({ action: action.id, params: {}, cost: status.cost });
      continue;
    }
    for (const option of paramOptions(state, content, action.param)) {
      const push = (params: ActionParams) =>
        out.push({ action: action.id, params, cost: status.cost });
      switch (option.kind) {
        case 'feature':
          push({ feature: option.id });
          break;
        case 'candidate':
          push({ candidate: option.id });
          break;
        case 'employee':
          push({ employee: option.id });
          break;
        case 'role':
          push({ role: option.id });
          break;
        case 'policy':
          push({ policy: option.id });
          break;
        case 'character':
          push({ character: option.id });
          break;
        case 'model':
          push({ model: option.id });
          break;
        case 'order':
          if (!option.active) push({ order: { role: option.role, order: option.order } });
          break;
        case 'price':
        case 'budget':
          for (const t of [0, 0.25, 0.5, 1]) {
            const raw = option.min + (option.max - option.min) * t;
            const amount = Math.round(raw / option.step) * option.step;
            if (amount !== option.current) push({ amount });
          }
          break;
      }
    }
  }
  return out;
}

export function actionCommand(choice: ActionChoice): Command {
  return { type: 'performAction', action: choice.action, params: choice.params };
}

/** Options the player may pick for the pending event. */
export function eventChoices(
  state: GameState,
  content: ContentPack,
): { id: string; effects: readonly Effect[] }[] {
  const pending = state.pendingEvent;
  if (pending === null) return [];
  const event = content.events.get(pending.event);
  if (event === undefined) return [];
  return event.options
    .filter((o) => {
      const s = optionState(state, content, o.id);
      return s !== null && s.visible && s.unlocked;
    })
    .map((o) => ({ id: o.id, effects: o.effects }));
}

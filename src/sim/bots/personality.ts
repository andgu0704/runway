import type { Bot } from './types';
import type { ActionChoice } from '../choices';
import type { TurnView } from '../heuristics';
import { sensibleNegotiation } from './negotiation';

type Intent = (view: TurnView) => ActionChoice | null;

/** Builds a bot that walks a priority list of intents and picks the best-scoring event option. */
export function priorityBot(name: string, intents: Intent[], ambition: number): Bot {
  return {
    name,
    act(view) {
      for (const intent of intents) {
        const choice = intent(view);
        if (choice !== null) return choice;
      }
      return null;
    },
    choose(_state, _content, options) {
      return [...options].sort((a, b) => b.score - a.score)[0]?.id ?? '';
    },
    negotiate(state, content) {
      return sensibleNegotiation(state, content, ambition);
    },
  };
}

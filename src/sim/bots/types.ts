import type { ContentPack, GameState, NegotiationMove } from '../../engine';
import type { RngState } from '../../engine/rng';
import type { ActionChoice } from '../choices';
import type { TurnView } from '../heuristics';

export interface Bot {
  name: string;
  /** Next action this turn, or null to end the turn. */
  act(view: TurnView, rng: RngState): ActionChoice | null;
  choose(
    state: GameState,
    content: ContentPack,
    options: { id: string; score: number }[],
    rng: RngState,
  ): string;
  negotiate(state: GameState, content: ContentPack, rng: RngState): NegotiationMove;
}

import { useCallback } from 'react';
import { loadContent } from '../../content/runtime';
import type { Command, ContentPack, GameState, RuleError } from '../../engine';
import { gameStore, useGame } from '../../store/game';
import { showToast } from '../toast';

export interface Run {
  game: GameState;
  content: ContentPack;
  dispatch: (command: Command) => boolean;
}

/** The current run for screens that only render while a run exists. */
export function useRun(): Run | null {
  const game = useGame((s) => s.game);
  const dispatch = useCallback((command: Command) => {
    const error: RuleError | null = gameStore.getState().dispatch(command);
    if (error !== null) showToast(`ui.ruleError.${error}`);
    return error === null;
  }, []);
  if (game === null) return null;
  return { game, content: loadContent(), dispatch };
}

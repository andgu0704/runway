import { View } from 'react-native';
import { visibleActions, type GameState, type ContentPack } from '../../../engine';
import type { Tab } from '../../../content/schema/ids';
import { ActionRow } from './ActionRow';

/** Actions for a tab, minus the ones a screen surfaces in context (hiring from a card, and so on). */
export function ActionList({
  game,
  content,
  tab,
  exclude = [],
  only,
}: {
  game: GameState;
  content: ContentPack;
  tab: Tab;
  exclude?: string[];
  only?: (id: string, shady: boolean) => boolean;
}) {
  const statuses = visibleActions(game, content).filter(
    (s) =>
      s.action.tab === tab &&
      !exclude.includes(s.action.id) &&
      (only === undefined || only(s.action.id, s.action.shady === true)),
  );
  return (
    <View>
      {statuses.map((s) => (
        <ActionRow key={s.action.id} status={s} />
      ))}
    </View>
  );
}

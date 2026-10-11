import { StyleSheet, View } from 'react-native';
import type { CharacterId } from '../../content/schema/ids';
import type { GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { Avatar } from '../components/Avatar';
import { Ring } from '../components/Ring';
import { Card } from '../components/Surface';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { space, type ColorName } from '../theme/tokens';

export function stanceOf(trust: number): 'cold' | 'wary' | 'warm' | 'close' {
  if (trust < 30) return 'cold';
  if (trust < 55) return 'wary';
  if (trust < 75) return 'warm';
  return 'close';
}

const COLOR: Record<CharacterId, ColorName> = {
  cofounder: 'people',
  investor: 'money',
  rival: 'company',
  journalist: 'world',
};

/** A recurring character: who they are, how much they trust you, and what that means now. */
export function CharacterCard({ game, id }: { game: GameState; id: CharacterId }) {
  const { t } = useText();
  const content = loadContent();
  const character = content.characters.get(id);
  const cofounder =
    game.setup.cofounder === null ? undefined : content.cofounders.get(game.setup.cofounder);
  const name = id === 'cofounder' ? (cofounder?.name ?? '') : (character?.name ?? '');
  const trust = Math.round(game.trust[id]);
  const stance = stanceOf(trust);
  return (
    <Card style={styles.card}>
      <View
        style={styles.head}
        accessible
        accessibilityLabel={`${name}, ${t(`character.${id}.role`)}, ${t('ui.world.trust', { value: trust })}`}
      >
        <Avatar name={name} color={COLOR[id]} size={48} />
        <View style={styles.text}>
          <Text variant="headline">{name}</Text>
          <Text variant="footnote" color="textSecondary" numberOfLines={1}>
            {t(`character.${id}.role`)}
          </Text>
        </View>
        <Ring
          value={trust}
          color={stance === 'cold' ? 'down' : stance === 'wary' ? 'warn' : 'up'}
        />
      </View>
      <Text variant="callout" color="textSecondary">
        {t(`ui.stance.${id}.${stance}`)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.m, marginBottom: space.s },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  text: { flex: 1, gap: 2 },
});

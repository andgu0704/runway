import { StyleSheet, View } from 'react-native';
import type { CharacterId } from '../../content/schema/ids';
import type { GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { Meter } from '../components/Meter';
import { Card } from '../components/Surface';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { space } from '../theme/tokens';

export function stanceOf(trust: number): 'cold' | 'wary' | 'warm' | 'close' {
  if (trust < 30) return 'cold';
  if (trust < 55) return 'wary';
  if (trust < 75) return 'warm';
  return 'close';
}

/** A recurring character: who they are, how much they trust you, what that means right now. */
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
      <Text variant="label" color="textTertiary">
        {t(`character.${id}.role`)}
      </Text>
      <Text variant="title2">{name}</Text>
      <Text variant="callout" color="textSecondary">
        {t(`character.${id}.bio`)}
      </Text>
      <View style={styles.trust}>
        <Text variant="footnote" color="textSecondary">
          {t('ui.world.trust', { value: trust })}
        </Text>
        <Meter
          value={trust / 100}
          color={stance === 'cold' ? 'down' : stance === 'wary' ? 'warn' : 'up'}
          label={t('ui.world.trust', { value: trust })}
        />
      </View>
      <Text variant="bodySerif">{t(`ui.stance.${id}.${stance}`)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.s, marginBottom: space.m },
  trust: { gap: space.xs },
});

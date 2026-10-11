import { StyleSheet, View } from 'react-native';
import type { ContentPack, GameState } from '../../engine';
import { Icon } from '../components/Icon';
import { Meter } from '../components/Meter';
import { Card } from '../components/Surface';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { goals } from '../requirements';
import { space } from '../theme/tokens';

/** The next stage as a quest: each part of its entry rule with a progress bar. */
export function QuestCard({ game, content }: { game: GameState; content: ContentPack }) {
  const { t } = useText();
  const stage = content.stages.get(game.stage);
  const next = stage === undefined ? undefined : content.stageOrder[stage.order + 1];
  if (next === undefined) return null;
  const list = goals(next.entry, game, content);
  const done = list.filter((g) => g.met).length;
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Icon name="star" filled color="people" size={22} />
        <Text variant="title2" style={styles.flex} accessibilityRole="header">
          {t('ui.quest.title', { stage: next.id })}
        </Text>
        <Text variant="footnote" color="textTertiary">
          {t('ui.quest.done', { done, count: list.length })}
        </Text>
      </View>
      {list.map((g) => (
        <View key={g.text} style={styles.goal}>
          <View style={styles.goalHead}>
            <Icon
              name={g.met ? 'check' : 'target'}
              size={16}
              filled
              color={g.met ? 'up' : 'textTertiary'}
            />
            <Text variant="callout" style={styles.flex}>
              {g.text}
            </Text>
          </View>
          <Meter value={g.progress} color={g.met ? 'up' : 'accent'} label={g.text} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.m, marginTop: space.m },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  flex: { flex: 1 },
  goal: { gap: space.xs },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: space.s },
});

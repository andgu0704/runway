import { StyleSheet, View } from 'react-native';
import type { GameState } from '../../engine';
import { Sheet } from '../components/Sheet';
import { Sparkline } from '../components/Sparkline';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { space } from '../theme/tokens';

export type StatKey = 'cash' | 'users' | 'quality' | 'morale' | 'reputation';

/** History and an honest explanation of what moves a stat. */
export function StatSheet({
  stat,
  game,
  onDismiss,
}: {
  stat: StatKey | null;
  game: GameState;
  onDismiss: () => void;
}) {
  const { t, money, number } = useText();
  const key = stat ?? 'cash';
  const values = [...game.history.slice(-24).map((h) => h[key]), game.stats[key]];
  const value = game.stats[key];
  const shown =
    key === 'cash' ? money(value) : key === 'users' ? number(value) : `${Math.round(value)} / 100`;
  return (
    <Sheet visible={stat !== null} onDismiss={onDismiss} label={t(`ui.stat.${key}.name`)}>
      <View style={styles.head}>
        <Text variant="label" color="textSecondary">
          {t(`ui.stat.${key}.name`)}
        </Text>
        <Text variant="figureL">{shown}</Text>
      </View>
      {values.length > 2 ? (
        <View style={styles.chart}>
          <Sparkline values={values} width={320} height={64} />
          <Text variant="footnote" color="textTertiary">
            {t('ui.stat.chartCaption', { count: values.length - 1 })}
          </Text>
        </View>
      ) : null}
      <Text variant="body">{t(`ui.stat.${key}.explainer`)}</Text>
      <Text variant="callout" color="textSecondary">
        {t(`ui.stat.${key}.drivers`)}
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.xs },
  chart: { gap: space.xs },
});

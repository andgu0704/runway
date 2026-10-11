import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { economy, type GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { Icon, type IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { useText } from '../i18n';
import { makeStyles } from '../theme/ThemeProvider';
import { gutter, minTouch, radii, space, type ColorName } from '../theme/tokens';
import { StatSheet, type StatKey } from './StatSheet';

const PILLS: { stat: StatKey; icon: IconName; color: ColorName }[] = [
  { stat: 'cash', icon: 'money', color: 'money' },
  { stat: 'users', icon: 'people', color: 'world' },
  { stat: 'quality', icon: 'star', color: 'product' },
  { stat: 'morale', icon: 'heart', color: 'people' },
  { stat: 'reputation', icon: 'megaphone', color: 'company' },
];

/** The five core stats as a slim strip of pills, so they stay visible on every tab. */
export function CompactStats({ game }: { game: GameState }) {
  const styles = useStyles();
  const { t, money, compact } = useText();
  const [open, setOpen] = useState<StatKey | null>(null);
  const runway = economy.runwayMonths(game, loadContent());
  const value = (stat: StatKey) =>
    stat === 'cash'
      ? money(game.stats.cash)
      : stat === 'users'
        ? compact(game.stats.users)
        : String(Math.round(game.stats[stat]));
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {PILLS.map(({ stat, icon, color }) => (
          <Touchable
            key={stat}
            onPress={() => {
              setOpen(stat);
            }}
            style={styles.pill}
            accessibilityLabel={`${t(`ui.stat.${stat}.name`)}, ${value(stat)}`}
            accessibilityHint={t('ui.stat.hint')}
          >
            <View style={styles.inner}>
              <Icon name={icon} size={16} color={color} filled />
              <Text variant="figureS">{value(stat)}</Text>
              {stat === 'cash' ? (
                <Text
                  variant="footnote"
                  color={runway < 4 ? 'down' : runway < 9 ? 'warn' : 'textTertiary'}
                >
                  {runway >= economy.RUNWAY_INFINITE
                    ? t('ui.stat.profitable')
                    : t('ui.stat.runwayShort', { count: Math.floor(runway) })}
                </Text>
              ) : null}
            </View>
          </Touchable>
        ))}
      </ScrollView>
      <StatSheet
        stat={open}
        game={game}
        onDismiss={() => {
          setOpen(null);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    row: { paddingHorizontal: gutter, gap: space.s, paddingVertical: space.xs },
    pill: {
      backgroundColor: c.surface,
      borderRadius: radii.full,
      borderWidth: 2.5,
      borderBottomWidth: 4,
      borderColor: c.ink,
      paddingHorizontal: space.m,
      minHeight: minTouch,
    },
    inner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  }),
);

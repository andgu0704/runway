import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { economy, type GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { CountingNumber } from '../components/CountingNumber';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { useText } from '../i18n';
import { makeStyles } from '../theme/ThemeProvider';
import { gutter, space } from '../theme/tokens';
import { StatSheet, type StatKey } from './StatSheet';

const STATS: StatKey[] = ['cash', 'users', 'quality', 'morale', 'reputation'];

function previous(game: GameState, stat: StatKey): number | null {
  const snapshot = game.history[game.history.length - 2];
  if (snapshot === undefined) return null;
  return snapshot[stat];
}

/** The five always-visible stats. Tap any of them for history and what moves it. */
export function StatBar({ game }: { game: GameState }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const { t, money, compact } = useText();
  const [open, setOpen] = useState<StatKey | null>(null);
  const runway = economy.runwayMonths(game, loadContent());
  const wrap = fontScale > 1.25;

  const format = (stat: StatKey, value: number) =>
    stat === 'cash' ? money(value) : stat === 'users' ? compact(value) : String(Math.round(value));

  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.s }]}>
      <View style={[styles.row, wrap ? styles.wrap : null]}>
        {STATS.map((stat) => {
          const value = game.stats[stat];
          const before = previous(game, stat);
          const delta = before === null ? 0 : value - before;
          const label = t(`ui.stat.${stat}.name`);
          const deltaWord = delta === 0 ? '' : delta > 0 ? t('ui.stat.up') : t('ui.stat.down');
          return (
            <Touchable
              key={stat}
              onPress={() => {
                setOpen(stat);
              }}
              style={[styles.cell, wrap ? styles.cellWrap : null]}
              accessibilityLabel={`${label}, ${format(stat, value)}${deltaWord === '' ? '' : `, ${deltaWord}`}${stat === 'cash' ? `, ${t('ui.runway.months', { count: Math.floor(Math.min(runway, 99)) })}` : ''}`}
              accessibilityHint={t('ui.stat.hint')}
            >
              <Text variant="label" color="textTertiary" numberOfLines={1}>
                {label}
              </Text>
              <View style={styles.valueRow}>
                <CountingNumber
                  variant="figureM"
                  value={value}
                  format={(v) => format(stat, v)}
                  numberOfLines={1}
                />
                {delta !== 0 ? (
                  <Icon
                    name={delta > 0 ? 'up' : 'down'}
                    size={12}
                    color={delta > 0 ? 'up' : 'down'}
                  />
                ) : null}
              </View>
              {stat === 'cash' ? (
                <Text
                  variant="figureS"
                  color={runway < 4 ? 'down' : runway < 9 ? 'warn' : 'textSecondary'}
                  numberOfLines={1}
                >
                  {runway >= economy.RUNWAY_INFINITE
                    ? t('ui.stat.profitable')
                    : t('ui.stat.runwayShort', { count: Math.floor(runway) })}
                </Text>
              ) : null}
            </Touchable>
          );
        })}
      </View>
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
    bar: {
      backgroundColor: c.canvas,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
      paddingHorizontal: gutter - space.xs,
      paddingBottom: space.s,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    wrap: { flexWrap: 'wrap' },
    cell: { paddingHorizontal: space.xs, justifyContent: 'flex-start' },
    cellWrap: { flexBasis: '33%', paddingVertical: space.xs },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  }),
);

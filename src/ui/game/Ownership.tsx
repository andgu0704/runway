import { StyleSheet, View } from 'react-native';
import type { GameState } from '../../engine';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { radii, space, type ColorName } from '../theme/tokens';

type Group = 'founder' | 'cofounder' | 'investors' | 'team' | 'pool';

const COLORS: Record<Group, ColorName> = {
  founder: 'accent',
  cofounder: 'textSecondary',
  investors: 'warn',
  team: 'up',
  pool: 'hairline',
};

export function ownershipGroups(game: GameState): Record<Group, number> {
  const out: Record<Group, number> = { founder: 0, cofounder: 0, investors: 0, team: 0, pool: 0 };
  for (const entry of game.capTable) {
    const group: Group =
      entry.holder === 'founder'
        ? 'founder'
        : entry.holder === 'cofounder'
          ? 'cofounder'
          : entry.holder === 'pool'
            ? 'pool'
            : entry.holder.startsWith('inv:') || entry.holder.startsWith('note:')
              ? 'investors'
              : 'team';
    out[group] += entry.bps;
  }
  return out;
}

/** Who owns the company, as one stacked bar with a legend that carries the numbers. */
export function OwnershipBar({ game }: { game: GameState }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, percent } = useText();
  const groups = ownershipGroups(game);
  const entries = (Object.keys(groups) as Group[]).filter((g) => groups[g] > 0);
  return (
    <View style={styles.wrap}>
      <View
        style={styles.bar}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {entries.map((g) => (
          <View key={g} style={{ flex: groups[g], backgroundColor: colors[COLORS[g]] }} />
        ))}
      </View>
      <View style={styles.legend}>
        {entries.map((g) => (
          <View
            key={g}
            style={styles.item}
            accessible
            accessibilityLabel={`${t(`ui.ownership.${g}`)} ${percent(groups[g])}`}
          >
            <View style={[styles.swatch, { backgroundColor: colors[COLORS[g]] }]} />
            <Text variant="footnote" color="textSecondary">
              {t(`ui.ownership.${g}`)}
            </Text>
            <Text variant="figureS">{percent(groups[g])}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    wrap: { gap: space.m },
    bar: { flexDirection: 'row', height: 12, borderRadius: radii.xs, overflow: 'hidden', gap: 2 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.l, rowGap: space.xs },
    item: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    swatch: { width: 8, height: 8, borderRadius: 2 },
  }),
);

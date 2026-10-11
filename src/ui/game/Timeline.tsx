import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { TimelineEntry } from '../../engine';
import { SegmentedControl } from '../components/SegmentedControl';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { space, type ColorName } from '../theme/tokens';

type Filter = 'all' | 'decision' | 'consequence';

const DOT: Record<TimelineEntry['kind'], ColorName> = {
  decision: 'textSecondary',
  consequence: 'down',
  milestone: 'accent',
};

/** Cause and effect, explicitly: every consequence names the choice that led to it. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useText();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = [...entries].reverse().filter((e) => filter === 'all' || e.kind === filter);
  return (
    <View style={styles.wrap}>
      <SegmentedControl
        label={t('ui.timeline.filter')}
        value={filter}
        onChange={setFilter}
        segments={[
          { value: 'all', label: t('ui.timeline.all') },
          { value: 'decision', label: t('ui.timeline.decisions') },
          { value: 'consequence', label: t('ui.timeline.consequences') },
        ]}
      />
      {shown.length === 0 ? (
        <Text variant="callout" color="textSecondary">
          {t(`ui.timeline.empty.${filter}`)}
        </Text>
      ) : (
        shown.map((e) => {
          const text = t(e.key, e.params);
          const cause =
            e.cause === undefined
              ? null
              : t('ui.timeline.because', {
                  cause: t(e.cause.key, e.cause.params),
                  month: e.cause.month + 1,
                });
          return (
            <View
              key={e.id}
              style={styles.row}
              accessible
              accessibilityLabel={[t('ui.timeline.month', { month: e.month + 1 }), text, cause]
                .filter(Boolean)
                .join('. ')}
            >
              <Text variant="figureS" color="textTertiary" style={styles.month}>
                {t('ui.timeline.monthShort', { month: e.month + 1 })}
              </Text>
              <View style={[styles.dot, { backgroundColor: colors[DOT[e.kind]] }]} />
              <View style={styles.body}>
                <Text variant="callout">{text}</Text>
                {cause !== null ? (
                  <Text variant="footnote" color="textSecondary">
                    {cause}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    wrap: { gap: space.m },
    row: { flexDirection: 'row', gap: space.m, alignItems: 'flex-start' },
    month: { width: 36, paddingTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
    body: { flex: 1, gap: 2 },
  }),
);

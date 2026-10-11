import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { FeedEntry } from '../../src/engine';
import { useGame } from '../../src/store/game';
import { Text } from '../../src/ui/components/Text';
import { FeedEntryView } from '../../src/ui/game/FeedEntry';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { makeStyles } from '../../src/ui/theme/ThemeProvider';
import { gutter, space } from '../../src/ui/theme/tokens';

type Row =
  { kind: 'month'; month: number; key: string } | { kind: 'entry'; entry: FeedEntry; key: string };

/** The story so far, oldest first, so the newest lines land right above the Next month button. */
export default function Feed() {
  const run = useRun();
  const fresh = useGame((s) => s.fresh);
  const styles = useStyles();
  const { t } = useText();
  const list = useRef<FlatList<Row>>(null);
  const freshIds = useMemo(() => new Map(fresh.map((f, i) => [f.id, i])), [fresh]);

  const rows = useMemo(() => {
    const out: Row[] = [];
    let month = -1;
    for (const entry of run?.game.feed ?? []) {
      if (entry.month !== month) {
        month = entry.month;
        out.push({ kind: 'month', month, key: `m${month}` });
      }
      out.push({ kind: 'entry', entry, key: `e${entry.id}` });
    }
    return out;
  }, [run?.game.feed]);

  if (run === null) return null;
  return (
    <FlatList
      ref={list}
      data={rows}
      keyExtractor={(r) => r.key}
      contentContainerStyle={styles.content}
      onContentSizeChange={() => {
        list.current?.scrollToEnd({ animated: false });
      }}
      renderItem={({ item }) =>
        item.kind === 'month' ? (
          <View style={styles.month} accessibilityRole="header">
            <Text variant="label" color="textTertiary">
              {t('ui.feed.month', {
                year: Math.floor(item.month / 12) + 1,
                month: (item.month % 12) + 1,
              })}
            </Text>
            <View style={styles.monthRule} />
          </View>
        ) : (
          <FeedEntryView
            entry={item.entry}
            fresh={freshIds.has(item.entry.id)}
            delay={(freshIds.get(item.entry.id) ?? 0) * 70}
          />
        )
      }
    />
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    content: { paddingHorizontal: gutter, paddingTop: space.m, paddingBottom: space.xl },
    month: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.m,
      marginTop: space.l,
      marginBottom: space.xs,
    },
    monthRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.hairline },
  }),
);

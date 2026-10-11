import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompactStats } from '../game/CompactStats';
import { useRun } from '../hooks/useRun';
import { gutter, space } from '../theme/tokens';
import { Text } from './Text';

/** A game tab: the stats strip, a bold title, then the content above the floating turn bar. */
export function TabPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const run = useRun();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {run !== null ? <CompactStats game={run.game} /> : null}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
          {subtitle !== undefined ? (
            <Text variant="callout" color="textSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

/** Space reserved under scrolling content for the floating turn bar and tab bar. */
export const BOTTOM_CLEARANCE = 170;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingTop: space.s, paddingBottom: BOTTOM_CLEARANCE },
  head: { gap: space.xs },
});

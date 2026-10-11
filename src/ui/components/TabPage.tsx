import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { gutter, space } from '../theme/tokens';
import { Text } from './Text';

/** Scrolling page inside a game tab, with an editorial title. */
export function TabPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <Text variant="title1" accessibilityRole="header">
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
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingTop: space.l, paddingBottom: space.x4 },
  head: { gap: space.xs },
});

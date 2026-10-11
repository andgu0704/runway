import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { gutter, space } from '../theme/tokens';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Page frame: canvas background, safe areas, side gutter, optional pinned footer in thumb reach. */
export function Screen({
  children,
  scroll = true,
  edges = ['top', 'bottom'],
  footer,
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, styles.content, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.canvas }]}>
      {body}
      {footer !== undefined ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: space.x3 },
  footer: { paddingHorizontal: gutter, paddingTop: space.m, paddingBottom: space.s, gap: space.s },
});

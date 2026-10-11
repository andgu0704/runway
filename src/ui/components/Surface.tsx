import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { cardShadow, radii, space } from '../theme/tokens';
import { Text } from './Text';

/** A white card with a soft shadow (light) or a lifted surface (dark). */
export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const styles = useStyles();
  const { scheme } = useTheme();
  return (
    <View style={[styles.card, cardShadow(scheme), padded ? styles.padded : null, style]}>
      {children}
    </View>
  );
}

/** Section title with an optional quiet aside on the right. */
export function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.section} accessibilityRole="header">
      <Text variant="title2">{title}</Text>
      {aside !== undefined ? (
        <Text variant="footnote" color="textTertiary">
          {aside}
        </Text>
      ) : null}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const styles = useStyles();
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    card: { backgroundColor: c.surface, borderRadius: radii.lg },
    padded: { padding: space.l },
    section: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: space.xxl,
      marginBottom: space.m,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.hairline },
  }),
);

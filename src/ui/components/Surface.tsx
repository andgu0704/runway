import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space } from '../theme/tokens';
import { Text } from './Text';

/** A quiet card: surface colour and a hairline, no shadow. */
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
  return <View style={[styles.card, padded ? styles.padded : null, style]}>{children}</View>;
}

/** Editorial section heading: a strong rule above a small uppercase label. */
export function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.section} accessibilityRole="header">
      <View style={styles.rule} />
      <View style={styles.sectionRow}>
        <Text variant="label" color="textSecondary">
          {title}
        </Text>
        {aside !== undefined ? (
          <Text variant="figureS" color="textTertiary">
            {aside}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const styles = useStyles();
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    padded: { padding: space.l },
    section: { marginTop: space.x3, marginBottom: space.m },
    rule: { height: 1.5, backgroundColor: c.rule, marginBottom: space.s },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.hairline },
  }),
);

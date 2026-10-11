import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { Touchable } from '../../components/Touchable';
import { haptic } from '../../../platform/haptics';
import { makeStyles } from '../../theme/ThemeProvider';
import { radii, space } from '../../theme/tokens';

/** A selectable row inside a picker. */
export function OptionRow({
  title,
  body,
  meta,
  selected,
  onPress,
  aside,
}: {
  title: string;
  body?: string | undefined;
  meta?: string | undefined;
  selected: boolean;
  onPress: () => void;
  aside?: ReactNode;
}) {
  const styles = useStyles();
  return (
    <Touchable
      feedback={false}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={[title, meta, body].filter(Boolean).join('. ')}
      style={[styles.row, selected ? styles.selected : null]}
    >
      <View style={styles.inner}>
        <View style={styles.text}>
          <Text variant="headline">{title}</Text>
          {body !== undefined ? (
            <Text variant="footnote" color="textSecondary">
              {body}
            </Text>
          ) : null}
          {meta !== undefined ? (
            <Text variant="figureS" color="textTertiary">
              {meta}
            </Text>
          ) : null}
        </View>
        {aside}
      </View>
    </Touchable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    row: {
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.hairline,
      paddingHorizontal: space.l,
      paddingVertical: space.m,
    },
    selected: { borderColor: c.accent, backgroundColor: c.accentSubtle },
    inner: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    text: { flex: 1, gap: 2 },
  }),
);

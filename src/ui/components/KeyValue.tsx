import { StyleSheet, View } from 'react-native';
import { space, type ColorName } from '../theme/tokens';
import { Text } from './Text';

/** A labelled figure on one line: "Monthly revenue ........ $42k". */
export function KeyValue({
  label,
  value,
  color = 'textPrimary',
}: {
  label: string;
  value: string;
  color?: ColorName;
}) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}, ${value}`}>
      <Text variant="callout" color="textSecondary" style={styles.label}>
        {label}
      </Text>
      <Text variant="figureM" color={color}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: space.m, paddingVertical: space.xs },
  label: { flex: 1 },
});

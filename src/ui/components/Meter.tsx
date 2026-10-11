import { StyleSheet, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { radii, type ColorName } from '../theme/tokens';

/** A thin horizontal bar for 0–1 values: progress, trust, readiness. */
export function Meter({
  value,
  color = 'accent',
  label,
}: {
  value: number;
  color?: ColorName;
  label: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: colors[color] }]} />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    track: { height: 8, borderRadius: radii.full, backgroundColor: c.sunken, overflow: 'hidden' },
    fill: { height: 8, borderRadius: radii.full },
  }),
);

import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTween } from '../hooks/useTween';
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
  const shown = useTween(clamped);
  const fill = useAnimatedStyle(() => ({ width: `${shown.value * 100}%` }));
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors[color] }, fill]} />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    track: {
      height: 14,
      borderRadius: radii.full,
      backgroundColor: c.sunken,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: c.ink,
    },
    fill: { height: '100%', borderRadius: radii.full },
  }),
);

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { radii, space } from '../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <Text variant="title2" align="center">
        {title}
      </Text>
      <Text variant="callout" color="textSecondary" align="center">
        {body}
      </Text>
      {action !== undefined ? (
        <Button kind="secondary" label={action.label} onPress={action.onPress} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  return (
    <View style={styles.empty} accessibilityRole="alert">
      <Text variant="title2" align="center">
        {title}
      </Text>
      <Text variant="callout" color="textSecondary" align="center">
        {body}
      </Text>
      <Button label={action.label} onPress={action.onPress} />
    </View>
  );
}

/** Placeholder blocks while something loads; pulses unless motion is reduced. */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  const styles = useStyles();
  const { reduceMotion } = useTheme();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduceMotion) opacity.value = withRepeat(withTiming(0.5, { duration: 700 }), -1, true);
  }, [opacity, reduceMotion]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.skeleton, pulse]} accessibilityLabel="Loading" accessible>
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={[styles.bar, { width: `${90 - i * 18}%` }]} />
      ))}
    </Animated.View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    empty: {
      alignItems: 'center',
      gap: space.m,
      paddingVertical: space.x4,
      paddingHorizontal: space.xl,
    },
    skeleton: { gap: space.m, paddingVertical: space.l },
    bar: { height: 14, borderRadius: radii.xs, backgroundColor: c.sunken },
  }),
);

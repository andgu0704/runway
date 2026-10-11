import { useEffect } from 'react';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { easing, motion } from '../theme/tokens';

const DECELERATE = Easing.bezier(...easing.decelerate);

/** A shared value that glides to `target` whenever it changes; jumps with reduced motion. */
export function useTween(target: number): SharedValue<number> {
  const { reduceMotion } = useTheme();
  const value = useSharedValue(target);
  useEffect(() => {
    value.value = reduceMotion
      ? target
      : withTiming(target, { duration: motion.slow, easing: DECELERATE });
  }, [target, reduceMotion, value]);
  return value;
}

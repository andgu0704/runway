import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { haptic } from '../../platform/haptics';
import { useTheme } from '../theme/ThemeProvider';
import { minTouch, motion } from '../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESSED_SCALE = 0.97;

export interface TouchableProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  children: ReactNode | ((pressed: boolean) => ReactNode);
  feedback?: boolean;
}

/**
 * Pressable with a guaranteed 44pt target, a light tap haptic and a pressed state:
 * a small spring-back scale, or just a dim when motion is reduced.
 */
export function Touchable({
  style,
  children,
  feedback = true,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: TouchableProps) {
  const { reduceMotion } = useTheme();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const active = pressed && disabled !== true;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      hitSlop={8}
      onPressIn={(e) => {
        setPressed(true);
        if (!reduceMotion && disabled !== true) {
          scale.value = withTiming(PRESSED_SCALE, { duration: motion.instant });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        scale.value = withTiming(1, { duration: motion.quick });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (feedback) haptic('tap');
        onPress?.(e);
      }}
      style={[
        { minHeight: minTouch, minWidth: minTouch, justifyContent: 'center' },
        typeof style === 'function' ? style(pressed) : style,
        active ? { opacity: reduceMotion ? 0.7 : 0.9 } : null,
        animated,
      ]}
    >
      {typeof children === 'function' ? children(pressed) : children}
    </AnimatedPressable>
  );
}

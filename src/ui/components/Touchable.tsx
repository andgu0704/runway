import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { haptic } from '../../platform/haptics';
import { minTouch } from '../theme/tokens';

export interface TouchableProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  children: ReactNode | ((pressed: boolean) => ReactNode);
  feedback?: boolean;
}

/** Pressable with a guaranteed 44pt target, a light tap haptic and a pressed state. */
export function Touchable({
  style,
  children,
  feedback = true,
  onPress,
  disabled,
  ...rest
}: TouchableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      hitSlop={8}
      onPress={(e) => {
        if (feedback) haptic('tap');
        onPress?.(e);
      }}
      style={({ pressed }) => [
        { minHeight: minTouch, minWidth: minTouch, justifyContent: 'center' },
        typeof style === 'function' ? style(pressed) : style,
        pressed && !disabled ? { opacity: 0.86 } : null,
      ]}
    >
      {({ pressed }) => (typeof children === 'function' ? children(pressed) : children)}
    </Pressable>
  );
}

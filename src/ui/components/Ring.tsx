import { View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTween } from '../hooks/useTween';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A 0–100 gauge with the value in the middle. */
export function Ring({
  value,
  color,
  size = 44,
}: {
  value: number;
  color: ColorName;
  size?: number;
}) {
  const { colors } = useTheme();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const shown = useTween(v);
  const arc = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - shown.value / 100),
  }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.sunken}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          animatedProps={arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors[color]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text variant="figureS">{String(Math.round(v))}</Text>
    </View>
  );
}

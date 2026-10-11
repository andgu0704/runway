import Svg, { Polygon, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';

/** A trend line with a soft fill underneath. Decorative: the figure beside it carries the meaning. */
export function Sparkline({
  values,
  width,
  height,
  color = 'money',
  filled = true,
}: {
  values: number[];
  width: number;
  height: number;
  color?: ColorName;
  filled?: boolean;
}) {
  const { colors } = useTheme();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = values.map(
    (v, i) =>
      [(i / (values.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 6)] as const,
  );
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <Svg
      width={width}
      height={height}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {filled ? (
        <Polygon
          points={`0,${height} ${line} ${width},${height}`}
          fill={colors[color]}
          opacity={0.14}
        />
      ) : null}
      <Polyline
        points={line}
        fill="none"
        stroke={colors[color]}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

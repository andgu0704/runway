import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';

/** A minimal line for trends. Purely decorative; the figure next to it carries the meaning. */
export function Sparkline({
  values,
  width,
  height,
  color = 'accent',
}: {
  values: number[];
  width: number;
  height: number;
  color?: ColorName;
}) {
  const { colors } = useTheme();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / span) * (height - 4)}`,
    )
    .join(' ');
  return (
    <Svg
      width={width}
      height={height}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Polyline
        points={points}
        fill="none"
        stroke={colors[color]}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

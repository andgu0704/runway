import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';
import { Text } from './Text';

/** Initials on a tint, so people are recognisable at a glance without photos. */
export function Avatar({
  name,
  color,
  size = 44,
}: {
  name: string;
  color: ColorName;
  size?: number;
}) {
  const { colors, scheme } = useTheme();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${colors[color]}${scheme === 'dark' ? '33' : '22'}`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant="headline"
        color={color}
        style={{ fontSize: size * 0.36, lineHeight: size * 0.44 }}
      >
        {initials}
      </Text>
    </View>
  );
}

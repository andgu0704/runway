import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

/** An icon on a tint of its own colour inside an ink outline, like a game tile. */
export function IconBadge({
  icon,
  color,
  size = 40,
  filled = true,
}: {
  icon: IconName;
  color: ColorName;
  size?: number;
  filled?: boolean;
}) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: `${colors[color]}${scheme === 'dark' ? '40' : '26'}`,
        borderWidth: size >= 28 ? 2 : 0,
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} color={color} size={Math.round(size * 0.55)} filled={filled} />
    </View>
  );
}

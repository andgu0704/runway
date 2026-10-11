import { StyleSheet, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { radii, type ColorName } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ChipTone =
  | 'neutral'
  | 'accent'
  | 'up'
  | 'down'
  | 'warn'
  | 'product'
  | 'people'
  | 'money'
  | 'world'
  | 'company';

const TEXT: Record<ChipTone, ColorName> = {
  neutral: 'textSecondary',
  accent: 'textPrimary',
  up: 'up',
  down: 'down',
  warn: 'warn',
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

/** A small tinted pill: effects, traits, states. */
export function Chip({
  label,
  tone = 'neutral',
  icon,
  solid = false,
}: {
  label: string;
  tone?: ChipTone;
  icon?: IconName;
  /** A white chip, for sitting on coloured buttons. */
  solid?: boolean;
}) {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const color = TEXT[tone];
  const background = solid
    ? colors.surface
    : tone === 'neutral' || tone === 'accent'
      ? colors.sunken
      : `${colors[color]}${scheme === 'dark' ? '2E' : '1A'}`;
  return (
    <View style={[styles.chip, { backgroundColor: background, borderColor: colors.ink }]}>
      {icon !== undefined ? <Icon name={icon} size={13} color={color} filled /> : null}
      <Text variant="footnote" color={color}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderWidth: 2,
      borderRadius: radii.full,
      alignSelf: 'flex-start',
    },
  }),
);

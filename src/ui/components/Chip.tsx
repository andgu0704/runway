import { StyleSheet, View } from 'react-native';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space, type ColorName } from '../theme/tokens';
import { Text } from './Text';

export type ChipTone = 'neutral' | 'accent' | 'up' | 'down' | 'warn';

const TEXT: Record<ChipTone, ColorName> = {
  neutral: 'textSecondary',
  accent: 'accent',
  up: 'up',
  down: 'down',
  warn: 'warn',
};

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: ChipTone }) {
  const styles = useStyles();
  return (
    <View style={[styles.chip, tone === 'accent' ? styles.accent : null]}>
      <Text variant="footnote" color={TEXT[tone]}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: space.s,
      paddingVertical: space.xxs,
      borderRadius: radii.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      backgroundColor: c.sunken,
      alignSelf: 'flex-start',
    },
    accent: { backgroundColor: c.accentSubtle, borderColor: c.accentSubtle },
  }),
);

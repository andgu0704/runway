import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { haptic } from '../../../platform/haptics';
import { IconBadge } from '../../components/IconBadge';
import type { IconName } from '../../components/Icon';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { Touchable } from '../../components/Touchable';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { cardShadow, radii, space, type ColorName } from '../../theme/tokens';

export interface OptionRowProps {
  title: string;
  body?: string | undefined;
  meta?: string | undefined;
  selected: boolean;
  onPress: () => void;
  aside?: ReactNode;
  icon?: IconName;
  color?: ColorName;
}

/** A selectable card inside a picker or onboarding step. */
export function OptionRow({
  title,
  body,
  meta,
  selected,
  onPress,
  aside,
  icon,
  color = 'product',
}: OptionRowProps) {
  const styles = useStyles();
  const { scheme } = useTheme();
  return (
    <Touchable
      feedback={false}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={[title, meta, body].filter(Boolean).join('. ')}
      style={[styles.row, cardShadow(scheme), selected ? styles.selected : null]}
    >
      <View style={styles.inner}>
        {icon !== undefined ? <IconBadge icon={icon} color={color} size={42} /> : null}
        <View style={styles.text}>
          <Text variant="headline">{title}</Text>
          {body !== undefined ? (
            <Text variant="callout" color="textSecondary">
              {body}
            </Text>
          ) : null}
          {meta !== undefined ? (
            <Text variant="footnote" color="textTertiary">
              {meta}
            </Text>
          ) : null}
        </View>
        {aside}
        {selected ? <Icon name="check" size={20} color="textPrimary" /> : null}
      </View>
    </Touchable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    row: {
      borderRadius: radii.lg,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: 'transparent',
      paddingHorizontal: space.m,
      paddingVertical: space.m,
    },
    selected: { borderColor: c.textPrimary },
    inner: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    text: { flex: 1, gap: 3 },
  }),
);

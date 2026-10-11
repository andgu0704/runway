import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { radii, space, type ColorName } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { Touchable } from './Touchable';

export type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'destructive';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  busy?: boolean;
  icon?: IconName;
  trailingIcon?: IconName;
  detail?: string;
  accessibilityHint?: string;
}

const TEXT: Record<ButtonKind, ColorName> = {
  primary: 'onAccent',
  secondary: 'textPrimary',
  tertiary: 'textPrimary',
  destructive: 'down',
};

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled = false,
  busy = false,
  icon,
  trailingIcon,
  detail,
  accessibilityHint,
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const textColor = TEXT[kind];
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityLabel={detail === undefined ? label : `${label}, ${detail}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || busy, busy }}
      style={(pressed) => [
        styles.base,
        styles[kind],
        pressed && kind === 'primary' ? { backgroundColor: colors.accentPressed } : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.row}>
        {busy ? <ActivityIndicator color={colors[textColor]} /> : null}
        {icon !== undefined && !busy ? <Icon name={icon} size={19} color={textColor} /> : null}
        <Text variant="headline" color={textColor}>
          {label}
        </Text>
        {detail !== undefined ? (
          <Text variant="figureS" color={textColor} style={styles.detail}>
            {detail}
          </Text>
        ) : null}
        {trailingIcon !== undefined ? (
          <Icon name={trailingIcon} size={18} color={textColor} />
        ) : null}
      </View>
    </Touchable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    base: {
      minHeight: 54,
      paddingHorizontal: space.xl,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.s },
    primary: { backgroundColor: c.accent },
    secondary: { backgroundColor: c.sunken },
    tertiary: { backgroundColor: 'transparent', minHeight: 44, paddingHorizontal: space.s },
    destructive: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.down },
    disabled: { opacity: 0.35 },
    detail: { opacity: 0.7 },
  }),
);

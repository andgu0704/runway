import type { ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { type as typeScale, type ColorName, type TypeName } from '../theme/tokens';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TypeName;
  color?: ColorName;
  align?: TextStyle['textAlign'];
  style?: TextStyle | TextStyle[];
  children?: ReactNode;
}

/** The only text primitive: every string on screen goes through the type scale. */
export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const t = typeScale[variant];
  const base: TextStyle = {
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    color: colors[color],
    ...('letterSpacing' in t ? { letterSpacing: t.letterSpacing } : {}),
    ...('textTransform' in t ? { textTransform: t.textTransform } : {}),
    ...('tabular' in t ? { fontVariant: ['tabular-nums'] } : {}),
    ...(align === undefined ? {} : { textAlign: align }),
  };
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={'maxScale' in t ? t.maxScale : undefined}
      style={[base, style]}
    />
  );
}

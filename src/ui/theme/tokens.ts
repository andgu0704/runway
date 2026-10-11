/**
 * Design tokens. Components read these through the theme, never raw values.
 * Palette: Soft Paper & Terracotta (see PLAN.md §6).
 */
export const palettes = {
  light: {
    canvas: '#F4F0E8',
    surface: '#FAF7F1',
    raised: '#FDFBF7',
    sunken: '#ECE7DC',
    hairline: '#DCD5C7',
    rule: '#4A453D',
    textPrimary: '#2A2722',
    textSecondary: '#5E584D',
    textTertiary: '#6E685C',
    accent: '#A84B29',
    accentPressed: '#8F3F22',
    accentSubtle: '#F0DED3',
    onAccent: '#FAF7F1',
    up: '#3E6B45',
    down: '#9A3346',
    warn: '#7F5A1C',
    scrim: 'rgba(42,39,34,0.32)',
    shadow: '#2A2722',
  },
  dark: {
    canvas: '#1C1A17',
    surface: '#24221E',
    raised: '#2C2A25',
    sunken: '#161512',
    hairline: '#3A3731',
    rule: '#BDB6A8',
    textPrimary: '#E8E2D6',
    textSecondary: '#ADA699',
    textTertiary: '#9A9488',
    accent: '#E08A64',
    accentPressed: '#C97753',
    accentSubtle: '#3A2A22',
    onAccent: '#1C1A17',
    up: '#86BE8E',
    down: '#E3919C',
    warn: '#D9AE62',
    scrim: 'rgba(0,0,0,0.50)',
    shadow: '#000000',
  },
} as const;

export type ColorName = keyof (typeof palettes)['light'];
export type Palette = Record<ColorName, string>;
export type Scheme = keyof typeof palettes;

export const space = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  x3: 32,
  x4: 40,
  x5: 56,
} as const;

export const gutter = space.xl;
export const minTouch = 44;

export const radii = { xs: 4, sm: 8, md: 14, lg: 24, full: 999 } as const;

export const fonts = {
  serif: 'Newsreader_500Medium',
  serifBold: 'Newsreader_600SemiBold',
  serifItalic: 'Newsreader_400Regular_Italic',
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansBold: 'IBMPlexSans_600SemiBold',
} as const;

export interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
  tabular?: boolean;
  /** Dense areas stop growing with Dynamic Type past this multiplier. */
  maxScale?: number;
}

export const type = {
  display: { fontFamily: fonts.serifBold, fontSize: 34, lineHeight: 38, maxScale: 1.4 },
  title1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 32, maxScale: 1.5 },
  title2: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 27, maxScale: 1.6 },
  headline: { fontFamily: fonts.sansBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 25 },
  bodySerif: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26 },
  callout: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
  footnote: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    maxScale: 1.4,
  },
  figureL: {
    fontFamily: fonts.sansMedium,
    fontSize: 28,
    lineHeight: 32,
    tabular: true,
    maxScale: 1.3,
  },
  figureM: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 22,
    tabular: true,
    maxScale: 1.35,
  },
  figureS: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    tabular: true,
    maxScale: 1.35,
  },
} as const satisfies Record<string, TypeStyle>;

export type TypeName = keyof typeof type;

export const motion = {
  instant: 100,
  quick: 180,
  base: 260,
  slow: 420,
  count: 600,
  countMax: 900,
  sheetSpring: { damping: 22, stiffness: 240, mass: 1 },
} as const;

/** Bezier control points, shared by Reanimated easings. */
export const easing = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0.05, 0.7, 0.1, 1],
  accelerate: [0.3, 0, 1, 1],
} as const;

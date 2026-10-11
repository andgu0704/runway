/**
 * Design tokens for the Daylight direction. Components read these through the
 * theme, never raw values. Light is the primary theme; dark mirrors it.
 */
export const palettes = {
  light: {
    canvas: '#F3F4F7',
    surface: '#FFFFFF',
    raised: '#FFFFFF',
    sunken: '#EEF0F4',
    hairline: '#E4E7EC',
    rule: '#D0D5DD',
    textPrimary: '#0E1116',
    textSecondary: '#535A68',
    textTertiary: '#676C7A',
    accent: '#0E1116',
    accentPressed: '#2A2F38',
    accentSubtle: '#E9EAEE',
    onAccent: '#FFFFFF',
    up: '#0C7A4C',
    down: '#C9383D',
    warn: '#9D5E00',
    scrim: 'rgba(14,17,22,0.36)',
    shadow: '#101828',
    product: '#6A4DF4',
    people: '#985E03',
    money: '#0C7A4C',
    world: '#1D6EC1',
    company: '#D02B1F',
  },
  dark: {
    canvas: '#0E1116',
    surface: '#171A21',
    raised: '#1E222B',
    sunken: '#232832',
    hairline: '#2A2F3A',
    rule: '#3A404D',
    textPrimary: '#F4F5F7',
    textSecondary: '#A9AFBC',
    textTertiary: '#8A91A0',
    accent: '#F4F5F7',
    accentPressed: '#D6D9E0',
    accentSubtle: '#262B35',
    onAccent: '#0E1116',
    up: '#3DD68C',
    down: '#FF6B70',
    warn: '#F5B544',
    scrim: 'rgba(0,0,0,0.6)',
    shadow: '#000000',
    product: '#A594FF',
    people: '#F5B544',
    money: '#3DD68C',
    world: '#5CB2FF',
    company: '#FF7A6E',
  },
} as const;

export type ColorName = keyof (typeof palettes)['light'];
export type Palette = Record<ColorName, string>;
export type Scheme = keyof typeof palettes;

/** The five areas of the company each own a colour, used for icons and highlights. */
export type Category = 'product' | 'people' | 'money' | 'world' | 'company';

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

export const gutter = space.l;
export const minTouch = 44;

export const radii = { xs: 6, sm: 12, md: 18, lg: 22, xl: 28, full: 999 } as const;

export const fonts = {
  display: 'Sora_700Bold',
  displayMedium: 'Sora_600SemiBold',
  body: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
  bodyHeavy: 'Manrope_800ExtraBold',
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
  display: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    maxScale: 1.4,
  },
  title1: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    maxScale: 1.5,
  },
  title2: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.2,
    maxScale: 1.6,
  },
  headline: { fontFamily: fonts.bodyHeavy, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodySerif: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  callout: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  footnote: { fontFamily: fonts.bodyBold, fontSize: 12.5, lineHeight: 17 },
  label: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    maxScale: 1.4,
  },
  figureXL: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.2,
    tabular: true,
    maxScale: 1.25,
  },
  figureL: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    tabular: true,
    maxScale: 1.3,
  },
  figureM: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 22,
    tabular: true,
    maxScale: 1.35,
  },
  figureS: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    lineHeight: 17,
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
  sheetSpring: { damping: 24, stiffness: 260, mass: 1 },
} as const;

/** Bezier control points, shared by Reanimated easings. */
export const easing = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0.05, 0.7, 0.1, 1],
  accelerate: [0.3, 0, 1, 1],
} as const;

/** A soft card shadow in light mode; dark mode relies on surface contrast instead. */
export function cardShadow(scheme: Scheme) {
  if (scheme === 'dark') return {};
  return {
    shadowColor: palettes.light.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  };
}

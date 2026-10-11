/**
 * Design tokens for the Playroom direction: a cosy tycoon game. Thick ink outlines,
 * chunky raised buttons and cards, rounded type, bright area colours. Light is cream
 * and sky; dark is a deep arcade purple. Components read these through the theme.
 */
export const palettes = {
  light: {
    canvas: '#FFF8EC',
    surface: '#FFFFFF',
    raised: '#FFFFFF',
    sunken: '#F5EDDE',
    hairline: '#EADFCC',
    rule: '#D8C9B0',
    ink: '#2A2140',
    textPrimary: '#2A2140',
    textSecondary: '#564D70',
    textTertiary: '#665E80',
    accent: '#FFC43D',
    accentPressed: '#F5B21C',
    accentSubtle: '#FFF0C2',
    onAccent: '#2A2140',
    up: '#13834D',
    down: '#D2343A',
    warn: '#9A5800',
    scrim: 'rgba(42,33,64,0.55)',
    shadow: '#2A2140',
    sky: '#A8DCFF',
    skyLow: '#DDF2FF',
    product: '#6A4DF4',
    people: '#A85A00',
    money: '#11834F',
    world: '#1F6CCB',
    company: '#D2343A',
  },
  dark: {
    canvas: '#170C3A',
    surface: '#231352',
    raised: '#2C1A68',
    sunken: '#100829',
    hairline: '#3A2A80',
    rule: '#4E3C9E',
    ink: '#0B0520',
    textPrimary: '#FFFFFF',
    textSecondary: '#D4CBF5',
    textTertiary: '#BDB2E6',
    accent: '#FFD84A',
    accentPressed: '#FFC21F',
    accentSubtle: '#3A2A1A',
    onAccent: '#3B1F00',
    up: '#52F59B',
    down: '#FF7A86',
    warn: '#FFC266',
    scrim: 'rgba(6,2,20,0.72)',
    shadow: '#000000',
    sky: '#3B22A0',
    skyLow: '#231352',
    product: '#B6A4FF',
    people: '#FFC266',
    money: '#52F59B',
    world: '#7CC4FF',
    company: '#FF8A8F',
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

export const radii = { xs: 8, sm: 12, md: 18, lg: 22, xl: 28, full: 999 } as const;

/** Outline thickness and the depth of the raised "3D" edge under cards and buttons. */
export const stroke = { line: 2.5, edge: 5, buttonEdge: 6 } as const;

export const fonts = {
  display: 'Fredoka_700Bold',
  displayMedium: 'Fredoka_600SemiBold',
  body: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_800ExtraBold',
  bodyHeavy: 'Nunito_900Black',
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
    fontSize: 34,
    lineHeight: 40,
    maxScale: 1.4,
  },
  title1: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    maxScale: 1.5,
  },
  title2: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 25,
    maxScale: 1.6,
  },
  headline: { fontFamily: fonts.displayMedium, fontSize: 17, lineHeight: 22 },
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
    tabular: true,
    maxScale: 1.25,
  },
  figureL: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
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

/** Card chrome: an ink outline with a thicker bottom edge, so surfaces look raised. */
export function cardShadow(scheme: Scheme) {
  const ink = palettes[scheme].ink;
  return {
    borderWidth: stroke.line,
    borderBottomWidth: stroke.edge,
    borderColor: ink,
  };
}

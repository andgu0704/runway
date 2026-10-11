import { describe, expect, it } from 'vitest';
import { palettes, type ColorName } from './tokens';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT: ColorName[] = [
  'textPrimary',
  'textSecondary',
  'textTertiary',
  'up',
  'down',
  'warn',
  'product',
  'people',
  'money',
  'world',
  'company',
];
const BACKGROUNDS: ColorName[] = ['canvas', 'surface', 'raised'];

describe('colour tokens', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const p = palettes[scheme];
    it(`${scheme}: every text colour meets WCAG AA on every background`, () => {
      for (const fg of TEXT) {
        for (const bg of BACKGROUNDS) {
          expect(contrast(p[fg], p[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
    it(`${scheme}: primary buttons are readable`, () => {
      expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.onAccent, p.accentPressed)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

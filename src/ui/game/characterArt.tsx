import { Circle, G, Path } from 'react-native-svg';

/** Scene colours are illustration, not interface: they stay the same in both themes. */
export const INK = '#2A2140';
const SKIN = ['#FFDCC2', '#F2C29B', '#D9A27C', '#C98B6B', '#8D5B3E', '#5C3A26'];
const HAIR = ['#2B1B12', '#3B2A20', '#1D1A1A', '#E2A13B', '#B5532A', '#6B4C9A', '#9AA3B5'];

export const SHIRTS = {
  product: '#7B61FF',
  people: '#FFB13D',
  money: '#2FBF71',
  world: '#3DA5FF',
  company: '#FF6B6B',
  founder: '#FFC43D',
} as const;

export type Shirt = keyof typeof SHIRTS;

export interface Look {
  skin: string;
  hair: string;
  /** 0 short, 1 long, 2 bun, 3 bald-ish. */
  style: number;
  shirt: string;
}

/** A rounded rectangle as a path, so it can be drawn with Path like everything else. */
export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.min(r, w / 2, h / 2);
  return `M${String(x + k)},${String(y)} h${String(w - 2 * k)} a${String(k)},${String(k)} 0 0 1 ${String(k)},${String(k)} v${String(h - 2 * k)} a${String(k)},${String(k)} 0 0 1 ${String(-k)},${String(k)} h${String(-(w - 2 * k))} a${String(k)},${String(k)} 0 0 1 ${String(-k)},${String(-k)} v${String(-(h - 2 * k))} a${String(k)},${String(k)} 0 0 1 ${String(k)},${String(-k)}z`;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable look for a person: the same id always draws the same face. */
export function lookFor(id: string, shirt: Shirt): Look {
  const h = hash(id);
  return {
    skin: SKIN[h % SKIN.length] ?? '#F2C29B',
    hair: HAIR[(h >>> 4) % HAIR.length] ?? '#3B2A20',
    style: (h >>> 9) % 4,
    shirt: SHIRTS[shirt],
  };
}

function Hair({ look, r }: { look: Look; r: number }) {
  const top = `M${-r},${-r * 0.15} a${r},${r} 0 0 1 ${r * 2},0 q${-r * 0.5},${-r * 0.42} ${-r},${-r * 0.34} q${-r * 0.58},0 ${-r},${r * 0.34}z`;
  if (look.style === 3) {
    return (
      <Path
        d={`M${-r * 0.9},${-r * 0.35} q${r * 0.9},${-r * 0.9} ${r * 1.8},0`}
        stroke={look.hair}
        strokeWidth={r * 0.3}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return (
    <G>
      {look.style === 1 ? (
        <Path d={roundRect(-r * 1.02, -r * 0.2, r * 2.04, r * 1.15, r * 0.4)} fill={look.hair} />
      ) : null}
      {look.style === 2 ? <Circle cx={0} cy={-r * 1.05} r={r * 0.38} fill={look.hair} /> : null}
      <Path d={top} fill={look.hair} />
    </G>
  );
}

/** A face centred on (0,0) with radius r; mood bends the mouth. */
export function Face({ look, r, mood = 1 }: { look: Look; r: number; mood?: number }) {
  const smile = mood > 0.2 ? 1 : mood > -0.4 ? 0 : -1;
  const mouth = `M${-r * 0.3},${r * 0.42} q${r * 0.3},${smile * r * 0.25} ${r * 0.6},0`;
  return (
    <G>
      {look.style === 1 ? (
        <Path d={roundRect(-r * 1.02, -r * 0.2, r * 2.04, r * 1.15, r * 0.4)} fill={look.hair} />
      ) : null}
      <Circle cx={0} cy={0} r={r} fill={look.skin} stroke={INK} strokeWidth={r * 0.12} />
      <Hair look={{ ...look, style: look.style === 1 ? 0 : look.style }} r={r} />
      <Circle cx={-r * 0.34} cy={r * 0.05} r={r * 0.13} fill={INK} />
      <Circle cx={r * 0.34} cy={r * 0.05} r={r * 0.13} fill={INK} />
      <Path d={mouth} stroke={INK} strokeWidth={r * 0.12} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** A small standing figure for the office scene, feet at (0,0). */
export function Figure({ look, mood = 1 }: { look: Look; mood?: number }) {
  return (
    <G>
      <Path d="M-13,2 a13,6 0 1 0 26,0 a13,6 0 1 0 -26,0" fill="#000" opacity={0.13} />
      <Path d={roundRect(-11, -30, 22, 30, 9)} fill={look.shirt} stroke={INK} strokeWidth={2} />
      <G transform="translate(0,-41)">
        <Face look={look} r={12} mood={mood} />
      </G>
    </G>
  );
}

/** Head and shoulders for cards and avatars, drawn in a 100×100 box. */
export function Bust({ look, mood = 1 }: { look: Look; mood?: number }) {
  return (
    <G>
      <Path d="M14,104 q0,-36 36,-36 q36,0 36,36z" fill={look.shirt} stroke={INK} strokeWidth={3} />
      <G transform="translate(50,44)">
        <Face look={look} r={23} mood={mood} />
      </G>
    </G>
  );
}

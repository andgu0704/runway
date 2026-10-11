import { Circle, Ellipse, G, Path } from 'react-native-svg';

/**
 * Cartoon people for the office, cards, avatars and events. Proportions are chibi:
 * big heads with big eyes, small bodies. Colours here are illustration, not interface,
 * so they stay the same in both themes.
 */
export const INK = '#2A2140';
const SKIN = ['#FFE0C8', '#F6CBA5', '#E3AE85', '#C98D66', '#A0694A', '#6E4530'];
const HAIR = [
  '#2B1B12',
  '#4A3020',
  '#1C1A1F',
  '#E2A13B',
  '#C2552B',
  '#7A55C9',
  '#B8BFCC',
  '#F27BA6',
];
const BLUSH = '#FF8FA3';

export const SHIRTS = {
  product: '#7B61FF',
  people: '#FFB13D',
  money: '#2FBF71',
  world: '#3DA5FF',
  company: '#FF6B6B',
  founder: '#FFC43D',
} as const;

export type Shirt = keyof typeof SHIRTS;
export type Outfit = 'tee' | 'hoodie' | 'collar' | 'blazer';

export interface Look {
  skin: string;
  hair: string;
  /** Which of the hair styles (0–9) to draw. */
  style: number;
  shirt: string;
  outfit: Outfit;
  glasses: boolean;
  beard: boolean;
  earrings: boolean;
}

const HAIR_STYLES = 10;

/** What people wear for their job: engineers live in hoodies, executives in blazers. */
export function outfitFor(role: string): Outfit {
  if (role.startsWith('vp')) return 'blazer';
  if (role === 'engineer') return 'hoodie';
  if (role === 'salesRep' || role === 'peopleOps') return 'collar';
  return 'tee';
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

/** A stable look for a person: the same seed always draws the same face. */
export function lookFor(seed: string, shirt: Shirt, outfit?: Outfit): Look {
  const h = hash(seed);
  const h2 = hash(`${seed}#`);
  return {
    skin: SKIN[h % SKIN.length] ?? '#F6CBA5',
    hair: HAIR[(h >>> 4) % HAIR.length] ?? '#2B1B12',
    style: (h >>> 9) % HAIR_STYLES,
    shirt: SHIRTS[shirt],
    outfit: outfit ?? (h2 % 3 === 0 ? 'hoodie' : 'tee'),
    glasses: h2 % 4 === 1,
    beard: (h2 >>> 3) % 6 === 0,
    earrings: (h2 >>> 6) % 5 === 0,
  };
}

const n = (v: number) => String(Math.round(v * 100) / 100);

/** Hair that sits behind the head: long hair, bobs, ponytails, buns, curls. */
function BackHair({ look, r }: { look: Look; r: number }) {
  const { style, hair } = look;
  const s = { fill: hair, stroke: INK, strokeWidth: r * 0.07 };
  if (style === 3)
    return <Path d={roundRect(-r * 1.08, -r * 0.5, r * 2.16, r * 1.75, r * 0.6)} {...s} />;
  if (style === 4)
    return <Path d={roundRect(-r * 1.1, -r * 0.6, r * 2.2, r * 1.35, r * 0.55)} {...s} />;
  if (style === 5)
    return <Ellipse cx={r * 0.95} cy={r * 0.35} rx={r * 0.32} ry={r * 0.62} {...s} />;
  if (style === 6) return <Circle cx={0} cy={-r * 1.12} r={r * 0.42} {...s} />;
  if (style === 2) return <Circle cx={0} cy={-r * 0.15} r={r * 1.22} {...s} />;
  return null;
}

/** Hair on top of the head. */
function FrontHair({ look, r }: { look: Look; r: number }) {
  const { style, hair } = look;
  const s = { fill: hair, stroke: INK, strokeWidth: r * 0.07, strokeLinejoin: 'round' as const };
  switch (style) {
    case 0: // short crop with a fringe
      return (
        <Path
          d={`M${n(-r)},${n(-r * 0.1)} C${n(-r)},${n(-r * 1.2)} ${n(r)},${n(-r * 1.2)} ${n(r)},${n(-r * 0.1)} C${n(r * 0.5)},${n(-r * 0.55)} ${n(-r * 0.2)},${n(-r * 0.35)} ${n(-r)},${n(-r * 0.1)}Z`}
          {...s}
        />
      );
    case 1: // side-parted sweep
      return (
        <Path
          d={`M${n(-r * 1.02)},0 C${n(-r * 1.1)},${n(-r * 1.25)} ${n(r * 1.1)},${n(-r * 1.25)} ${n(r * 1.02)},${n(-r * 0.05)} C${n(r * 0.7)},${n(-r * 0.45)} ${n(-r * 0.1)},${n(-r * 0.75)} ${n(-r * 0.35)},${n(-r * 0.3)} C${n(-r * 0.6)},${n(-r * 0.2)} ${n(-r * 0.85)},${n(-r * 0.15)} ${n(-r * 1.02)},0Z`}
          {...s}
        />
      );
    case 2: // curls on top
      return (
        <G>
          {[-0.7, -0.25, 0.25, 0.7].map((x) => (
            <Circle key={x} cx={r * x} cy={-r * (0.72 - Math.abs(x) * 0.15)} r={r * 0.38} {...s} />
          ))}
        </G>
      );
    case 3: // long, with a centre parting
    case 4: {
      // bob with a full fringe
      const dip = style === 4 ? 0.35 : 0.6;
      return (
        <Path
          d={`M${n(-r * 1.02)},${n(-r * 0.05)} C${n(-r * 1.05)},${n(-r * 1.2)} ${n(r * 1.05)},${n(-r * 1.2)} ${n(r * 1.02)},${n(-r * 0.05)} C${n(r * 0.6)},${n(-r * dip)} ${n(-r * 0.6)},${n(-r * dip)} ${n(-r * 1.02)},${n(-r * 0.05)}Z`}
          {...s}
        />
      );
    }
    case 5: // ponytail, swept back
    case 6: // bun, swept up
      return (
        <Path
          d={`M${n(-r)},${n(-r * 0.15)} C${n(-r * 0.95)},${n(-r * 1.2)} ${n(r * 0.95)},${n(-r * 1.2)} ${n(r)},${n(-r * 0.15)} C${n(r * 0.4)},${n(-r * 0.7)} ${n(-r * 0.4)},${n(-r * 0.7)} ${n(-r)},${n(-r * 0.15)}Z`}
          {...s}
        />
      );
    case 7: // spiky
      return (
        <Path
          d={`M${n(-r)},${n(-r * 0.1)} L${n(-r * 0.95)},${n(-r * 0.9)} L${n(-r * 0.55)},${n(-r * 0.75)} L${n(-r * 0.4)},${n(-r * 1.3)} L${n(-r * 0.05)},${n(-r * 0.9)} L${n(r * 0.3)},${n(-r * 1.32)} L${n(r * 0.45)},${n(-r * 0.85)} L${n(r * 0.9)},${n(-r * 1.05)} L${n(r)},${n(-r * 0.1)} C${n(r * 0.4)},${n(-r * 0.5)} ${n(-r * 0.4)},${n(-r * 0.5)} ${n(-r)},${n(-r * 0.1)}Z`}
          {...s}
        />
      );
    case 8: // buzz cut
      return (
        <Path
          d={`M${n(-r * 0.98)},${n(-r * 0.25)} C${n(-r * 0.9)},${n(-r * 1.1)} ${n(r * 0.9)},${n(-r * 1.1)} ${n(r * 0.98)},${n(-r * 0.25)} C${n(r * 0.5)},${n(-r * 0.62)} ${n(-r * 0.5)},${n(-r * 0.62)} ${n(-r * 0.98)},${n(-r * 0.25)}Z`}
          {...s}
        />
      );
    default: // quiff
      return (
        <Path
          d={`M${n(-r)},${n(-r * 0.1)} C${n(-r * 1.05)},${n(-r)} ${n(-r * 0.2)},${n(-r * 1.45)} ${n(r * 0.6)},${n(-r * 1.15)} C${n(r)},${n(-r * 0.95)} ${n(r * 1.05)},${n(-r * 0.5)} ${n(r)},${n(-r * 0.1)} C${n(r * 0.4)},${n(-r * 0.55)} ${n(-r * 0.4)},${n(-r * 0.55)} ${n(-r)},${n(-r * 0.1)}Z`}
          {...s}
        />
      );
  }
}

/** Soft dot eyes with a sparkle; very happy people close them into little arcs. */
function Eye({ x, r, mood }: { x: number; r: number; mood: number }) {
  const y = r * 0.14;
  if (mood > 0.9)
    return (
      <Path
        d={`M${n(x - r * 0.15)},${n(y + r * 0.04)} Q${n(x)},${n(y - r * 0.14)} ${n(x + r * 0.15)},${n(y + r * 0.04)}`}
        stroke={INK}
        strokeWidth={r * 0.08}
        fill="none"
        strokeLinecap="round"
      />
    );
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={r * 0.12} ry={r * 0.15} fill={INK} />
      <Circle cx={x + r * 0.045} cy={y - r * 0.06} r={r * 0.045} fill="#FFFFFF" />
    </G>
  );
}

/** A friendly face centred on (0,0) with head radius r. Mood from -1 to 1 shapes eyes and mouth. */
export function Face({ look, r, mood = 1 }: { look: Look; r: number; mood?: number }) {
  const happy = mood > 0.2;
  const sad = mood < -0.4;
  const line = { stroke: INK, fill: 'none', strokeLinecap: 'round' as const };
  const outline = r * 0.07;
  return (
    <G>
      <BackHair look={look} r={r} />
      {[-1, 1].map((side) => (
        <Circle
          key={`ear${String(side)}`}
          cx={side * r * 0.95}
          cy={r * 0.18}
          r={r * 0.17}
          fill={look.skin}
          stroke={INK}
          strokeWidth={outline}
        />
      ))}
      {look.earrings
        ? [-1, 1].map((side) => (
            <Circle
              key={`ring${String(side)}`}
              cx={side * r * 0.95}
              cy={r * 0.42}
              r={r * 0.07}
              fill="#FFC43D"
              stroke={INK}
              strokeWidth={r * 0.03}
            />
          ))
        : null}
      <Ellipse
        cx={0}
        cy={0}
        rx={r}
        ry={r * 0.96}
        fill={look.skin}
        stroke={INK}
        strokeWidth={outline}
      />
      {look.beard ? (
        <Path
          d={`M${n(-r * 0.9)},${n(r * 0.2)} C${n(-r * 0.85)},${n(r * 1.05)} ${n(r * 0.85)},${n(r * 1.05)} ${n(r * 0.9)},${n(r * 0.2)} C${n(r * 0.55)},${n(r * 0.62)} ${n(-r * 0.55)},${n(r * 0.62)} ${n(-r * 0.9)},${n(r * 0.2)}Z`}
          fill={look.hair}
          stroke={INK}
          strokeWidth={outline * 0.8}
        />
      ) : null}
      {[-1, 1].map((side) => (
        <Ellipse
          key={`blush${String(side)}`}
          cx={side * r * 0.6}
          cy={r * 0.42}
          rx={r * 0.18}
          ry={r * 0.11}
          fill={BLUSH}
          opacity={0.45}
        />
      ))}
      <Eye x={-r * 0.38} r={r} mood={mood} />
      <Eye x={r * 0.38} r={r} mood={mood} />
      {sad
        ? [-1, 1].map((side) => (
            <Path
              key={`brow${String(side)}`}
              d={`M${n(side * r * 0.5)},${n(-r * 0.12)} L${n(side * r * 0.24)},${n(-r * 0.22)}`}
              strokeWidth={r * 0.06}
              {...line}
            />
          ))
        : null}
      {happy ? (
        <Path
          d={`M${n(-r * 0.17)},${n(r * 0.44)} Q0,${n(r * 0.66)} ${n(r * 0.17)},${n(r * 0.44)} Z`}
          fill="#FF7A8A"
          stroke={INK}
          strokeWidth={r * 0.06}
          strokeLinejoin="round"
        />
      ) : (
        <Path
          d={
            sad
              ? `M${n(-r * 0.13)},${n(r * 0.56)} Q0,${n(r * 0.44)} ${n(r * 0.13)},${n(r * 0.56)}`
              : `M${n(-r * 0.12)},${n(r * 0.47)} Q0,${n(r * 0.56)} ${n(r * 0.12)},${n(r * 0.47)}`
          }
          strokeWidth={r * 0.07}
          {...line}
        />
      )}
      {look.glasses ? (
        <G>
          {[-1, 1].map((side) => (
            <Circle
              key={`lens${String(side)}`}
              cx={side * r * 0.38}
              cy={r * 0.14}
              r={r * 0.25}
              fill="#FFFFFF"
              fillOpacity={0.2}
              stroke={INK}
              strokeWidth={r * 0.055}
            />
          ))}
          <Path
            d={`M${n(-r * 0.13)},${n(r * 0.12)} L${n(r * 0.13)},${n(r * 0.12)}`}
            stroke={INK}
            strokeWidth={r * 0.055}
          />
        </G>
      ) : null}
      <FrontHair look={look} r={r} />
    </G>
  );
}

/** Torso and outfit from the shoulders down, half-width w and height h, starting at y=0. */
function Torso({ look, w, h }: { look: Look; w: number; h: number }) {
  const sw = w * 0.07;
  const join = { strokeLinejoin: 'round' as const };
  return (
    <G>
      <Path
        d={`M${n(-w)},${n(h)} C${n(-w)},${n(h * 0.25)} ${n(-w * 0.7)},0 0,0 C${n(w * 0.7)},0 ${n(w)},${n(h * 0.25)} ${n(w)},${n(h)} Z`}
        fill={look.shirt}
        stroke={INK}
        strokeWidth={sw}
        {...join}
      />
      {look.outfit === 'hoodie' ? (
        <G>
          <Path
            d={`M${n(-w * 0.55)},${n(h * 0.02)} Q0,${n(h * 0.42)} ${n(w * 0.55)},${n(h * 0.02)}`}
            fill="#00000026"
            stroke={INK}
            strokeWidth={sw * 0.8}
          />
          <Path
            d={`M${n(-w * 0.15)},${n(h * 0.25)} l0,${n(h * 0.3)} M${n(w * 0.15)},${n(h * 0.25)} l0,${n(h * 0.3)}`}
            stroke="#FFFFFF"
            strokeWidth={sw * 0.8}
            strokeLinecap="round"
          />
        </G>
      ) : null}
      {look.outfit === 'tee' ? (
        <Path
          d={`M${n(-w * 0.32)},${n(h * 0.03)} Q0,${n(h * 0.3)} ${n(w * 0.32)},${n(h * 0.03)}`}
          fill="none"
          stroke={INK}
          strokeWidth={sw * 0.8}
        />
      ) : null}
      {look.outfit === 'blazer' ? (
        <G>
          <Path
            d={`M${n(-w * 0.34)},${n(h * 0.01)} L0,${n(h * 0.72)} L${n(w * 0.34)},${n(h * 0.01)} Q0,${n(h * 0.1)} ${n(-w * 0.34)},${n(h * 0.01)}Z`}
            fill="#FFFFFF"
            stroke={INK}
            strokeWidth={sw * 0.7}
            {...join}
          />
          <Path
            d={`M${n(-w * 0.07)},${n(h * 0.1)} L${n(w * 0.07)},${n(h * 0.1)} L${n(w * 0.1)},${n(h * 0.55)} L0,${n(h * 0.68)} L${n(-w * 0.1)},${n(h * 0.55)}Z`}
            fill={INK}
          />
        </G>
      ) : null}
      {look.outfit === 'collar' ? (
        <Path
          d={`M${n(-w * 0.28)},${n(-h * 0.02)} L${n(-w * 0.04)},${n(h * 0.22)} L${n(-w * 0.32)},${n(h * 0.24)}Z M${n(w * 0.28)},${n(-h * 0.02)} L${n(w * 0.04)},${n(h * 0.22)} L${n(w * 0.32)},${n(h * 0.24)}Z`}
          fill="#FFFFFF"
          stroke={INK}
          strokeWidth={sw * 0.7}
          {...join}
        />
      ) : null}
    </G>
  );
}

/** A small seated figure for the office scene, feet at (0,0): big head, small body, hands on the desk. */
export function Figure({ look, mood = 1 }: { look: Look; mood?: number }) {
  return (
    <G>
      <Ellipse cx={0} cy={2} rx={15} ry={6} fill="#000000" opacity={0.13} />
      <G transform="translate(0,-26)">
        <Torso look={look} w={13} h={26} />
      </G>
      {[-1, 1].map((side) => (
        <Ellipse
          key={`hand${String(side)}`}
          cx={side * 11}
          cy={-8}
          rx={4.5}
          ry={4}
          fill={look.skin}
          stroke={INK}
          strokeWidth={1.6}
        />
      ))}
      <G transform="translate(0,-42)">
        <Face look={look} r={15} mood={mood} />
      </G>
    </G>
  );
}

/** Head and shoulders for cards and avatars, drawn in a 100×100 box. */
export function Bust({ look, mood = 1 }: { look: Look; mood?: number }) {
  return (
    <G>
      <G transform="translate(50,74)">
        <Torso look={look} w={36} h={34} />
      </G>
      <G transform="translate(50,44)">
        <Face look={look} r={27} mood={mood} />
      </G>
    </G>
  );
}

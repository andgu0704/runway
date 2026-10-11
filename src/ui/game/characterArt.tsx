import { Circle, Ellipse, G, Path } from 'react-native-svg';

/**
 * Illustrated people for the office, cards, avatars and events, in a semi-realistic flat
 * style: natural head-to-body proportions, almond eyes with coloured irises, brows, nose
 * and lips, soft shading, and outlines in darker tones of skin, hair and fabric rather
 * than black ink. Colours here are illustration, not interface, so they stay the same
 * in both themes.
 */
export const INK = '#2A2140';
const SKIN = ['#F9DCC4', '#F1C6A0', '#DDA77E', '#C08460', '#9A6444', '#6B4330'];
const HAIR = [
  '#2B1B12',
  '#4A3020',
  '#1C1A1F',
  '#8A5A2B',
  '#C08A4A',
  '#B5532A',
  '#9AA0AA',
  '#E3C58C',
];
const IRIS = ['#5B3A1E', '#3D6FA6', '#4E7D3A', '#7A5A2F', '#2E2A28', '#6B8FA3'];

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
  eyes: string;
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

/** Darkens (f < 1) or lightens (f > 1) a hex colour. */
export function shade(hex: string, f: number): string {
  const v = parseInt(hex.slice(1), 16);
  const c = [v >> 16, (v >> 8) & 255, v & 255].map((x) =>
    Math.max(0, Math.min(255, Math.round(f > 1 ? x + (255 - x) * (f - 1) : x * f))),
  );
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
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
    skin: SKIN[h % SKIN.length] ?? '#F1C6A0',
    hair: HAIR[(h >>> 4) % HAIR.length] ?? '#2B1B12',
    eyes: IRIS[(h2 >>> 9) % IRIS.length] ?? '#5B3A1E',
    style: (h >>> 9) % HAIR_STYLES,
    shirt: SHIRTS[shirt],
    outfit: outfit ?? (h2 % 3 === 0 ? 'hoodie' : 'tee'),
    glasses: h2 % 4 === 1,
    beard: (h2 >>> 3) % 6 === 0,
    earrings: (h2 >>> 6) % 5 === 0,
  };
}

const n = (v: number) => String(Math.round(v * 100) / 100);

/** The crown of the hair, shared by most styles: from the left temple over to the right. */
function crown(r: number, lift = 1): string {
  return `M${n(-r * 1.05)},${n(r * 0.05)} C${n(-r * 1.12)},${n(-r * 1.38 * lift)} ${n(r * 1.12)},${n(-r * 1.38 * lift)} ${n(r * 1.05)},${n(r * 0.05)}`;
}

/** Hair that sits behind the head and neck: long hair, bobs, ponytails, buns, curls. */
function BackHair({ look, r }: { look: Look; r: number }) {
  const { style, hair } = look;
  const s = { fill: hair, stroke: shade(hair, 0.7), strokeWidth: r * 0.04 };
  if (style === 3)
    return (
      <Path
        d={`M${n(-r * 1.1)},${n(-r * 0.2)} C${n(-r * 1.25)},${n(r * 0.8)} ${n(-r * 1.1)},${n(r * 1.35)} ${n(-r * 0.8)},${n(r * 1.55)} L${n(r * 0.8)},${n(r * 1.55)} C${n(r * 1.1)},${n(r * 1.35)} ${n(r * 1.25)},${n(r * 0.8)} ${n(r * 1.1)},${n(-r * 0.2)} Z`}
        {...s}
      />
    );
  if (style === 4)
    return (
      <Path
        d={`M${n(-r * 1.15)},${n(-r * 0.3)} C${n(-r * 1.25)},${n(r * 0.5)} ${n(-r * 1.15)},${n(r * 0.95)} ${n(-r * 0.9)},${n(r)} L${n(r * 0.9)},${n(r)} C${n(r * 1.15)},${n(r * 0.95)} ${n(r * 1.25)},${n(r * 0.5)} ${n(r * 1.15)},${n(-r * 0.3)} Z`}
        {...s}
      />
    );
  if (style === 5) return <Ellipse cx={r} cy={r * 0.25} rx={r * 0.28} ry={r * 0.7} {...s} />;
  if (style === 6) return <Circle cx={r * 0.1} cy={-r * 1.25} r={r * 0.36} {...s} />;
  if (style === 2) return <Circle cx={0} cy={-r * 0.3} r={r * 1.32} {...s} />;
  return null;
}

/** Hair on top of the head; the hairline sits above the brows. */
function FrontHair({ look, r }: { look: Look; r: number }) {
  const { style, hair } = look;
  if (style === 9) return null;
  const s = {
    fill: hair,
    stroke: shade(hair, 0.7),
    strokeWidth: r * 0.04,
    strokeLinejoin: 'round' as const,
  };
  let d: string;
  switch (style) {
    case 0: // short, parted to one side
      d = `${crown(r)} C${n(r * 0.85)},${n(-r * 0.5)} ${n(r * 0.3)},${n(-r * 0.68)} ${n(-r * 0.15)},${n(-r * 0.62)} C${n(-r * 0.6)},${n(-r * 0.55)} ${n(-r * 0.92)},${n(-r * 0.35)} ${n(-r * 1.05)},${n(r * 0.05)} Z`;
      break;
    case 1: // swept fringe
      d = `${crown(r)} C${n(r * 0.9)},${n(-r * 0.35)} ${n(r * 0.55)},${n(-r * 0.62)} ${n(r * 0.1)},${n(-r * 0.58)} C${n(-r * 0.35)},${n(-r * 0.5)} ${n(-r * 0.7)},${n(-r * 0.25)} ${n(-r * 1.05)},${n(r * 0.05)} Z`;
      break;
    case 2: // curls along the hairline
      return (
        <G>
          {[-0.85, -0.45, 0, 0.45, 0.85].map((x) => (
            <Circle key={x} cx={r * x} cy={-r * (0.78 - Math.abs(x) * 0.25)} r={r * 0.32} {...s} />
          ))}
        </G>
      );
    case 3: // long, centre parting
    case 4: {
      // bob with a soft fringe
      const dip = style === 4 ? 0.48 : 0.7;
      d = `${crown(r, 1.02)} C${n(r * 0.95)},${n(-r * 0.4)} ${n(r * 0.45)},${n(-r * dip)} 0,${n(-r * 0.72)} C${n(-r * 0.45)},${n(-r * dip)} ${n(-r * 0.95)},${n(-r * 0.4)} ${n(-r * 1.05)},${n(r * 0.05)} Z`;
      break;
    }
    case 5: // ponytail, pulled back
    case 6: // bun, pulled up
      d = `${crown(r)} C${n(r * 0.75)},${n(-r * 0.6)} ${n(r * 0.3)},${n(-r * 0.72)} 0,${n(-r * 0.72)} C${n(-r * 0.3)},${n(-r * 0.72)} ${n(-r * 0.75)},${n(-r * 0.6)} ${n(-r * 1.05)},${n(r * 0.05)} Z`;
      break;
    case 7: // textured crop
      d = `M${n(-r * 1.05)},${n(r * 0.05)} C${n(-r * 1.1)},${n(-r * 0.9)} ${n(-r * 0.7)},${n(-r * 1.3)} ${n(-r * 0.2)},${n(-r * 1.25)} L${n(-r * 0.05)},${n(-r * 1.38)} L${n(r * 0.15)},${n(-r * 1.24)} L${n(r * 0.4)},${n(-r * 1.32)} L${n(r * 0.55)},${n(-r * 1.18)} C${n(r)},${n(-r * 1.05)} ${n(r * 1.12)},${n(-r * 0.6)} ${n(r * 1.05)},${n(r * 0.05)} C${n(r * 0.8)},${n(-r * 0.55)} ${n(-r * 0.8)},${n(-r * 0.55)} ${n(-r * 1.05)},${n(r * 0.05)} Z`;
      break;
    default: // 8: close buzz cut
      return (
        <Path
          d={`M${n(-r)},${n(-r * 0.25)} C${n(-r)},${n(-r * 1.25)} ${n(r)},${n(-r * 1.25)} ${n(r)},${n(-r * 0.25)} C${n(r * 0.6)},${n(-r * 0.7)} ${n(-r * 0.6)},${n(-r * 0.7)} ${n(-r)},${n(-r * 0.25)} Z`}
          fill={mix(hair, look.skin, 0.35)}
        />
      );
  }
  return (
    <G>
      <Path d={d} {...s} />
      <Path
        d={`M${n(-r * 0.55)},${n(-r * 0.92)} Q${n(-r * 0.1)},${n(-r * 1.12)} ${n(r * 0.35)},${n(-r * 0.98)}`}
        stroke={shade(hair, 1.35)}
        strokeWidth={r * 0.06}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
    </G>
  );
}

function Eye({ x, r, look, mood }: { x: number; r: number; look: Look; mood: number }) {
  const y = r * 0.1;
  const open = mood > 0.6 ? 0.78 : 1;
  const w = r * 0.21;
  const lid = `M${n(x - w)},${n(y)} Q${n(x)},${n(y - r * 0.25 * open)} ${n(x + w)},${n(y)}`;
  return (
    <G>
      <Path d={`${lid} Q${n(x)},${n(y + r * 0.17 * open)} ${n(x - w)},${n(y)} Z`} fill="#FFFFFF" />
      <Circle cx={x} cy={y} r={r * 0.095 * Math.min(1, open + 0.1)} fill={look.eyes} />
      <Circle cx={x} cy={y} r={r * 0.048} fill="#1A1414" />
      <Circle cx={x + r * 0.035} cy={y - r * 0.035} r={r * 0.025} fill="#FFFFFF" />
      <Path d={lid} stroke="#2A1E1E" strokeWidth={r * 0.05} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** A face centred on (0,0) with half-width r; the head is about 2.1r tall. */
export function Face({ look, r, mood = 1 }: { look: Look; r: number; mood?: number }) {
  const happy = mood > 0.2;
  const sad = mood < -0.4;
  const edge = shade(look.skin, 0.72);
  const lips = mix(look.skin, '#B5475A', 0.45);
  const light = look.hair === '#9AA0AA' || look.hair === '#E3C58C';
  const brow = shade(light ? '#6B5A48' : look.hair, 0.85);
  const head = `M${n(-r)},${n(-r * 0.15)} C${n(-r)},${n(-r * 1.25)} ${n(r)},${n(-r * 1.25)} ${n(r)},${n(-r * 0.15)} C${n(r)},${n(r * 0.48)} ${n(r * 0.62)},${n(r * 1.02)} 0,${n(r * 1.1)} C${n(-r * 0.62)},${n(r * 1.02)} ${n(-r)},${n(r * 0.48)} ${n(-r)},${n(-r * 0.15)} Z`;
  return (
    <G>
      <BackHair look={look} r={r} />
      <Path
        d={`M${n(-r * 0.36)},${n(r * 0.7)} L${n(-r * 0.4)},${n(r * 1.5)} L${n(r * 0.4)},${n(r * 1.5)} L${n(r * 0.36)},${n(r * 0.7)} Z`}
        fill={shade(look.skin, 0.88)}
      />
      {[-1, 1].map((side) => (
        <Ellipse
          key={`ear${String(side)}`}
          cx={side * r * 0.98}
          cy={r * 0.15}
          rx={r * 0.14}
          ry={r * 0.24}
          fill={look.skin}
          stroke={edge}
          strokeWidth={r * 0.035}
        />
      ))}
      {look.earrings
        ? [-1, 1].map((side) => (
            <Circle
              key={`ring${String(side)}`}
              cx={side * r * 0.99}
              cy={r * 0.43}
              r={r * 0.06}
              fill="#E8C060"
            />
          ))
        : null}
      <Path d={head} fill={look.skin} stroke={edge} strokeWidth={r * 0.035} />
      <Path
        d={`M${n(r * 0.3)},${n(-r * 1.02)} C${n(r * 1.12)},${n(-r * 0.85)} ${n(r * 1.05)},${n(r * 0.6)} ${n(r * 0.05)},${n(r * 1.09)} C${n(r * 0.7)},${n(r * 0.55)} ${n(r * 0.78)},${n(-r * 0.5)} ${n(r * 0.3)},${n(-r * 1.02)} Z`}
        fill={shade(look.skin, 0.9)}
        opacity={0.55}
      />
      {look.beard ? (
        <Path
          d={`M${n(-r * 0.98)},${n(r * 0.15)} C${n(-r * 0.92)},${n(r * 0.85)} ${n(-r * 0.45)},${n(r * 1.12)} 0,${n(r * 1.12)} C${n(r * 0.45)},${n(r * 1.12)} ${n(r * 0.92)},${n(r * 0.85)} ${n(r * 0.98)},${n(r * 0.15)} C${n(r * 0.82)},${n(r * 0.52)} ${n(r * 0.5)},${n(r * 0.6)} ${n(r * 0.28)},${n(r * 0.58)} Q0,${n(r * 0.52)} ${n(-r * 0.28)},${n(r * 0.58)} C${n(-r * 0.5)},${n(r * 0.6)} ${n(-r * 0.82)},${n(r * 0.52)} ${n(-r * 0.98)},${n(r * 0.15)} Z`}
          fill={look.hair}
          opacity={0.9}
        />
      ) : null}
      <Eye x={-r * 0.38} r={r} look={look} mood={mood} />
      <Eye x={r * 0.38} r={r} look={look} mood={mood} />
      {[-1, 1].map((side) => {
        const inner = sad ? -r * 0.27 : -r * 0.18;
        const outer = sad ? -r * 0.15 : -r * 0.17;
        return (
          <Path
            key={`brow${String(side)}`}
            d={`M${n(side * r * 0.17)},${n(inner)} Q${n(side * r * 0.38)},${n(-r * 0.3)} ${n(side * r * 0.6)},${n(outer)} Q${n(side * r * 0.38)},${n(-r * 0.24)} ${n(side * r * 0.17)},${n(inner + r * 0.06)} Z`}
            fill={brow}
          />
        );
      })}
      <Path
        d={`M${n(r * 0.02)},${n(r * 0.14)} Q${n(r * 0.13)},${n(r * 0.4)} ${n(r * 0.08)},${n(r * 0.47)} Q${n(r * 0.01)},${n(r * 0.51)} ${n(-r * 0.08)},${n(r * 0.46)}`}
        stroke={edge}
        strokeWidth={r * 0.045}
        fill="none"
        strokeLinecap="round"
      />
      {happy ? (
        <G>
          <Path
            d={`M${n(-r * 0.26)},${n(r * 0.66)} Q0,${n(r * 0.9)} ${n(r * 0.26)},${n(r * 0.66)} Q0,${n(r * 0.74)} ${n(-r * 0.26)},${n(r * 0.66)} Z`}
            fill={lips}
          />
          <Path
            d={`M${n(-r * 0.2)},${n(r * 0.69)} Q0,${n(r * 0.76)} ${n(r * 0.2)},${n(r * 0.69)} Q0,${n(r * 0.81)} ${n(-r * 0.2)},${n(r * 0.69)} Z`}
            fill="#FFFFFF"
            opacity={0.85}
          />
        </G>
      ) : (
        <G>
          <Path
            d={`M${n(-r * 0.2)},${n(r * 0.73)} Q0,${n(r * 0.9)} ${n(r * 0.2)},${n(r * 0.73)} Z`}
            fill={lips}
          />
          <Path
            d={
              sad
                ? `M${n(-r * 0.22)},${n(r * 0.76)} Q0,${n(r * 0.66)} ${n(r * 0.22)},${n(r * 0.76)}`
                : `M${n(-r * 0.22)},${n(r * 0.72)} Q0,${n(r * 0.76)} ${n(r * 0.22)},${n(r * 0.72)}`
            }
            stroke={shade(lips, 0.7)}
            strokeWidth={r * 0.045}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      )}
      {look.glasses ? (
        <G>
          {[-1, 1].map((side) => (
            <Path
              key={`lens${String(side)}`}
              d={roundRect(side * r * 0.38 - r * 0.27, -r * 0.09, r * 0.54, r * 0.38, r * 0.12)}
              fill="#FFFFFF"
              fillOpacity={0.12}
              stroke="#2A2A33"
              strokeWidth={r * 0.045}
            />
          ))}
          <Path
            d={`M${n(-r * 0.11)},${n(r * 0.06)} Q0,${n(r * 0.01)} ${n(r * 0.11)},${n(r * 0.06)}`}
            stroke="#2A2A33"
            strokeWidth={r * 0.045}
            fill="none"
          />
        </G>
      ) : null}
      <FrontHair look={look} r={r} />
    </G>
  );
}

/** Shoulders and outfit, half-width w and height h, starting at the collar line y=0. */
function Torso({ look, w, h }: { look: Look; w: number; h: number }) {
  const edge = shade(look.shirt, 0.72);
  const sw = w * 0.035;
  const join = { strokeLinejoin: 'round' as const };
  return (
    <G>
      <Path
        d={`M${n(-w)},${n(h)} C${n(-w)},${n(h * 0.3)} ${n(-w * 0.86)},${n(h * 0.06)} ${n(-w * 0.42)},0 L${n(w * 0.42)},0 C${n(w * 0.86)},${n(h * 0.06)} ${n(w)},${n(h * 0.3)} ${n(w)},${n(h)} Z`}
        fill={look.shirt}
        stroke={edge}
        strokeWidth={sw}
        {...join}
      />
      <Path
        d={`M${n(w * 0.42)},0 C${n(w * 0.86)},${n(h * 0.06)} ${n(w)},${n(h * 0.3)} ${n(w)},${n(h)} L${n(w * 0.6)},${n(h)} C${n(w * 0.65)},${n(h * 0.4)} ${n(w * 0.55)},${n(h * 0.15)} ${n(w * 0.42)},0 Z`}
        fill={edge}
        opacity={0.25}
      />
      {look.outfit === 'hoodie' ? (
        <G>
          <Path
            d={`M${n(-w * 0.5)},${n(h * 0.01)} Q0,${n(h * 0.4)} ${n(w * 0.5)},${n(h * 0.01)}`}
            fill="none"
            stroke={edge}
            strokeWidth={sw * 1.4}
          />
          <Path
            d={`M${n(-w * 0.13)},${n(h * 0.2)} l0,${n(h * 0.3)} M${n(w * 0.13)},${n(h * 0.2)} l0,${n(h * 0.3)}`}
            stroke="#FFFFFF"
            strokeWidth={sw * 1.4}
            strokeLinecap="round"
          />
        </G>
      ) : null}
      {look.outfit === 'tee' ? (
        <Path
          d={`M${n(-w * 0.3)},${n(h * 0.01)} Q0,${n(h * 0.22)} ${n(w * 0.3)},${n(h * 0.01)}`}
          fill="none"
          stroke={edge}
          strokeWidth={sw * 1.2}
        />
      ) : null}
      {look.outfit === 'blazer' ? (
        <G>
          <Path
            d={`M${n(-w * 0.3)},0 L0,${n(h * 0.7)} L${n(w * 0.3)},0 Z`}
            fill="#F4F4F6"
            stroke={edge}
            strokeWidth={sw}
            {...join}
          />
          <Path
            d={`M${n(-w * 0.06)},${n(h * 0.08)} L${n(w * 0.06)},${n(h * 0.08)} L${n(w * 0.09)},${n(h * 0.55)} L0,${n(h * 0.66)} L${n(-w * 0.09)},${n(h * 0.55)} Z`}
            fill="#2A3350"
          />
        </G>
      ) : null}
      {look.outfit === 'collar' ? (
        <Path
          d={`M${n(-w * 0.32)},${n(-h * 0.02)} L${n(-w * 0.04)},${n(h * 0.2)} L${n(-w * 0.34)},${n(h * 0.22)} Z M${n(w * 0.32)},${n(-h * 0.02)} L${n(w * 0.04)},${n(h * 0.2)} L${n(w * 0.34)},${n(h * 0.22)} Z`}
          fill="#FFFFFF"
          stroke={edge}
          strokeWidth={sw}
          {...join}
        />
      ) : null}
    </G>
  );
}

/** A small seated figure for the office scene, feet at (0,0), hands resting on the desk. */
export function Figure({ look, mood = 1 }: { look: Look; mood?: number }) {
  return (
    <G>
      <Ellipse cx={0} cy={2} rx={15} ry={6} fill="#000000" opacity={0.13} />
      <G transform="translate(0,-30)">
        <Torso look={look} w={14} h={30} />
      </G>
      {[-1, 1].map((side) => (
        <Ellipse
          key={`hand${String(side)}`}
          cx={side * 10}
          cy={-7}
          rx={3.6}
          ry={3}
          fill={look.skin}
          stroke={shade(look.skin, 0.72)}
          strokeWidth={1}
        />
      ))}
      <G transform="translate(0,-45)">
        <Face look={look} r={10} mood={mood} />
      </G>
    </G>
  );
}

/** Head and shoulders for cards and avatars, drawn in a 100×100 box. */
export function Bust({ look, mood = 1 }: { look: Look; mood?: number }) {
  return (
    <G>
      <G transform="translate(50,74)">
        <Torso look={look} w={40} h={34} />
      </G>
      <G transform="translate(50,44)">
        <Face look={look} r={21} mood={mood} />
      </G>
    </G>
  );
}

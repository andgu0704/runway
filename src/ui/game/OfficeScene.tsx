import { memo, type ReactElement } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Polygon,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';
import type { ContentPack, GameState } from '../../engine';
import { useText } from '../i18n';
import { fonts } from '../theme/tokens';
import {
  ageFor,
  Figure,
  INK,
  lookFor,
  outfitFor,
  roundRect,
  shade,
  type Look,
  type Shirt,
} from './characterArt';
import { roleColor } from './visuals';

const VIEW_W = 360;
const VIEW_H = 250;
const QUIPS = 6;

export interface Person {
  id: string;
  look: Look;
  mood: number;
}

/** What the scene needs to know; built from a game, or by hand for the title screen. */
export interface SceneModel {
  stage: string;
  month: number;
  launched: boolean;
  people: Person[];
}

interface Room {
  size: number;
  floor: string;
  plank: string;
  slab: string;
  walls: [string, string];
  desks: [number, number][];
  garage: boolean;
}

const GARAGE: Room = {
  size: 5,
  floor: '#D9D3C9',
  plank: '#CBC4B8',
  slab: '#A8A196',
  walls: ['#EDE6DA', '#E2D9CB'],
  desks: [
    [0.9, 1.5],
    [2.9, 1.5],
    [0.9, 3.5],
    [2.9, 3.5],
  ],
  garage: true,
};

const STUDIO: Room = {
  size: 7,
  floor: '#EBCB9F',
  plank: '#DDB98C',
  slab: '#B98A5A',
  walls: ['#FFF3E1', '#FCE6C8'],
  desks: [
    [0.9, 1.6],
    [2.8, 1.6],
    [4.7, 1.6],
    [0.9, 3.5],
    [2.8, 3.5],
    [4.7, 3.5],
    [0.9, 5.4],
    [2.8, 5.4],
    [4.7, 5.4],
  ],
  garage: false,
};

/** Everyone in the company, founder first, each with a look and a mood from -1 to 1. */
export function sceneFromGame(game: GameState, content: ContentPack): SceneModel {
  return {
    stage: game.stage,
    month: game.month,
    launched: game.product.launched,
    people: people(game, content),
  };
}

function people(game: GameState, content: ContentPack): Person[] {
  const base = (game.stats.morale - 50) / 25;
  const list: Person[] = [
    { id: 'founder', look: lookFor(game.setup.founderName, 'founder', 'hoodie'), mood: base },
  ];
  if (game.cofounderPresent && game.setup.cofounder !== null) {
    const name = content.cofounders.get(game.setup.cofounder)?.name ?? game.setup.cofounder;
    list.push({ id: 'cofounder', look: lookFor(name, 'people', 'collar'), mood: base });
  }
  for (const e of game.team) {
    list.push({
      id: e.id,
      look: lookFor(e.name, roleColor(e.role) as Shirt, outfitFor(e.role), ageFor(e.role, e.name)),
      mood: base + e.mood / 25,
    });
  }
  return list;
}

/**
 * The company as a cosy little studio seen from above at an angle: a wooden floor with
 * low back walls, desks that fill with people as you hire, and furniture that tells the
 * story. The garage has a roll-up door, boxes and a beanbag; the Startup office adds
 * windows, a whiteboard, a sofa, a rug and a coffee machine; servers arrive at launch.
 */
export const OfficeScene = memo(function OfficeScene({
  model,
  width,
}: {
  model: SceneModel;
  width: number;
}) {
  const { t } = useText();
  const room = model.stage === 'garage' ? GARAGE : STUDIO;
  const N = room.size;
  const TW = Math.min(58, 330 / N);
  const TH = TW / 2;
  const WH = 72;
  const ox = VIEW_W / 2;
  const oy = WH + 12;
  const P = (x: number, y: number, z = 0): [number, number] => [
    ox + ((x - y) * TW) / 2,
    oy + ((x + y) * TH) / 2 - z,
  ];
  const pts = (a: [number, number][]) => a.map((p) => p.join(',')).join(' ');
  let key = 0;
  const box = (
    x: number,
    y: number,
    w: number,
    d: number,
    h: number,
    color: string,
    z = 0,
  ): ReactElement => (
    <G key={`b${String(key++)}`}>
      <Polygon
        points={pts([
          P(x, y + d, z + h),
          P(x + w, y + d, z + h),
          P(x + w, y + d, z),
          P(x, y + d, z),
        ])}
        fill={shade(color, 0.86)}
      />
      <Polygon
        points={pts([
          P(x + w, y, z + h),
          P(x + w, y + d, z + h),
          P(x + w, y + d, z),
          P(x + w, y, z),
        ])}
        fill={shade(color, 0.72)}
      />
      <Polygon
        points={pts([
          P(x, y, z + h),
          P(x + w, y, z + h),
          P(x + w, y + d, z + h),
          P(x, y + d, z + h),
        ])}
        fill={color}
      />
    </G>
  );
  const flat = (x: number, y: number, w: number, d: number, color: string, z = 0.5) => (
    <Polygon
      key={`f${String(key++)}`}
      points={pts([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)])}
      fill={color}
    />
  );
  /** A panel on the back-right wall (y = 0), from x a to b, z bottom to top. */
  const onBack = (a: number, b: number, z1: number, z2: number, fill: string, stroke?: string) => (
    <Polygon
      key={`w${String(key++)}`}
      points={pts([P(a, 0.12, z1), P(b, 0.12, z1), P(b, 0.12, z2), P(a, 0.12, z2)])}
      fill={fill}
      {...(stroke === undefined ? {} : { stroke, strokeWidth: 2.5 })}
    />
  );
  /** A panel on the back-left wall (x = 0). */
  const onLeft = (a: number, b: number, z1: number, z2: number, fill: string) => (
    <Polygon
      key={`l${String(key++)}`}
      points={pts([P(0.12, a, z1), P(0.12, b, z1), P(0.12, b, z2), P(0.12, a, z2)])}
      fill={fill}
    />
  );

  // The floor: a slab with visible thickness and planks (or concrete seams in the garage).
  const base: ReactElement[] = [
    <Polygon
      key="slabL"
      points={pts([P(0, N), P(N, N), P(N, N, -10), P(0, N, -10)])}
      fill={room.slab}
    />,
    <Polygon
      key="slabR"
      points={pts([P(N, 0), P(N, N), P(N, N, -10), P(N, 0, -10)])}
      fill={shade(room.slab, 0.85)}
    />,
    <Polygon key="floor" points={pts([P(0, 0), P(N, 0), P(N, N), P(0, N)])} fill={room.floor} />,
  ];
  const seams = room.garage ? N : N * 2;
  for (let i = 1; i < seams; i++) {
    const v = room.garage ? i : i / 2;
    base.push(
      <Polyline
        key={`plank${String(i)}`}
        points={pts([P(v, 0), P(v, N)])}
        stroke={room.plank}
        strokeWidth={1.5}
        fill="none"
      />,
    );
  }

  // Low back walls, then what hangs on them.
  const walls: ReactElement[] = [
    box(0, 0, N, 0.12, WH, room.walls[1]),
    box(0, 0, 0.12, N, WH, room.walls[0]),
  ];
  if (room.garage) {
    walls.push(onBack(N * 0.42, N * 0.92, 0, WH - 8, '#C9CED8'));
    for (let z = 8; z < WH - 8; z += 10)
      walls.push(onBack(N * 0.42, N * 0.92, z, z + 2.5, '#A9AFBC'));
    walls.push(onLeft(N * 0.2, N * 0.52, 30, 58, '#FFFFFF'));
    walls.push(
      <Polyline
        key="scribble"
        points={pts([
          P(0.13, N * 0.24, 38),
          P(0.13, N * 0.32, 48),
          P(0.13, N * 0.4, 42),
          P(0.13, N * 0.48, 52),
        ])}
        stroke="#3DA5FF"
        strokeWidth={2.5}
        fill="none"
      />,
    );
    for (let i = 0; i <= 8; i++) {
      const [lx, ly] = P(N * 0.04 + (i * N * 0.36) / 8, 0.13, WH - 6 - (i % 2) * 4);
      walls.push(<Circle key={`bulb${String(i)}`} cx={lx} cy={ly} r={2.6} fill="#FFE27A" />);
    }
  } else {
    walls.push(onBack(N * 0.08, N * 0.36, 26, 62, '#BDE8FF', '#FFFFFF'));
    walls.push(onBack(N * 0.46, N * 0.78, 22, 62, '#FFFFFF', '#9AA3B5'));
    walls.push(
      <Polyline
        key="chart"
        points={pts([
          P(N * 0.5, 0.13, 30),
          P(N * 0.57, 0.13, 40),
          P(N * 0.64, 0.13, 36),
          P(N * 0.74, 0.13, 56),
        ])}
        stroke="#2FBF71"
        strokeWidth={3}
        fill="none"
        strokeLinejoin="round"
      />,
    );
    walls.push(onLeft(N * 0.12, N * 0.3, 28, 62, '#7B61FF'));
  }

  // Furniture and people, sorted back to front.
  const objects: { depth: number; node: ReactElement }[] = [];
  const crew = model.people;
  const seats = room.desks.slice(0, Math.max(1, Math.min(room.desks.length, crew.length)));
  if (!room.garage) {
    objects.push({ depth: -1, node: flat(2.2, 3.0, 2.6, 2.4, '#9DB8E6') });
    objects.push({ depth: -0.9, node: flat(2.4, 3.2, 2.2, 2.0, '#B3C9EE', 0.8) });
  }
  seats.forEach(([x, y], i) => {
    const person = crew[i];
    // The chair behind the person, the person, then the desk in front of them.
    objects.push({
      depth: x + y + 0.1,
      node: (
        <G key={`chair${String(i)}`}>
          {box(x + 0.45, y - 0.75, 0.5, 0.12, 40, '#3A4466')}
          {box(x + 0.45, y - 0.75, 0.5, 0.5, 16, '#4A5578')}
        </G>
      ),
    });
    if (person !== undefined) {
      const [sx, sy] = P(x + 0.7, y - 0.3);
      objects.push({
        depth: x + y + 0.2,
        node: (
          <G key={`p${person.id}`} transform={`translate(${String(sx)},${String(sy)})`}>
            <Figure look={person.look} mood={person.mood} />
          </G>
        ),
      });
    }
    const [dx, dy] = P(x + 0.7, y + 0.28, 33);
    objects.push({
      depth: x + y + 0.9,
      node: (
        <G key={`desk${String(i)}`}>
          {box(x + 0.08, y + 0.08, 0.08, 0.08, 22, '#8C8578')}
          {box(x + 1.24, y + 0.62, 0.08, 0.08, 22, '#8C8578')}
          {box(x, y, 1.4, 0.78, 3, room.garage ? '#C98B54' : '#F2EBDF', 22)}
          {box(x + 0.45, y + 0.3, 0.5, 0.32, 1.5, '#9AA3B5', 25)}
          <Polygon
            points={pts([
              P(x + 0.45, y + 0.3, 26),
              P(x + 0.95, y + 0.3, 26),
              P(x + 0.95, y + 0.26, 40),
              P(x + 0.45, y + 0.26, 40),
            ])}
            fill="#C9CED8"
          />
          <Circle cx={dx} cy={dy} r={1.8} fill="#FFFFFF" />
          {i % 2 === 0
            ? box(
                x + 1.08,
                y + 0.18,
                0.14,
                0.14,
                7,
                ['#FF6B6B', '#3DA5FF', '#FFC43D'][i % 3] ?? '#FF6B6B',
                25,
              )
            : null}
        </G>
      ),
    });
  });

  // Props: furniture that tells the story.
  const plant = (x: number, y: number, k: string) => {
    const [cx, cy] = P(x + 0.25, y + 0.25, 34);
    return (
      <G key={k}>
        {box(x, y, 0.5, 0.5, 18, '#E9805A')}
        <Circle cx={cx} cy={cy} r={TW * 0.36} fill="#46B96B" />
        <Circle cx={cx - TW * 0.16} cy={cy - TW * 0.2} r={TW * 0.22} fill="#5ACB7D" />
      </G>
    );
  };
  objects.push({ depth: N + 0.2, node: plant(N - 0.7, 0.35, 'plant1') });
  if (room.garage) {
    objects.push({
      depth: 1.6,
      node: (
        <G key="boxes">
          {box(0.25, 0.3, 0.6, 0.6, 18, '#C9A26B')}
          {box(0.3, 0.35, 0.5, 0.5, 14, '#D8B47D', 18)}
        </G>
      ),
    });
    const [bx, by] = P(N - 0.8, N - 0.9, 0);
    objects.push({
      depth: 2 * N - 1.5,
      node: (
        <G key="beanbag">
          <Ellipse cx={bx} cy={by - 4} rx={TW * 0.5} ry={TW * 0.28} fill="#D9474F" />
          <Ellipse cx={bx} cy={by - 10} rx={TW * 0.44} ry={TW * 0.3} fill="#FF6B6B" />
          <Ellipse cx={bx - TW * 0.08} cy={by - 16} rx={TW * 0.22} ry={TW * 0.12} fill="#FF9A9F" />
        </G>
      ),
    });
  } else {
    objects.push({
      depth: 2.6,
      node: (
        <G key="shelf">
          {box(0.2, 0.25, 0.45, 1.6, 44, '#B97A45')}
          {box(0.24, 0.35, 0.38, 0.35, 12, '#FF6B6B', 44)}
          {box(0.24, 0.8, 0.38, 0.45, 9, '#3DA5FF', 44)}
          {box(0.24, 1.35, 0.38, 0.3, 15, '#FFC43D', 44)}
        </G>
      ),
    });
    objects.push({ depth: N - 0.2, node: plant(0.25, N - 0.75, 'plant2') });
    objects.push({
      depth: N + 2.6,
      node: (
        <G key="sofa">
          {box(N - 0.85, 2.6, 0.7, 1.8, 16, '#7B61FF')}
          {box(N - 0.3, 2.6, 0.18, 1.8, 30, '#6A4DF4')}
        </G>
      ),
    });
    const [lx, ly] = P(0.45, N - 1.7, 64);
    objects.push({
      depth: N - 1.1,
      node: (
        <G key="lamp">
          {box(0.4, N - 1.75, 0.1, 0.1, 60, '#2B2F3A')}
          <Circle cx={lx} cy={ly} r={9} fill="#FFE27A" />
        </G>
      ),
    });
    objects.push({
      depth: 4.9,
      node: (
        <G key="coffee">
          {box(3.9, 0.3, 0.8, 0.5, 26, '#E2D6C4')}
          {box(4.05, 0.35, 0.35, 0.3, 14, '#2B2F3A', 26)}
        </G>
      ),
    });
  }
  if (model.launched) {
    // Servers live in the back corner, next to the shelf or the boxes.
    const rx = room.garage ? 1.0 : 0.75;
    objects.push({
      depth: rx + 0.3 + 0.9,
      node: (
        <G key="rack">
          {box(rx, 0.25, 0.6, 0.5, 52, '#3D4A6B')}
          {[14, 26, 38].map((z) =>
            box(rx + 0.03, 0.75, 0.54, 0.02, 3, z === 14 ? '#FFD27A' : '#6BFF9E', z),
          )}
        </G>
      ),
    });
  }
  objects.sort((a, b) => a.depth - b.depth);

  // Who says something this month: picked from the month so it changes as time passes.
  const bubbles: ReactElement[] = [];
  const talkers = new Set<number>();
  if (crew.length > 0) talkers.add(model.month % seats.length);
  if (crew.length > 2) talkers.add((model.month * 7 + 3) % seats.length);
  for (const i of talkers) {
    const person = crew[i];
    const seat = seats[i];
    if (person === undefined || seat === undefined) continue;
    const [sx, sy] = P(seat[0] + 0.7, seat[1] - 0.3);
    const bucket = person.mood > 0.4 ? 'good' : person.mood < -0.4 ? 'bad' : 'ok';
    const line = t(`ui.office.${bucket}.${String((model.month + i) % QUIPS)}`);
    const w = line.length * 6.6 + 18;
    const bx = Math.max(4, Math.min(VIEW_W - w - 4, sx - w / 2));
    const by = Math.max(4, sy - 92);
    bubbles.push(
      <G key={`say${person.id}`}>
        <Path d={roundRect(bx, by, w, 24, 12)} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
        <Polygon
          points={`${String(sx - 5)},${String(by + 22)} ${String(sx)},${String(by + 30)} ${String(sx + 5)},${String(by + 22)}`}
          fill="#FFFFFF"
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path d={roundRect(sx - 6, by + 19, 12, 4, 0)} fill="#FFFFFF" />
        <SvgText
          transform={`translate(${String(bx + w / 2)},${String(by + 16.5)})`}
          textAnchor="middle"
          fontFamily={fonts.bodyBold}
          fontSize={12}
          fill={INK}
        >
          {line}
        </SvgText>
      </G>,
    );
  }

  const extra = crew.length - seats.length;
  const label = t('ui.office.a11y', { count: crew.length, stage: model.stage });
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg
        width={width}
        height={(width * VIEW_H) / VIEW_W}
        viewBox={`0 0 ${String(VIEW_W)} ${String(VIEW_H)}`}
      >
        {base}
        {walls}
        {objects.map((o) => o.node)}
        {bubbles}
        {extra > 0 ? (
          <G>
            <Path
              d={roundRect(VIEW_W - 64, VIEW_H - 36, 54, 28, 14)}
              fill="#FFC43D"
              stroke={INK}
              strokeWidth={2.5}
            />
            <SvgText
              transform={`translate(${String(VIEW_W - 37)},${String(VIEW_H - 17)})`}
              textAnchor="middle"
              fontFamily={fonts.display}
              fontSize={14}
              fill={INK}
            >
              {`+${String(extra)}`}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
});

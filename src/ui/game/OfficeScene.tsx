import { memo, type ReactElement } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Polygon,
  Path,
  Polyline,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { ContentPack, GameState } from '../../engine';
import { useText } from '../i18n';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import {
  ageFor,
  Figure,
  INK,
  lookFor,
  outfitFor,
  roundRect,
  type Look,
  type Shirt,
} from './characterArt';
import { roleColor } from './visuals';

const VIEW_W = 360;
const VIEW_H = 290;
const QUIPS = 6;

interface Room {
  size: number;
  floor: [string, string];
  walls: [string, string];
  slots: [number, number][];
  garage: boolean;
}

const ROOMS: Record<string, Room> = {
  garage: {
    size: 5,
    floor: ['#E3D3B8', '#D8C6A6'],
    walls: ['#FFEBD0', '#FFDDB0'],
    slots: [
      [0.7, 1.0],
      [2.7, 1.0],
      [0.7, 3.0],
      [2.7, 3.0],
    ],
    garage: true,
  },
  startup: {
    size: 7,
    floor: ['#F6D7A8', '#EFC891'],
    walls: ['#FFF2DE', '#FFE6C2'],
    slots: [
      [0.7, 0.9],
      [2.6, 0.9],
      [4.5, 0.9],
      [0.7, 2.7],
      [2.6, 2.7],
      [4.5, 2.7],
      [0.7, 4.5],
      [2.6, 4.5],
      [4.5, 4.5],
    ],
    garage: false,
  },
};

const STARTUP_ROOM: Room = ROOMS.startup ?? {
  size: 7,
  floor: ['#F6D7A8', '#EFC891'],
  walls: ['#FFF2DE', '#FFE6C2'],
  slots: [],
  garage: false,
};

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

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(v * f))),
  );
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

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
 * The company as a little isometric room: desks fill with people as you hire, the
 * garage becomes an office at Startup, servers hum once the product is live, and a
 * couple of people say what the team is feeling.
 */
export const OfficeScene = memo(function OfficeScene({
  model,
  width,
  fadeTop = false,
}: {
  model: SceneModel;
  width: number;
  /** Fade the sky in from the page colour, for when nothing sits above the scene. */
  fadeTop?: boolean;
}) {
  const { t } = useText();
  const { colors } = useTheme();
  const room = ROOMS[model.stage] ?? STARTUP_ROOM;
  const N = room.size;
  const TW = Math.min(64, 340 / N);
  const TH = TW / 2;
  const WH = 112;
  const ox = VIEW_W / 2;
  const oy = WH + 14;
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
        fill={shade(color, 0.82)}
      />
      <Polygon
        points={pts([
          P(x + w, y, z + h),
          P(x + w, y + d, z + h),
          P(x + w, y + d, z),
          P(x + w, y, z),
        ])}
        fill={shade(color, 0.68)}
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

  const floor: ReactElement[] = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++)
      floor.push(
        <Polygon
          key={`f${String(i)}-${String(j)}`}
          points={pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])}
          fill={(i + j) % 2 === 0 ? room.floor[0] : room.floor[1]}
        />,
      );

  const wallBits: ReactElement[] = [
    <Polygon
      key="wl"
      points={pts([P(0, 0), P(0, N), P(0, N, WH), P(0, 0, WH)])}
      fill={room.walls[0]}
    />,
    <Polygon
      key="wr"
      points={pts([P(0, 0), P(N, 0), P(N, 0, WH), P(0, 0, WH)])}
      fill={room.walls[1]}
    />,
    <Polyline
      key="edge"
      points={pts([P(0, N, WH), P(0, 0, WH), P(N, 0, WH)])}
      fill="none"
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />,
  ];
  if (room.garage) {
    const a = N * 0.3;
    const b = N * 0.8;
    wallBits.push(
      <Polygon
        key="door"
        points={pts([P(a, 0, 0), P(b, 0, 0), P(b, 0, 86), P(a, 0, 86)])}
        fill="#C9CED8"
      />,
    );
    for (let z = 10; z < 86; z += 12)
      wallBits.push(
        <Polygon
          key={`slat${String(z)}`}
          points={pts([P(a, 0, z), P(b, 0, z), P(b, 0, z + 3), P(a, 0, z + 3)])}
          fill="#A9AFBC"
        />,
      );
  } else {
    for (const [a, b] of [
      [N * 0.18, N * 0.42],
      [N * 0.56, N * 0.8],
    ] as const)
      wallBits.push(
        <Polygon
          key={`win${String(a)}`}
          points={pts([P(a, 0, 38), P(b, 0, 38), P(b, 0, 96), P(a, 0, 96)])}
          fill="#BDE8FF"
          stroke="#FFFFFF"
          strokeWidth={4}
        />,
      );
  }
  // A poster with a rising line on the left wall.
  wallBits.push(
    <Polygon
      key="poster"
      points={pts([P(0, N * 0.25, 44), P(0, N * 0.5, 44), P(0, N * 0.5, 92), P(0, N * 0.25, 92)])}
      fill="#7B61FF"
    />,
    <Polyline
      key="line"
      points={pts([
        P(0, N * 0.29, 54),
        P(0, N * 0.35, 62),
        P(0, N * 0.41, 58),
        P(0, N * 0.47, 80),
        P(0, N * 0.47, 80),
      ])}
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={3}
      strokeLinejoin="round"
    />,
  );

  const crew = model.people;
  const seats = room.slots.slice(0, Math.max(1, Math.min(room.slots.length, crew.length)));
  const objects: { depth: number; node: ReactElement }[] = [];
  seats.forEach(([x, y], i) => {
    const screen = ['#7FE3FF', '#B6FFA8', '#FFD27A', '#FFB4CF'][i % 4] ?? '#7FE3FF';
    objects.push({
      depth: x + y + 1,
      node: (
        <G key={`desk${String(i)}`}>
          {box(x, y, 1.4, 0.8, 4, '#C98B54', 24)}
          {box(x + 0.1, y + 0.1, 0.12, 0.12, 24, '#7A5230')}
          {box(x + 1.18, y + 0.58, 0.12, 0.12, 24, '#7A5230')}
          {box(x + 0.45, y + 0.12, 0.5, 0.08, 20, '#2B2F3A', 28)}
          <Polygon
            points={pts([
              P(x + 0.5, y + 0.12, 31),
              P(x + 0.9, y + 0.12, 31),
              P(x + 0.9, y + 0.12, 46),
              P(x + 0.5, y + 0.12, 46),
            ])}
            fill={screen}
          />
        </G>
      ),
    });
  });

  // Who says something this month: picked from the month so it changes as time passes.
  const talkers = new Set<number>();
  if (crew.length > 0) talkers.add(model.month % Math.min(crew.length, seats.length));
  if (crew.length > 2) talkers.add((model.month * 7 + 3) % Math.min(crew.length, seats.length));

  const bubbles: ReactElement[] = [];
  seats.forEach(([x, y], i) => {
    const person = crew[i];
    if (person === undefined) return;
    const [sx, sy] = P(x + 0.75, y + 1.2);
    objects.push({
      depth: x + y + 1.3,
      node: (
        <G key={`p${person.id}`} transform={`translate(${String(sx)},${String(sy)})`}>
          <Figure look={person.look} mood={person.mood} />
        </G>
      ),
    });
    if (talkers.has(i)) {
      const bucket = person.mood > 0.4 ? 'good' : person.mood < -0.4 ? 'bad' : 'ok';
      const line = t(`ui.office.${bucket}.${String((model.month + i) % QUIPS)}`);
      const w = line.length * 6.6 + 18;
      const bx = Math.max(4, Math.min(VIEW_W - w - 4, sx - w / 2));
      const by = sy - 84;
      bubbles.push(
        <G key={`say${person.id}`}>
          <Path d={roundRect(bx, by, w, 24, 12)} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
          <Polygon
            points={`${String(sx - 6)},${String(by + 22)} ${String(sx)},${String(by + 31)} ${String(sx + 6)},${String(by + 22)}`}
            fill="#FFFFFF"
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Path d={roundRect(sx - 7, by + 19, 14, 4.5, 0)} fill="#FFFFFF" />
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
  });

  // Furniture that tells the story: a plant, servers after launch, coffee at Startup.
  objects.push({
    depth: N - 0.4 + 0.6,
    node: (
      <G key="plant">
        {box(N - 0.7, 0.3, 0.45, 0.45, 18, '#E9805A')}
        {box(N - 0.66, 0.34, 0.37, 0.37, 26, '#46B96B', 18)}
      </G>
    ),
  });
  if (model.launched) {
    objects.push({
      depth: N - 0.5 + N - 1.6,
      node: (
        <G key="rack">
          {box(N - 0.9, N - 1.6, 0.7, 0.6, 58, '#3D4A6B')}
          {box(N - 0.86, N - 1.6, 0.62, 0.02, 3, '#6BFF9E', 44)}
          {box(N - 0.86, N - 1.6, 0.62, 0.02, 3, '#6BFF9E', 30)}
          {box(N - 0.86, N - 1.6, 0.62, 0.02, 3, '#FFD27A', 16)}
        </G>
      ),
    });
  }
  if (!room.garage) {
    objects.push({
      depth: 0.3 + N - 1,
      node: (
        <G key="coffee">
          {box(0.15, N - 1.1, 0.7, 0.5, 30, '#8A94A8')}
          {box(0.3, N - 1.0, 0.35, 0.3, 14, '#2B2F3A', 30)}
        </G>
      ),
    });
  }
  objects.sort((a, b) => a.depth - b.depth);

  const extra = crew.length - seats.length;
  const label = t('ui.office.a11y', { count: crew.length, stage: model.stage });
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg
        width={width}
        height={(width * VIEW_H) / VIEW_W}
        viewBox={`0 0 ${String(VIEW_W)} ${String(VIEW_H)}`}
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fadeTop ? colors.canvas : colors.sky} />
            <Stop offset={fadeTop ? '0.35' : '0.01'} stopColor={colors.sky} />
            <Stop offset="1" stopColor={colors.canvas} />
          </LinearGradient>
        </Defs>
        <Path d={roundRect(0, 0, VIEW_W, VIEW_H, 0)} fill="url(#sky)" />
        {wallBits}
        {floor}
        <Polyline
          points={pts([P(0, N), P(N, N), P(N, 0)])}
          fill="none"
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {objects.map((o) => o.node)}
        {bubbles}
        {extra > 0 ? (
          <G>
            <Path
              d={roundRect(VIEW_W - 64, VIEW_H - 40, 54, 28, 14)}
              fill="#FFC43D"
              stroke={INK}
              strokeWidth={2.5}
            />
            <SvgText
              transform={`translate(${String(VIEW_W - 37)},${String(VIEW_H - 21)})`}
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

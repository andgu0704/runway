/**
 * sfc32: a small, fast, well-tested 128-bit-state PRNG.
 * State lives inside GameState so saves resume the exact sequence.
 */
export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

export function seedRng(seed: number): RngState {
  const state: RngState = { a: 0x9e3779b9, b: 0x243f6a88, c: 0xb7e15162, d: seed >>> 0 };
  for (let i = 0; i < 15; i++) nextUint32(state);
  return state;
}

export function nextUint32(s: RngState): number {
  const t = (((s.a + s.b) | 0) + s.d) | 0;
  s.d = (s.d + 1) | 0;
  s.a = s.b ^ (s.b >>> 9);
  s.b = (s.c + (s.c << 3)) | 0;
  s.c = (s.c << 21) | (s.c >>> 11);
  s.c = (s.c + t) | 0;
  return t >>> 0;
}

/** Uniform float in [0, 1). */
export function nextFloat(s: RngState): number {
  return nextUint32(s) / 4294967296;
}

/** Uniform integer in [min, max], inclusive. */
export function randInt(s: RngState, min: number, max: number): number {
  return min + Math.floor(nextFloat(s) * (max - min + 1));
}

export function randRange(s: RngState, min: number, max: number): number {
  return min + nextFloat(s) * (max - min);
}

export function chance(s: RngState, p: number): boolean {
  return nextFloat(s) < p;
}

export function pick<T>(s: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() called with an empty list');
  return items[randInt(s, 0, items.length - 1)] as T;
}

export function pickWeighted<T>(
  s: RngState,
  items: readonly T[],
  weight: (item: T) => number,
): T | null {
  let total = 0;
  for (const item of items) total += Math.max(0, weight(item));
  if (total <= 0) return null;
  let roll = nextFloat(s) * total;
  for (const item of items) {
    roll -= Math.max(0, weight(item));
    if (roll < 0) return item;
  }
  return items[items.length - 1] ?? null;
}

/** Approximately normal via the sum of three uniforms; bounded and cheap. */
export function randNormal(s: RngState, mean: number, spread: number): number {
  const u = nextFloat(s) + nextFloat(s) + nextFloat(s) - 1.5;
  return mean + u * spread;
}

/** Deterministic Fisher–Yates; returns a new array. */
export function shuffle<T>(s: RngState, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(s, 0, i);
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

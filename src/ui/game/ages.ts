/** Startups are mostly students; older people arrive with the senior jobs. */
export type Age = 'young' | 'adult' | 'senior';

/** A small stable string hash (FNV-1a), used to seed how people look. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * How old someone looks. Founders and everyday hires are students and new grads;
 * roles that only open at Startup bring in older people: executives are adults or
 * seniors, people partners are adults. Seeded by name, so it never changes.
 */
export function ageFor(role: string, seed: string): Age {
  if (role.startsWith('vp')) return hash(`${seed}@`) % 5 < 2 ? 'senior' : 'adult';
  if (role === 'peopleOps') return 'adult';
  return 'young';
}

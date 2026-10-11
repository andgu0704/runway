/** Distance between neighbouring desks, in floor tiles. */
export const DESK_PITCH = 1.9;

/** Desks on one office floor (a 3×3 grid). More people means more floors, not a fuller room. */
export const PER_FLOOR = 9;

/** The garage seats four in a 2×2, or a squeezed 3×3 once a fifth person joins. */
export function gridFor(stage: string, people: number): number {
  if (stage === 'garage') return people <= 4 ? 2 : 3;
  return 3;
}

/** How many floors the company fills: the garage is one room; offices add a floor per nine. */
export function floorCount(stage: string, people: number): number {
  if (stage === 'garage') return 1;
  return Math.max(1, Math.ceil(people / PER_FLOOR));
}

/** The slice of the team that sits on a floor: founders first, then in hiring order. */
export function onFloor<T>(stage: string, people: T[], floor: number): T[] {
  if (stage === 'garage') return people;
  return people.slice(floor * PER_FLOOR, (floor + 1) * PER_FLOOR);
}

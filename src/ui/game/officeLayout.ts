/** Distance between neighbouring desks, in floor tiles. */
export const DESK_PITCH = 1.9;
const MAX_GRID = 6;

/**
 * The office grows with the team: desks sit in a k×k grid, k being the smallest that
 * seats everyone (2×2 up to 6×6, which holds a full Startup). Spare desks stay empty.
 */
export function deskGrid(people: number): number {
  return Math.min(MAX_GRID, Math.max(2, Math.ceil(Math.sqrt(people))));
}

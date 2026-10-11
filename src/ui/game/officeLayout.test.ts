import { describe, expect, it } from 'vitest';
import { floorCount, gridFor, onFloor, PER_FLOOR } from './officeLayout';

describe('office layout', () => {
  it('keeps the garage to one room that squeezes in a fifth person', () => {
    expect(floorCount('garage', 5)).toBe(1);
    expect(gridFor('garage', 4)).toBe(2);
    expect(gridFor('garage', 5)).toBe(3);
  });

  it('adds a floor for every nine people at Startup, never a fuller room', () => {
    expect(floorCount('startup', 1)).toBe(1);
    expect(floorCount('startup', 9)).toBe(1);
    expect(floorCount('startup', 10)).toBe(2);
    expect(floorCount('startup', 32)).toBe(4);
    expect(gridFor('startup', 32) ** 2).toBe(PER_FLOOR);
  });

  it('seats everyone exactly once across the floors', () => {
    const team = Array.from({ length: 23 }, (_, i) => i);
    const seated = Array.from({ length: floorCount('startup', team.length) }, (_, f) =>
      onFloor('startup', team, f),
    ).flat();
    expect(seated).toEqual(team);
  });
});

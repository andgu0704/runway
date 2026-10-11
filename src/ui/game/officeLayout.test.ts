import { describe, expect, it } from 'vitest';
import { deskGrid } from './officeLayout';

describe('office layout', () => {
  it('starts as a 2×2 garage and grows a size whenever the team outgrows it', () => {
    expect(deskGrid(1)).toBe(2);
    expect(deskGrid(4)).toBe(2);
    expect(deskGrid(5)).toBe(3);
    expect(deskGrid(10)).toBe(4);
    expect(deskGrid(25)).toBe(5);
  });

  it('seats a full Startup of 30 people plus founders', () => {
    expect(deskGrid(32) ** 2).toBeGreaterThanOrEqual(32);
  });

  it('stops growing at 6×6', () => {
    expect(deskGrid(80)).toBe(6);
  });
});

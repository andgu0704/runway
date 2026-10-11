import { describe, expect, it } from 'vitest';
import { content } from '../../test/helpers';
import { ageFor } from './ages';

const NAMES = Array.from({ length: 40 }, (_, i) => `Person ${String(i)}`);

describe('character ages', () => {
  it('keeps everyone hired in the Garage young', () => {
    for (const role of content.data.roles.filter((r) => r.minStage === 'garage'))
      for (const name of NAMES) expect(ageFor(role.id, name), role.id).toBe('young');
  });

  it('brings older people in with the Startup-only roles', () => {
    for (const role of content.data.roles.filter((r) => r.minStage !== 'garage'))
      for (const name of NAMES) expect(ageFor(role.id, name), role.id).not.toBe('young');
    const vps = NAMES.map((name) => ageFor('vpEngineering', name));
    expect(vps).toContain('adult');
    expect(vps).toContain('senior');
  });

  it('gives the same person the same age every time', () => {
    for (const name of NAMES) expect(ageFor('vpSales', name)).toBe(ageFor('vpSales', name));
  });
});

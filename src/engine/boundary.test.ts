import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
  });
}

describe('engine boundary', () => {
  const files = sources(join(import.meta.dirname));

  it('imports nothing from React, Expo or the app layers', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const imports = [...text.matchAll(/from '([^']+)'/g)].map((m) => m[1] ?? '');
      for (const spec of imports) {
        expect(spec, file).not.toMatch(/^(react|react-native|expo|@expo)/);
        expect(spec, file).not.toMatch(/\/(ui|store|platform|app|i18n|sim)\//);
      }
    }
  });

  it('never reads the clock or uses unseeded randomness', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(/Math\.random|Date\.now|new Date/);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { en } from '../locales/en';
import { contentData } from '.';
import { hasMessage, requiredMessageKeys } from './localeKeys';
import { validateContent } from './validate';

describe('content', () => {
  it('passes schema and cross-reference validation', () => {
    const report = validateContent(contentData);
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('reports broken references with a readable message', () => {
    const broken = {
      ...contentData,
      actions: [{ ...contentData.actions[0]!, minStage: 'moon' }, ...contentData.actions.slice(1)],
    };
    const report = validateContent(broken);
    expect(report.ok).toBe(false);
    expect(report.errors[0]).toContain('unknown stage "moon"');
  });

  it('rejects malformed records', () => {
    const report = validateContent({
      ...contentData,
      rules: { ...contentData.rules, startCash: -1 },
    });
    expect(report.ok).toBe(false);
  });

  it('has a translation for every message key', () => {
    const missing = requiredMessageKeys(contentData).filter((key) => !hasMessage(en, key));
    expect(missing).toEqual([]);
  });

  it('gives every event three or four options', () => {
    for (const event of contentData.events) {
      expect(event.options.length, event.id).toBeGreaterThanOrEqual(3);
      expect(event.options.length, event.id).toBeLessThanOrEqual(4);
    }
  });

  it('has options that depend on earlier choices', () => {
    const gated = contentData.events.flatMap((e) =>
      e.options.filter((o) => o.requires !== undefined),
    );
    expect(gated.length).toBeGreaterThanOrEqual(15);
  });

  it('uses only fictional names in the name pool', () => {
    const names = new Set(contentData.names.first);
    expect(names.size).toBe(contentData.names.first.length);
  });
});

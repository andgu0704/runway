import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contentData } from '../content';
import { METER_IDS, CHARACTER_IDS } from '../content/schema/ids';
import { hasMessage } from '../content/localeKeys';
import { conditionSites, walkConditions } from '../content/walk';
import { en } from './en';

const ROOT = join(import.meta.dirname, '..', '..');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(path) && !path.endsWith('.test.ts') ? [path] : [];
  });
}

const exists = (key: string) => hasMessage(en, key) || hasMessage(en, `${key}_other`);

describe('interface strings', () => {
  it('has every ui key the screens use', () => {
    const sources = [...files(join(ROOT, 'app')), ...files(join(ROOT, 'src', 'ui'))];
    const keys = new Set<string>();
    for (const file of sources) {
      for (const m of readFileSync(file, 'utf8').matchAll(/'(ui\.[a-zA-Z0-9_.]+[a-zA-Z0-9_])'/g))
        keys.add(m[1] ?? '');
    }
    expect(keys.size).toBeGreaterThan(150);
    expect([...keys].filter((k) => !exists(k))).toEqual([]);
  });

  it('has no interface strings that nothing uses', () => {
    const sources = [...files(join(ROOT, 'app')), ...files(join(ROOT, 'src', 'ui'))]
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    const dynamic = [
      'ui.ruleError.',
      'ui.unavailable.',
      'ui.stat.',
      'ui.tab.',
      'ui.ownership.',
      'ui.people.mood.',
      'ui.stance.',
      'ui.world.rivalMood.',
      'ui.world.rivalLevel.',
      'ui.negotiation.reaction',
      'ui.timeline.empty.',
      'ui.effect.',
      'ui.runway.',
      'ui.new.suggestions',
    ];
    const keys: string[] = [];
    const walk = (node: unknown, path: string[]) => {
      if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
        for (const [k, v] of Object.entries(node)) walk(v, [...path, k]);
      } else {
        keys.push(path.join('.').replace(/_(one|other)$/, ''));
      }
    };
    walk({ ui: en.ui }, []);
    const unused = [...new Set(keys)].filter(
      (k) => !sources.includes(`'${k}'`) && !dynamic.some((p) => k.startsWith(p)),
    );
    expect(unused).toEqual([]);
  });

  it('has every dynamically built key', () => {
    const errors = [
      'ended',
      'eventPending',
      'negotiating',
      'actionPoints',
      'cash',
      'cooldown',
      'once',
      'conditions',
      'noOptions',
      'unknownAction',
      'invalidParams',
      'noEventPending',
      'unknownOption',
      'optionLocked',
      'noNegotiation',
      'invalidTerms',
    ];
    const keys = [
      ...errors.map((e) => `ui.ruleError.${e}`),
      ...errors.slice(0, 9).map((e) => `ui.unavailable.${e}`),
      ...['cash', 'users', 'quality', 'morale', 'reputation'].flatMap((s) =>
        ['name', 'explainer', 'drivers'].map((p) => `ui.stat.${s}.${p}`),
      ),
      ...['feed', 'product', 'people', 'money', 'world', 'company'].map((tab) => `ui.tab.${tab}`),
      ...['founder', 'cofounder', 'investors', 'team', 'pool'].map((g) => `ui.ownership.${g}`),
      ...['happy', 'fine', 'restless', 'unhappy'].map((m) => `ui.people.mood.${m}`),
      ...CHARACTER_IDS.flatMap((c) =>
        ['cold', 'wary', 'warm', 'close'].map((s) => `ui.stance.${c}.${s}`),
      ),
      ...['calm', 'watching', 'circling', 'attacking'].map((m) => `ui.world.rivalMood.${m}`),
      ...['insulted', 'cool', 'interested', 'keen', 'eager'].flatMap((r) => [
        `ui.negotiation.reaction.${r}`,
        `ui.negotiation.reactionName.${r}`,
      ]),
      ...['all', 'decision', 'consequence'].map((f) => `ui.timeline.empty.${f}`),
      ...CHARACTER_IDS.map((c) => `requirement.who.${c}`),
      ...METER_IDS.map((m) => `metric.${m}`),
    ];
    expect(keys.filter((k) => !exists(k))).toEqual([]);
  });

  it('can explain every requirement content uses', () => {
    const missing: string[] = [];
    for (const site of conditionSites(contentData)) {
      walkConditions(site.condition, (c) => {
        if ('flag' in c && !exists(`requirement.flag.${c.flag}`))
          missing.push(`requirement.flag.${c.flag} (${site.where})`);
        if ('metric' in c && !exists(`metric.${c.metric}`)) missing.push(`metric.${c.metric}`);
      });
    }
    expect(missing).toEqual([]);
  });
});

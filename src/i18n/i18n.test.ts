import { describe, expect, it } from 'vitest';
import { contentData } from '../content';
import { requiredMessageKeys } from '../content/localeKeys';
import { en } from '../locales/en';
import { formatBps, formatDelta, formatMoney } from './format';
import { createI18n, renderMessage } from '.';

/** Every parameter name a message may use. Typos in placeholders fail here. */
const KNOWN_PARAMS = new Set([
  'company',
  'founder',
  'rival',
  'month',
  'name',
  'role',
  'feature',
  'trait',
  'investor',
  'stage',
  'model',
  'market',
  'background',
  'policy',
  'amount',
  'preMoney',
  'bps',
  'users',
  'usersDelta',
  'mrr',
  'burn',
  'cash',
  'runway',
  'count',
  'kept',
  'event',
  'option',
  'netWorth',
  'who',
  'months',
  'team',
  'roles',
  'done',
  'raised',
  'year',
  'step',
  'total',
  'points',
  'index',
  'list',
  'low',
  'high',
  'price',
  'current',
  'value',
  'skill',
  'salary',
  'equity',
  'trust',
  'investors',
  'pre',
  'after',
  'scheme',
  'version',
  'needs',
  'cause',
  'grade',
  'name',
]);

function collectStrings(node: unknown, path: string, out: [string, string][]): void {
  if (typeof node === 'string') out.push([path, node]);
  else if (Array.isArray(node)) {
    node.forEach((v, i) => {
      collectStrings(v, `${path}.${i}`, out);
    });
  } else if (typeof node === 'object' && node !== null) {
    for (const [k, v] of Object.entries(node)) collectStrings(v, path ? `${path}.${k}` : k, out);
  }
}

describe('localisation', () => {
  const i18n = createI18n();

  it('only uses known placeholders', () => {
    const strings: [string, string][] = [];
    collectStrings(en, '', strings);
    for (const [path, text] of strings) {
      for (const match of text.matchAll(/\{\{\s*([a-zA-Z]+)/g)) {
        expect(KNOWN_PARAMS.has(match[1] ?? ''), `${path} uses {{${match[1]}}}`).toBe(true);
      }
    }
  });

  it('renders every required key without leftover placeholders', () => {
    const params = {
      company: 'Fernworks',
      founder: 'Robin',
      rival: 'Synergrid',
      month: 3,
      name: 'Ada Pemberton',
      role: 'engineer',
      feature: 'darkMode',
      trait: 'loyal',
      investor: 'hollowpine',
      stage: 'startup',
      model: 'freemium',
      market: 'saas',
      background: 'designer',
      policy: 'freeLunch',
      amount: 1_500_000,
      preMoney: 6_000_000,
      bps: 2000,
      users: 12_345,
      usersDelta: -40,
      mrr: 42_000,
      burn: 80_000,
      cash: 250_000,
      runway: 7,
      count: 3,
      kept: 1200,
      event: 'viralMoment',
      option: 'rideIt',
      netWorth: 1_000_000,
    };
    for (const key of requiredMessageKeys(contentData)) {
      const text = renderMessage(i18n, key, params, 1);
      expect(text, key).not.toMatch(/\{\{|\}\}/);
      expect(text, key).not.toBe(key);
    }
  });

  it('turns content ids into names', () => {
    const text = renderMessage(i18n, 'feed.shipped', { feature: 'darkMode' }, 0);
    expect(text).toContain('Dark mode');
  });

  it('picks wording variants deterministically', () => {
    const a = renderMessage(i18n, 'feed.hired', { name: 'Ada', role: 'engineer' }, 0);
    const b = renderMessage(i18n, 'feed.hired', { name: 'Ada', role: 'engineer' }, 1);
    expect(a).not.toBe(b);
    expect(renderMessage(i18n, 'feed.hired', { name: 'Ada', role: 'engineer' }, 3)).toBe(a);
  });

  it('formats money, deltas and ownership', () => {
    expect(formatMoney(950, 'en')).toBe('$950');
    expect(formatMoney(42_000, 'en')).toBe('$42k');
    expect(formatMoney(1_250_000, 'en')).toBe('$1.25M');
    expect(formatMoney(-3_000, 'en')).toBe('−$3,000');
    expect(formatDelta(12, 'en')).toBe('+12');
    expect(formatDelta(-1200, 'en')).toBe('−1,200');
    expect(formatBps(1250, 'en')).toBe('12.5%');
    expect(
      renderMessage(
        i18n,
        'feed.monthClosed',
        { cash: 1_000, runway: 999, mrr: 0, burn: 0, users: 1, usersDelta: 1 },
        2,
      ),
    ).toContain('profitable');
  });
});

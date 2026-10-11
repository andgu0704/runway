import type { Amount, Effect } from '../content/schema/logic';
import type { GameState } from '../engine';
import { formatMoney } from '../i18n/format';
import type { ChipTone } from './components/Chip';
import { i18n } from './i18n';

export interface EffectChip {
  label: string;
  tone: ChipTone;
  priority: number;
}

const MAX_CHIPS = 3;

function guess(amount: Amount | undefined, state: GameState): number {
  if (amount === undefined) return 0;
  if (typeof amount === 'number') return amount;
  if ('metric' in amount) {
    const base =
      amount.metric === 'cash'
        ? state.stats.cash
        : amount.metric === 'users'
          ? state.stats.users
          : 10_000;
    return Math.min(amount.max ?? Infinity, Math.max(amount.min ?? -Infinity, base * amount.times));
  }
  return (amount.min + amount.max) / 2;
}

const sign = (n: number) => (n > 0 ? '+' : '−');

/** A short, honest preview of what an option does. Hidden pressures are hinted, never quantified. */
export function effectChips(effects: readonly Effect[], state: GameState): EffectChip[] {
  const chips: EffectChip[] = [];
  const add = (
    key: string,
    tone: ChipTone,
    priority: number,
    params: Record<string, string | number> = {},
  ) => {
    chips.push({ label: i18n.t(`ui.effect.${key}`, params), tone, priority });
  };
  for (const e of effects) {
    switch (e.op) {
      case 'ending':
        add(
          e.ending === 'acquired' || e.ending === 'acquihired' ? 'sells' : 'ends',
          e.ending.startsWith('acqui') ? 'money' : 'down',
          100,
        );
        break;
      case 'chance':
        add('gamble', 'warn', 80);
        break;
      case 'schedule':
        add('later', 'warn', 70);
        break;
      case 'negotiate':
        add('talks', 'money', 60);
        break;
      case 'layoff':
        add('layoffs', 'down', 65);
        break;
      case 'cofounderLeaves':
        add('cofounderLeaves', 'down', 90);
        break;
      case 'equity':
        add('equity', 'warn', 55);
        break;
      case 'stat': {
        const value =
          guess(e.add, state) + (e.mul === undefined ? 0 : state.stats[e.stat] * (e.mul - 1));
        if (Math.abs(value) < 0.5) break;
        const goodWhenUp = e.stat !== 'bugs' && e.stat !== 'techDebt';
        const tone: ChipTone = value > 0 === goodWhenUp ? 'up' : 'down';
        if (e.stat === 'cash') {
          add('cash', tone, 50, { value: `${sign(value)}${formatMoney(Math.abs(value), 'en')}` });
        } else if (e.stat === 'users' && e.mul !== undefined) {
          add('usersPct', tone, 45, {
            value: `${sign(value)}${Math.round(Math.abs(e.mul - 1) * 100)}%`,
          });
        } else {
          add('stat', tone, Math.min(44, 20 + Math.abs(value)), {
            name: i18n.t(`metric.${e.stat}`),
            value: `${sign(value)}${Math.round(Math.abs(value))}`,
          });
        }
        break;
      }
      case 'meter': {
        const value = guess(e.add, state);
        if (value === 0) break;
        add(`meter.${e.meter}.${value > 0 ? 'up' : 'down'}`, value > 0 ? 'warn' : 'up', 40);
        break;
      }
      case 'trust': {
        const value = guess(e.add, state);
        if (value === 0) break;
        add(value > 0 ? 'trustUp' : 'trustDown', value > 0 ? 'up' : 'down', 35, {
          who: i18n.t(`requirement.who.${e.character}`),
        });
        break;
      }
      case 'employee':
        if (e.leave === true || e.fire === true) add('someoneLeaves', 'down', 60);
        else if (e.mood !== undefined && guess(e.mood, state) !== 0) {
          add(
            guess(e.mood, state) > 0 ? 'happier' : 'unhappier',
            guess(e.mood, state) > 0 ? 'up' : 'down',
            25,
          );
        }
        break;
      default:
        break;
    }
  }
  const seen = new Set<string>();
  return chips
    .sort((a, b) => b.priority - a.priority)
    .filter((c) => (seen.has(c.label) ? false : (seen.add(c.label), true)))
    .slice(0, MAX_CHIPS);
}

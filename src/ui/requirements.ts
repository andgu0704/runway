import type { Condition } from '../content/schema/logic';
import { check } from '../engine/conditions';
import { metric } from '../engine/metrics';
import type { ContentPack, GameState } from '../engine';
import { i18n } from './i18n';
import { formatMoney } from '../i18n/format';

export interface Requirement {
  text: string;
  met: boolean;
}

const MONEY_METRICS = new Set(['cash', 'mrr', 'burn', 'netBurn', 'valuation']);

function metricValue(metric: string, value: number): string {
  if (MONEY_METRICS.has(metric)) return formatMoney(value, 'en');
  if (metric === 'userGrowth') return `${Math.round(value * 100)}%`;
  return value.toLocaleString('en');
}

function describeLeaf(c: Condition): string {
  if ('metric' in c) {
    const name = i18n.t(`metric.${c.metric}`);
    if (c.gte !== undefined && c.lte === undefined)
      return i18n.t('requirement.atLeast', { name, value: metricValue(c.metric, c.gte) });
    if (c.lte !== undefined && c.gte === undefined)
      return i18n.t('requirement.atMost', { name, value: metricValue(c.metric, c.lte) });
    return i18n.t('requirement.between', {
      name,
      low: metricValue(c.metric, c.gte ?? 0),
      high: metricValue(c.metric, c.lte ?? 0),
    });
  }
  if ('flag' in c) return i18n.t(`requirement.flag.${c.flag}`);
  if ('trust' in c) {
    const who = i18n.t(`requirement.who.${c.trust}`);
    return c.lte !== undefined
      ? i18n.t('requirement.distrust', { who })
      : i18n.t('requirement.trust', { who, value: c.gte ?? 0 });
  }
  if ('hasTrait' in c)
    return i18n.t('requirement.trait', { trait: i18n.t(`trait.${c.hasTrait}.name`) });
  if ('hasRole' in c) return i18n.t('requirement.role', { role: i18n.t(`role.${c.hasRole}.name`) });
  if ('cofounder' in c)
    return i18n.t(c.cofounder ? 'requirement.cofounder' : 'requirement.noCofounder');
  if ('launched' in c)
    return i18n.t(c.launched ? 'requirement.launched' : 'requirement.notLaunched');
  if ('shipped' in c)
    return i18n.t('requirement.shipped', { feature: i18n.t(`feature.${c.shipped}.name`) });
  if ('stageAtLeast' in c)
    return i18n.t('requirement.stage', { stage: i18n.t(`stage.${c.stageAtLeast}.name`) });
  if ('investorControl' in c) return i18n.t('requirement.investorControl');
  return i18n.t('requirement.other');
}

/** Turns a condition tree into a short checklist the player can act on. */
export function describeRequirements(
  condition: Condition | undefined,
  state: GameState,
  content: ContentPack,
): Requirement[] {
  if (condition === undefined) return [];
  const ctx = { state, content, subject: null, params: {} };
  if ('all' in condition)
    return condition.all.flatMap((c) => describeRequirements(c, state, content));
  if ('any' in condition) {
    const parts = condition.any.map((c) =>
      describeRequirements(c, state, content)
        .map((r) => r.text)
        .join(', '),
    );
    return [{ text: parts.join(i18n.t('requirement.or')), met: check(condition, ctx) }];
  }
  if ('not' in condition)
    return [{ text: i18n.t('requirement.other'), met: check(condition, ctx) }];
  return [{ text: describeLeaf(condition), met: check(condition, ctx) }];
}

export interface Goal extends Requirement {
  /** 0–1, how close the company is. */
  progress: number;
}

function progressOf(condition: Condition, state: GameState, content: ContentPack): number {
  const ctx = { state, content, subject: null, params: {} };
  if (check(condition, ctx)) return 1;
  if ('all' in condition) {
    const parts = condition.all.map((c) => progressOf(c, state, content));
    return parts.reduce((a, b) => a + b, 0) / Math.max(1, parts.length);
  }
  if ('any' in condition)
    return Math.max(0, ...condition.any.map((c) => progressOf(c, state, content)));
  if ('metric' in condition && condition.gte !== undefined && condition.gte > 0)
    return Math.max(0, Math.min(1, metric(state, content, condition.metric) / condition.gte));
  return 0;
}

/** The checklist for a stage's entry rule, each item with how far along the company is. */
export function goals(
  condition: Condition | null | undefined,
  state: GameState,
  content: ContentPack,
): Goal[] {
  if (condition === null || condition === undefined) return [];
  const items = 'all' in condition ? condition.all : [condition];
  return items.flatMap((c) =>
    describeRequirements(c, state, content).map((r) => ({
      ...r,
      progress: progressOf(c, state, content),
    })),
  );
}

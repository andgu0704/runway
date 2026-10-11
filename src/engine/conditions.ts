import type { Amount, Condition } from '../content/schema/logic';
import { stageIndex, type ContentPack } from './content';
import { investorControl } from './economy';
import { metric } from './metrics';
import { clamp } from './math';
import { randRange } from './rng';
import type { ActionParams, Employee, GameState } from './state';

export interface EvalContext {
  state: GameState;
  content: ContentPack;
  subject: Employee | null;
  params: ActionParams;
}

function inRange(value: number, gte?: number, lte?: number): boolean {
  if (gte !== undefined && value < gte) return false;
  if (lte !== undefined && value > lte) return false;
  return true;
}

export function flagValue(state: GameState, flag: string): number {
  return state.flags[flag] ?? 0;
}

export function check(condition: Condition | undefined, ctx: EvalContext): boolean {
  if (condition === undefined) return true;
  const { state, content } = ctx;
  if ('all' in condition) return condition.all.every((c) => check(c, ctx));
  if ('any' in condition) return condition.any.some((c) => check(c, ctx));
  if ('not' in condition) return !check(condition.not, ctx);
  if ('metric' in condition) {
    return inRange(metric(state, content, condition.metric), condition.gte, condition.lte);
  }
  if ('flag' in condition) {
    const value = flagValue(state, condition.flag);
    if (condition.gte !== undefined) return value >= condition.gte;
    return (value !== 0) === (condition.is ?? true);
  }
  if ('trust' in condition) {
    if (condition.trust === 'cofounder' && !state.cofounderPresent) return false;
    return inRange(state.trust[condition.trust], condition.gte, condition.lte);
  }
  if ('stage' in condition) return condition.stage.includes(state.stage);
  if ('stageAtLeast' in condition) {
    return stageIndex(content, state.stage) >= stageIndex(content, condition.stageAtLeast);
  }
  if ('hasRole' in condition) {
    const count = state.team.filter((e) => e.role === condition.hasRole).length;
    return count >= (condition.count ?? 1);
  }
  if ('hasTrait' in condition) {
    return state.team.some((e) => e.traits.includes(condition.hasTrait));
  }
  if ('policy' in condition) return state.settings.policies.includes(condition.policy);
  if ('market' in condition) return condition.market.includes(state.setup.market);
  if ('background' in condition) return condition.background.includes(state.setup.background);
  if ('model' in condition) return condition.model.includes(state.settings.model);
  if ('launched' in condition) return state.product.launched === condition.launched;
  if ('cofounder' in condition) return state.cofounderPresent === condition.cofounder;
  if ('shipped' in condition) return state.product.shipped.includes(condition.shipped);
  if ('subjectRole' in condition) {
    return ctx.subject !== null && condition.subjectRole.includes(ctx.subject.role);
  }
  if ('subjectTrait' in condition) {
    return ctx.subject !== null && ctx.subject.traits.includes(condition.subjectTrait);
  }
  return investorControl(state) === condition.investorControl;
}

/** Resolves an amount. Ranges draw from the run's RNG, so this is not pure for ranges. */
export function resolveAmount(amount: Amount, ctx: EvalContext): number {
  if (typeof amount === 'number') return amount;
  if ('metric' in amount) {
    const value = metric(ctx.state, ctx.content, amount.metric) * amount.times;
    return clamp(value, amount.min ?? -Infinity, amount.max ?? Infinity);
  }
  return randRange(ctx.state.rng, amount.min, amount.max);
}

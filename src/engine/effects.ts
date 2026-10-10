import type { StatId } from '../content/schema/ids';
import type { Effect } from '../content/schema/logic';
import { grantFromPool, issueShares, transferShares } from './capTable';
import { flagValue, resolveAmount, type EvalContext } from './conditions';
import { must } from './content';
import { declareEnding } from './endings';
import { addFeed, newId } from './log';
import { clamp } from './math';
import { metric } from './metrics';
import { startNegotiation } from './negotiation';
import { chance, pick } from './rng';
import type { Cause, Employee, MessageParams } from './state';
import { addCandidates, hireCandidate, removeEmployee } from './team';

export interface EffectContext extends EvalContext {
  /** Recorded on anything this effect schedules, so consequences can explain themselves. */
  cause: Cause;
}

const BOUNDED: Partial<Record<StatId, [number, number]>> = {
  quality: [0, 100],
  morale: [0, 100],
  reputation: [0, 100],
  techDebt: [0, 100],
  hype: [0, 100],
  bugs: [0, 999],
  users: [0, Number.MAX_SAFE_INTEGER],
};

export function setStat(ctx: EvalContext, stat: StatId, value: number): void {
  const bounds = BOUNDED[stat];
  const next = bounds === undefined ? value : clamp(value, bounds[0], bounds[1]);
  ctx.state.stats[stat] = stat === 'cash' || stat === 'users' ? Math.round(next) : next;
}

function targets(ctx: EvalContext, target: 'param' | 'subject' | 'all' | 'random'): Employee[] {
  const team = ctx.state.team;
  switch (target) {
    case 'all':
      return [...team];
    case 'random':
      return team.length === 0 ? [] : [pick(ctx.state.rng, team)];
    case 'subject':
      return ctx.subject === null ? [] : team.filter((e) => e.id === ctx.subject?.id);
    case 'param':
      return team.filter((e) => e.id === ctx.params.employee);
  }
}

function feedParams(ctx: EvalContext, metrics: Record<string, string> | undefined): MessageParams {
  const params: MessageParams = {};
  for (const [name, value] of Object.entries(ctx.params)) {
    if (typeof value === 'string' || typeof value === 'number') params[name] = value;
  }
  if (ctx.subject !== null) {
    params.name = ctx.subject.name;
    params.role = ctx.subject.role;
  }
  for (const [name, id] of Object.entries(metrics ?? {})) {
    params[name] = Math.round(metric(ctx.state, ctx.content, id as never));
  }
  return params;
}

export function runEffects(effects: readonly Effect[], ctx: EffectContext): void {
  for (const effect of effects) {
    if (ctx.state.ending !== null) return;
    runEffect(effect, ctx);
  }
}

function runEffect(effect: Effect, ctx: EffectContext): void {
  const { state, content } = ctx;
  switch (effect.op) {
    case 'stat': {
      let value = state.stats[effect.stat];
      if (effect.mul !== undefined) value *= effect.mul;
      if (effect.add !== undefined) value += resolveAmount(effect.add, ctx);
      setStat(ctx, effect.stat, value);
      return;
    }
    case 'meter':
      state.meters[effect.meter] = clamp(
        state.meters[effect.meter] + resolveAmount(effect.add, ctx),
        0,
        100,
      );
      return;
    case 'flag': {
      const current = flagValue(state, effect.flag);
      let next = current;
      if (effect.set !== undefined)
        next = typeof effect.set === 'number' ? effect.set : effect.set ? 1 : 0;
      if (effect.add !== undefined) next += effect.add;
      if (next === 0) Reflect.deleteProperty(state.flags, effect.flag);
      else state.flags[effect.flag] = next;
      return;
    }
    case 'trust':
      state.trust[effect.character] = clamp(
        state.trust[effect.character] + resolveAmount(effect.add, ctx),
        0,
        100,
      );
      return;
    case 'schedule':
      state.scheduled.push({
        id: newId(state),
        due: state.month + Math.max(1, Math.round(resolveAmount(effect.in, ctx))),
        consequence: effect.consequence,
        cause: ctx.cause,
      });
      return;
    case 'chance': {
      let p = effect.p;
      if (effect.per !== undefined)
        p += effect.per.slope * metric(state, content, effect.per.metric);
      if (chance(state.rng, clamp(p, 0, 1))) runEffects(effect.then, ctx);
      else if (effect.else !== undefined) runEffects(effect.else, ctx);
      return;
    }
    case 'feed':
      addFeed(state, content, effect.key, effect.tone, feedParams(ctx, effect.params));
      return;
    case 'boost':
      state.boosts = state.boosts.filter((b) => b.id !== effect.id);
      state.boosts.push({
        id: effect.id,
        until: state.month + effect.months - 1,
        mods: effect.mods,
      });
      return;
    case 'employee':
      for (const employee of targets(ctx, effect.target)) {
        if (effect.mood !== undefined) {
          employee.mood = clamp(employee.mood + resolveAmount(effect.mood, ctx), -40, 40);
        }
        if (effect.salaryMul !== undefined) {
          employee.salary = Math.round((employee.salary * effect.salaryMul) / 1000) * 1000;
        }
        if (effect.reveal === true) employee.revealed = [...employee.traits];
        if (effect.equityBps !== undefined) {
          grantFromPool(state, `emp:${employee.id}`, effect.equityBps);
          employee.equityBps += effect.equityBps;
        }
        if (effect.leave === true) removeEmployee(state, content, employee.id, 'resigned');
        if (effect.fire === true) removeEmployee(state, content, employee.id, 'fired');
      }
      return;
    case 'layoff':
      layoff(ctx, effect.share);
      return;
    case 'hire':
      if (ctx.params.candidate !== undefined) hireCandidate(state, content, ctx.params.candidate);
      return;
    case 'candidates': {
      const role = effect.role ?? ctx.params.role;
      if (role !== undefined) addCandidates(state, content, role, effect.count);
      return;
    }
    case 'queueFeature':
      if (ctx.params.feature !== undefined) {
        state.product.roadmap.push({ feature: ctx.params.feature, progress: 0 });
      }
      return;
    case 'progress': {
      const active = state.product.roadmap[0];
      if (active !== undefined) active.progress += resolveAmount(effect.add, ctx);
      return;
    }
    case 'launch':
      launch(ctx);
      return;
    case 'setting':
      applySetting(ctx, effect.setting);
      return;
    case 'policy': {
      const policy = ctx.params.policy;
      if (policy === undefined) return;
      const policies = state.settings.policies;
      state.settings.policies = policies.includes(policy)
        ? policies.filter((p) => p !== policy)
        : [...policies, policy];
      return;
    }
    case 'order':
      if (ctx.params.order !== undefined) {
        state.settings.orders[ctx.params.order.role] = ctx.params.order.order;
      }
      return;
    case 'negotiate':
      startNegotiation(state, content, effect.pool);
      return;
    case 'ending':
      declareEnding(state, content, effect.ending, effect.valueMul ?? 1);
      return;
    case 'equity':
      issueShares(state, effect.holder, effect.bps);
      return;
    case 'ap':
      state.ap.used = clamp(state.ap.used - effect.add, 0, state.ap.max + 3);
      return;
    case 'cofounderLeaves':
      cofounderLeaves(ctx);
      return;
  }
}

function launch(ctx: EffectContext): void {
  const { state, content } = ctx;
  if (state.product.launched) return;
  const market = must(content.markets, state.setup.market, 'market');
  const qualityFactor = 0.4 + state.stats.quality / 80;
  const hypeFactor = 0.5 + state.stats.hype / 50;
  const users = Math.round(
    market.launchUsers * qualityFactor * hypeFactor + state.product.waitlist,
  );
  state.product.launched = true;
  state.product.launchMonth = state.month;
  state.product.waitlist = 0;
  setStat(ctx, 'users', state.stats.users + users);
  addFeed(state, content, 'feed.launched', 'milestone', { users });
}

function applySetting(ctx: EffectContext, setting: 'price' | 'marketingBudget' | 'model'): void {
  const { state, params } = ctx;
  if (setting === 'price' && params.amount !== undefined) state.settings.price = params.amount;
  if (setting === 'marketingBudget' && params.amount !== undefined) {
    state.settings.marketingBudget = Math.max(0, Math.round(params.amount));
  }
  if (setting === 'model' && params.model !== undefined) {
    state.settings.model = params.model;
    const market = must(ctx.content.markets, state.setup.market, 'market');
    const config = market.models.find((m) => m.model === params.model);
    if (config !== undefined) state.settings.price = config.fairPrice;
  }
}

/** Lets go of a share of the team, newest first; costs severance and leaves a mark. */
function layoff(ctx: EffectContext, share: number): void {
  const { state, content } = ctx;
  const count = Math.round(state.team.length * share);
  if (count === 0) return;
  const leaving = [...state.team].sort((a, b) => b.hiredMonth - a.hiredMonth).slice(0, count);
  for (const employee of leaving) removeEmployee(state, content, employee.id, 'fired');
  state.flags.layoffs = (state.flags.layoffs ?? 0) + 1;
  addFeed(state, content, 'feed.layoffs', 'bad', { count });
}

function cofounderLeaves(ctx: EffectContext): void {
  const { state, content } = ctx;
  if (!state.cofounderPresent) return;
  state.cofounderPresent = false;
  state.board = state.board.filter((seat) => seat !== 'cofounder');
  const held = state.capTable.find((e) => e.holder === 'cofounder')?.bps ?? 0;
  const vestedShare = clamp(state.month / 48, 0.25, 1);
  const unvested = Math.round(held * (1 - vestedShare));
  if (unvested > 0) transferShares(state, 'cofounder', 'pool', unvested);
  addFeed(state, content, 'feed.cofounderLeft', 'bad', { kept: held - unvested });
}

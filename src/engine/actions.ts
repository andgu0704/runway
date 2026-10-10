import type { Action, ParamSpec } from '../content/schema/records';
import { CHARACTER_IDS } from '../content/schema/ids';
import { check, resolveAmount, type EvalContext } from './conditions';
import { must, stageIndex, type ContentPack } from './content';
import { marketModel } from './economy';
import { runEffects } from './effects';
import { addTimeline } from './log';
import type { ActionParams, GameState, MessageParams } from './state';
import { buildableFeatures } from './turn/product';

export type Unavailable =
  | 'ended'
  | 'eventPending'
  | 'negotiating'
  | 'actionPoints'
  | 'cash'
  | 'cooldown'
  | 'once'
  | 'conditions'
  | 'noOptions';

export interface ActionStatus {
  action: Action;
  available: boolean;
  reason: Unavailable | null;
  cost: number;
}

/** Valid values for an action's parameter, or null when the action takes none. */
export type ParamOption =
  | { kind: 'feature'; id: string }
  | { kind: 'candidate'; id: string }
  | { kind: 'employee'; id: string }
  | { kind: 'role'; id: string }
  | { kind: 'policy'; id: string; active: boolean }
  | { kind: 'character'; id: (typeof CHARACTER_IDS)[number] }
  | { kind: 'price' | 'budget'; min: number; max: number; step: number; current: number }
  | { kind: 'model'; id: string }
  | { kind: 'order'; role: string; order: string; active: boolean };

function ctxFor(state: GameState, content: ContentPack, params: ActionParams = {}): EvalContext {
  return { state, content, subject: null, params };
}

export function paramOptions(
  state: GameState,
  content: ContentPack,
  spec: ParamSpec,
): ParamOption[] {
  const stage = stageIndex(content, state.stage);
  switch (spec.kind) {
    case 'feature':
      return buildableFeatures(state, content).map((f) => ({ kind: 'feature', id: f.id }));
    case 'candidate':
      return state.candidates.map((c) => ({ kind: 'candidate', id: c.id }));
    case 'employee':
      return state.team
        .filter((e) => spec.roles === undefined || spec.roles.includes(e.role))
        .map((e) => ({ kind: 'employee', id: e.id }));
    case 'role':
      return content.data.roles
        .filter((r) => stage >= stageIndex(content, r.minStage))
        .filter((r) => r.kind === 'ic' || !state.team.some((e) => e.role === r.id))
        .map((r) => ({ kind: 'role', id: r.id }));
    case 'policy':
      return content.data.policies
        .filter((p) => stage >= stageIndex(content, p.minStage))
        .map((p) => ({ kind: 'policy', id: p.id, active: state.settings.policies.includes(p.id) }));
    case 'character':
      return CHARACTER_IDS.filter((id) => id !== 'cofounder' || state.cofounderPresent).map(
        (id) => ({
          kind: 'character',
          id,
        }),
      );
    case 'price': {
      const config = marketModel(state, content);
      return [
        {
          kind: 'price',
          min: config.priceMin,
          max: config.priceMax,
          step: config.priceStep,
          current: state.settings.price,
        },
      ];
    }
    case 'budget':
      return [
        {
          kind: 'budget',
          min: 0,
          max: Math.max(5000, Math.round(Math.max(0, state.stats.cash) / 4 / 1000) * 1000),
          step: 1000,
          current: state.settings.marketingBudget,
        },
      ];
    case 'model':
      return must(content.markets, state.setup.market, 'market')
        .models.filter((m) => m.model !== state.settings.model)
        .map((m) => ({ kind: 'model', id: m.model }));
    case 'order': {
      const out: ParamOption[] = [];
      for (const employee of state.team) {
        const role = must(content.roles, employee.role, 'role');
        const active = state.settings.orders[role.id] ?? role.defaultOrder;
        for (const order of role.orders ?? []) {
          out.push({ kind: 'order', role: role.id, order: order.id, active: order.id === active });
        }
      }
      return out;
    }
  }
}

export function actionStatus(state: GameState, content: ContentPack, action: Action): ActionStatus {
  const ctx = ctxFor(state, content);
  const cost = action.cost === undefined ? 0 : costOf(action, ctx);
  const result = (reason: Unavailable | null): ActionStatus => ({
    action,
    available: reason === null,
    reason,
    cost,
  });
  if (state.ending !== null) return result('ended');
  if (state.pendingEvent !== null) return result('eventPending');
  if (state.negotiation !== null) return result('negotiating');
  if (action.once === true && state.actionLastUsed[action.id] !== undefined) return result('once');
  const last = state.actionLastUsed[action.id];
  if (last !== undefined && state.month - last < (action.cooldown ?? 0)) return result('cooldown');
  if (state.ap.max - state.ap.used < action.ap) return result('actionPoints');
  if (cost > 0 && state.stats.cash < cost) return result('cash');
  if (!check(action.when, ctx)) return result('conditions');
  if (action.param !== undefined && paramOptions(state, content, action.param).length === 0) {
    return result('noOptions');
  }
  return result(null);
}

/** Cost is resolved deterministically: ranges use their midpoint for display and charging. */
function costOf(action: Action, ctx: EvalContext): number {
  const cost = action.cost;
  if (cost === undefined) return 0;
  if (typeof cost === 'object' && 'min' in cost && !('metric' in cost)) {
    return Math.round((cost.min + cost.max) / 2);
  }
  return Math.round(resolveAmount(cost, ctx));
}

/** Actions the player can see in their current stage, with availability. */
export function visibleActions(state: GameState, content: ContentPack): ActionStatus[] {
  const stage = stageIndex(content, state.stage);
  const ctx = ctxFor(state, content);
  return content.data.actions
    .filter((a) => stage >= stageIndex(content, a.minStage))
    .filter((a) => a.maxStage === undefined || stage <= stageIndex(content, a.maxStage))
    .filter((a) => check(a.visibleWhen, ctx))
    .map((a) => actionStatus(state, content, a));
}

function paramsValid(
  state: GameState,
  content: ContentPack,
  spec: ParamSpec,
  params: ActionParams,
): boolean {
  const options = paramOptions(state, content, spec);
  switch (spec.kind) {
    case 'feature':
      return options.some((o) => o.kind === 'feature' && o.id === params.feature);
    case 'candidate':
      return options.some((o) => o.kind === 'candidate' && o.id === params.candidate);
    case 'employee':
      return options.some((o) => o.kind === 'employee' && o.id === params.employee);
    case 'role':
      return options.some((o) => o.kind === 'role' && o.id === params.role);
    case 'policy':
      return options.some((o) => o.kind === 'policy' && o.id === params.policy);
    case 'character':
      return options.some((o) => o.kind === 'character' && o.id === params.character);
    case 'model':
      return options.some((o) => o.kind === 'model' && o.id === params.model);
    case 'order':
      return options.some(
        (o) =>
          o.kind === 'order' &&
          !o.active &&
          o.role === params.order?.role &&
          o.order === params.order.order,
      );
    case 'price':
    case 'budget': {
      const range = options[0];
      const amount = params.amount;
      return (
        range !== undefined &&
        'min' in range &&
        amount !== undefined &&
        Number.isFinite(amount) &&
        amount >= range.min &&
        amount <= range.max
      );
    }
  }
}

function causeParams(params: ActionParams): MessageParams {
  const out: MessageParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' || typeof value === 'number') out[key] = value;
  }
  return out;
}

export type ActionError = Unavailable | 'unknownAction' | 'invalidParams';

export function performAction(
  state: GameState,
  content: ContentPack,
  actionId: string,
  params: ActionParams,
): ActionError | null {
  const action = content.actions.get(actionId);
  if (action === undefined) return 'unknownAction';
  const visible = visibleActions(state, content).find((s) => s.action.id === actionId);
  if (visible === undefined) return 'conditions';
  if (!visible.available) return visible.reason;
  if (action.param !== undefined && !paramsValid(state, content, action.param, params)) {
    return 'invalidParams';
  }

  state.ap.used += action.ap;
  state.stats.cash -= visible.cost;
  state.actionLastUsed[action.id] = state.month;
  if (action.shady === true) state.flags.shadyActs = (state.flags.shadyActs ?? 0) + 1;

  const subject =
    params.employee === undefined
      ? null
      : (state.team.find((e) => e.id === params.employee) ?? null);
  const cause = {
    month: state.month,
    key: `action.${action.id}.cause`,
    params: causeParams(params),
  };
  if (action.timeline === true) {
    addTimeline(
      state,
      content,
      'decision',
      `action.${action.id}.timeline`,
      'neutral',
      cause.params,
    );
  }
  runEffects(action.effects, { state, content, subject, params, cause });
  return null;
}

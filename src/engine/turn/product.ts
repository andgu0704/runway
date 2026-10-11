import type { Feature } from '../../content/schema/records';
import { check } from '../conditions';
import { must, type ContentPack } from '../content';
import { capacity, market } from '../economy';
import { runEffects } from '../effects';
import { addFeed, addTimeline } from '../log';
import { clamp } from '../math';
import type { ResolvedMods } from '../mods';
import type { GameState } from '../state';

export function featureAppeal(state: GameState, feature: Feature): number {
  return feature.appeal * (feature.markets?.[state.setup.market] ?? 1);
}

/** Features the player could put on the roadmap right now. */
export function buildableFeatures(state: GameState, content: ContentPack): Feature[] {
  const taken = new Set([...state.product.shipped, ...state.product.roadmap.map((r) => r.feature)]);
  const mvpDone = content.data.features.some((f) => f.mvp === true && taken.has(f.id));
  const ctx = { state, content, subject: null, params: {} };
  return content.data.features.filter(
    (f) =>
      !taken.has(f.id) &&
      (f.mvp === true || mvpDone) &&
      (f.mvp !== true || !mvpDone) &&
      check(f.requires, ctx),
  );
}

function autoQueue(state: GameState, content: ContentPack): void {
  const options = buildableFeatures(state, content);
  const best = [...options].sort(
    (a, b) =>
      featureAppeal(state, b) / b.cost - featureAppeal(state, a) / a.cost || (a.id < b.id ? -1 : 1),
  )[0];
  if (best === undefined) return;
  state.product.roadmap.push({ feature: best.id, progress: 0 });
  addFeed(state, content, 'feed.autoQueued', 'neutral', { feature: best.id });
}

function ship(state: GameState, content: ContentPack, feature: Feature, mods: ResolvedMods): void {
  state.product.shipped.push(feature.id);
  const appeal = featureAppeal(state, feature) * mods.featureAppealMul;
  state.stats.hype = clamp(state.stats.hype + appeal * 0.6 * mods.hypeMul, 0, 100);
  addFeed(state, content, 'feed.shipped', 'good', { feature: feature.id });
  addTimeline(state, content, 'milestone', 'timeline.shipped', 'good', { feature: feature.id });
  if (feature.onShip !== undefined) {
    runEffects(feature.onShip, {
      state,
      content,
      subject: null,
      params: {},
      cause: { month: state.month, key: 'cause.shipped', params: { feature: feature.id } },
    });
  }
}

function qualityTarget(state: GameState, content: ContentPack, mods: ResolvedMods): number {
  let appeal = 0;
  for (const id of state.product.shipped) {
    appeal += featureAppeal(state, must(content.features, id, 'feature'));
  }
  const featureScore = 55 * (1 - Math.exp((-appeal * mods.featureAppealMul) / 60));
  const design = Math.min(15, capacity(state, content, 'design', mods) * 0.8);
  const bugPenalty = (25 * state.stats.bugs) / market(state, content).bugTolerance;
  return clamp(
    20 + featureScore + design + mods.qualityTarget - bugPenalty - state.stats.techDebt * 0.15,
    0,
    100,
  );
}

export function productStep(state: GameState, content: ContentPack, mods: ResolvedMods): void {
  const rules = content.rules;
  if (state.product.roadmap.length === 0 && mods.autoQueue > 0) autoQueue(state, content);

  const engineering = capacity(state, content, 'engineering', mods);
  const active = state.product.roadmap[0];
  const bugShare = clamp(rules.baseBugShare + mods.bugShare, 0.05, 0.9);
  const featureWork = active === undefined ? 0 : engineering * (1 - bugShare);
  const fixWork = engineering - featureWork;
  const debt = state.stats.techDebt;

  if (active !== undefined) {
    const feature = must(content.features, active.feature, 'feature');
    active.progress += featureWork;
    state.stats.bugs +=
      featureWork * rules.bugsPerPoint * feature.bugRate * mods.bugRateMul * (1 + debt / 50);
    state.stats.techDebt += ((featureWork * feature.techDebt) / feature.cost) * mods.techDebtMul;
    if (active.progress >= feature.cost) {
      const overflow = active.progress - feature.cost;
      state.product.roadmap.shift();
      ship(state, content, feature, mods);
      const next = state.product.roadmap[0];
      if (next !== undefined) next.progress += overflow;
    }
  } else {
    state.stats.techDebt -= fixWork * 0.08;
  }
  state.stats.bugs -= (fixWork * rules.bugFixPerPoint) / (1 + debt / 100);
  state.stats.bugs = clamp(state.stats.bugs, 0, 999);
  state.stats.techDebt = clamp(state.stats.techDebt, 0, 100);

  const target = qualityTarget(state, content, mods);
  state.stats.quality = clamp(state.stats.quality + (target - state.stats.quality) * 0.25, 0, 100);

  if (!state.product.launched) {
    const m = market(state, content);
    state.product.waitlist += Math.round((state.stats.hype * m.discovery) / 40);
  }
}

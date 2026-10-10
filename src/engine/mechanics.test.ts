import { describe, expect, it } from 'vitest';
import { act, content, employee, freshRun, launchedCompany, must } from '../test/helpers';
import { burn, capacity, founderOwnership } from './economy';
import { companyMods } from './mods';
import type { GameState } from './state';
import { endTurn } from './turn';
import { foreshadow } from './turn/meters';
import { productStep } from './turn/product';
import { userStep } from './turn/users';

function monthsOf(state: GameState, n: number): void {
  for (let i = 0; i < n && state.ending === null; i++) {
    state.pendingEvent = null;
    endTurn(state, content);
  }
}

describe('core tensions', () => {
  it('features attract users but create bugs', () => {
    const state = launchedCompany();
    for (let i = 0; i < 3; i++) state.team.push(employee());
    state.product.roadmap.push({ feature: 'mobileApp', progress: 0 });
    const bugsBefore = state.stats.bugs;
    productStep(state, content, companyMods(state, content));
    expect(state.stats.bugs).toBeGreaterThan(bugsBefore);
    expect(state.product.roadmap[0]?.progress).toBeGreaterThan(0);
  });

  it('bugs cause churn', () => {
    const clean = launchedCompany();
    const buggy = launchedCompany();
    buggy.stats.bugs = 40;
    userStep(clean, content, companyMods(clean, content));
    userStep(buggy, content, companyMods(buggy, content));
    expect(buggy.stats.users).toBeLessThan(clean.stats.users);
  });

  it('hiring speeds progress and burns cash', () => {
    const solo = launchedCompany();
    const staffed = launchedCompany();
    staffed.team.push(employee(), employee());
    expect(capacity(staffed, content, 'engineering')).toBeGreaterThan(
      capacity(solo, content, 'engineering'),
    );
    expect(burn(staffed, content)).toBeGreaterThan(burn(solo, content) + 15_000);
  });

  it('new hires ramp up over their first months', () => {
    const state = launchedCompany();
    state.team.push(employee({ hiredMonth: state.month }));
    const fresh = capacity(state, content, 'engineering');
    state.month += 3;
    expect(capacity(state, content, 'engineering')).toBeGreaterThan(fresh);
  });

  it('marketing a weak product buys users who leave', () => {
    const run = (quality: number) => {
      const state = launchedCompany();
      state.stats.quality = quality;
      state.settings.marketingBudget = 30_000;
      const mods = companyMods(state, content);
      userStep(state, content, mods);
      state.settings.marketingBudget = 0;
      const acquired = state.product.lowFitUsers;
      for (let i = 0; i < 4; i++) userStep(state, content, mods);
      return { acquired, left: state.product.lowFitUsers };
    };
    const weak = run(25);
    const strong = run(85);
    expect(weak.acquired).toBeGreaterThan(strong.acquired);
    expect(weak.left / weak.acquired).toBeLessThan(0.75);
  });

  it('crunch boosts output now and builds burnout', () => {
    const state = launchedCompany();
    state.team.push(employee(), employee());
    const before = capacity(state, content, 'engineering');
    act(state, 'crunch');
    expect(capacity(state, content, 'engineering')).toBeGreaterThan(before * 1.3);
    expect(state.meters.burnout).toBeGreaterThanOrEqual(25);
  });

  it('burnout eventually costs output', () => {
    const state = launchedCompany();
    state.team.push(employee());
    const rested = capacity(state, content, 'engineering');
    state.meters.burnout = 100;
    expect(capacity(state, content, 'engineering')).toBeLessThan(rested * 0.6);
  });

  it('burnout and low morale drive resignations', () => {
    const quit = (burnout: number, morale: number) => {
      let departures = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const state = launchedCompany(seed);
        for (let i = 0; i < 10; i++) state.team.push(employee());
        state.meters.burnout = burnout;
        state.stats.morale = morale;
        monthsOf(state, 1);
        departures += 10 - state.team.length;
      }
      return departures;
    };
    expect(quit(90, 20)).toBeGreaterThan(quit(0, 80) * 2);
  });

  it('funding extends runway and dilutes ownership', () => {
    const state = freshRun();
    const before = founderOwnership(state);
    const cash = state.stats.cash;
    act(state, 'pitchAngels');
    must(state, { type: 'negotiate', move: { type: 'settle' } });
    expect(state.stats.cash).toBeGreaterThan(cash);
    expect(founderOwnership(state)).toBeLessThan(before);
  });

  it('shady shortcuts pay now and raise hidden scandal risk', () => {
    const state = launchedCompany();
    const users = state.stats.users;
    act(state, 'spamGrowthHack');
    expect(state.stats.users).toBeGreaterThan(users);
    expect(state.meters.scandal).toBeGreaterThan(0);
    expect(state.flags.shadyActs).toBe(1);
  });
});

describe('foreshadowing', () => {
  it('warns once per threshold and again after the meter recovers', () => {
    const state = freshRun();
    state.meters.burnout = 40;
    foreshadow(state, content);
    foreshadow(state, content);
    const warnings = () => state.feed.filter((f) => f.key.startsWith('meter.burnout')).length;
    expect(warnings()).toBe(1);
    state.meters.burnout = 85;
    foreshadow(state, content);
    expect(warnings()).toBe(3);
    state.meters.burnout = 5;
    foreshadow(state, content);
    state.meters.burnout = 40;
    foreshadow(state, content);
    expect(warnings()).toBe(4);
  });

  it('every meter-driven disaster is warned about before it can fire', () => {
    for (const event of content.data.events) {
      if (event.trigger.kind !== 'meter' || event.disaster !== true) continue;
      const meter = content.meters.get(event.trigger.meter);
      expect(meter?.warnings[0]?.at ?? 101).toBeLessThanOrEqual(event.trigger.at);
    }
  });
});

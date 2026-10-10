import { describe, expect, it } from 'vitest';
import { content, employee, freshRun } from '../test/helpers';
import { runEffects, type EffectContext } from './effects';
import type { Effect } from '../content/schema/logic';
import type { GameState } from './state';

function run(state: GameState, effects: Effect[], extra: Partial<EffectContext> = {}): void {
  runEffects(effects, {
    state,
    content,
    subject: null,
    params: {},
    cause: { month: state.month, key: 'action.test.cause', params: {} },
    ...extra,
  });
}

describe('effects', () => {
  it('clamps bounded stats and rounds cash and users', () => {
    const state = freshRun();
    run(state, [
      { op: 'stat', stat: 'morale', add: 500 },
      { op: 'stat', stat: 'quality', add: -500 },
      { op: 'stat', stat: 'cash', add: 0.6 },
      { op: 'stat', stat: 'users', add: 10.4 },
    ]);
    expect(state.stats.morale).toBe(100);
    expect(state.stats.quality).toBe(0);
    expect(state.stats.cash).toBe(50_001);
    expect(state.stats.users).toBe(10);
  });

  it('multiplies stats', () => {
    const state = freshRun();
    state.stats.users = 1000;
    run(state, [{ op: 'stat', stat: 'users', mul: 0.9 }]);
    expect(state.stats.users).toBe(900);
  });

  it('sets, adds and clears flags', () => {
    const state = freshRun();
    run(state, [
      { op: 'flag', flag: 'lawyer', set: true },
      { op: 'flag', flag: 'crunches', add: 2 },
    ]);
    expect(state.flags).toMatchObject({ lawyer: 1, crunches: 2 });
    run(state, [{ op: 'flag', flag: 'lawyer', set: false }]);
    expect(state.flags.lawyer).toBeUndefined();
  });

  it('schedules consequences with their cause', () => {
    const state = freshRun();
    state.month = 4;
    run(state, [{ op: 'schedule', consequence: 'creditCardsDue', in: 8 }], {
      cause: { month: 4, key: 'action.creditCards.cause', params: {} },
    });
    expect(state.scheduled).toHaveLength(1);
    expect(state.scheduled[0]).toMatchObject({
      due: 12,
      consequence: 'creditCardsDue',
      cause: { month: 4, key: 'action.creditCards.cause' },
    });
  });

  it('runs exactly one branch of a chance effect', () => {
    const state = freshRun();
    run(state, [
      {
        op: 'chance',
        p: 1,
        then: [{ op: 'flag', flag: 'a', set: true }],
        else: [{ op: 'flag', flag: 'b', set: true }],
      },
      {
        op: 'chance',
        p: 0,
        then: [{ op: 'flag', flag: 'c', set: true }],
        else: [{ op: 'flag', flag: 'd', set: true }],
      },
    ]);
    expect(Object.keys(state.flags).sort()).toEqual(['a', 'd']);
  });

  it('replaces a boost with the same id rather than stacking it', () => {
    const state = freshRun();
    run(state, [
      { op: 'boost', id: 'crunch', months: 1, mods: { capacityMul: 1.4 } },
      { op: 'boost', id: 'crunch', months: 2, mods: { capacityMul: 1.4 } },
    ]);
    expect(state.boosts).toHaveLength(1);
    expect(state.boosts[0]?.until).toBe(1);
  });

  it('changes the targeted employee only', () => {
    const state = freshRun();
    const a = employee();
    const b = employee();
    state.team.push(a, b);
    run(state, [{ op: 'employee', target: 'param', mood: 10, salaryMul: 1.1 }], {
      params: { employee: a.id },
    });
    expect(state.team[0]?.mood).toBe(10);
    expect(state.team[0]?.salary).toBe(132_000);
    expect(state.team[1]?.mood).toBe(0);
  });

  it('lays off the newest hires first and records it', () => {
    const state = freshRun();
    for (let i = 0; i < 8; i++) state.team.push(employee({ hiredMonth: i }));
    run(state, [{ op: 'layoff', share: 0.25 }]);
    expect(state.team.map((e) => e.hiredMonth)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(state.flags.layoffs).toBe(1);
  });

  it('returns unvested co-founder shares to the pool when they leave', () => {
    const state = freshRun();
    state.month = 12;
    run(state, [{ op: 'cofounderLeaves' }]);
    expect(state.cofounderPresent).toBe(false);
    expect(state.board).toEqual(['founder']);
    expect(state.capTable.find((e) => e.holder === 'cofounder')?.bps).toBe(750);
    expect(state.capTable.find((e) => e.holder === 'pool')?.bps).toBe(2250);
  });

  it('stops running effects once the run has ended', () => {
    const state = freshRun();
    run(state, [
      { op: 'ending', ending: 'walkedAway' },
      { op: 'flag', flag: 'after', set: true },
    ]);
    expect(state.ending?.id).toBe('walkedAway');
    expect(state.flags.after).toBeUndefined();
  });
});

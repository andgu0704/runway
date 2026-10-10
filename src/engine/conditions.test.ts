import { describe, expect, it } from 'vitest';
import { content, employee, freshRun } from '../test/helpers';
import { check, resolveAmount, type EvalContext } from './conditions';
import type { GameState } from './state';

const ctx = (state: GameState, extra: Partial<EvalContext> = {}): EvalContext => ({
  state,
  content,
  subject: null,
  params: {},
  ...extra,
});

describe('conditions', () => {
  it('combines with all, any and not', () => {
    const state = freshRun();
    const yes = { launched: false } as const;
    const no = { launched: true } as const;
    expect(check({ all: [yes, yes] }, ctx(state))).toBe(true);
    expect(check({ all: [yes, no] }, ctx(state))).toBe(false);
    expect(check({ any: [no, yes] }, ctx(state))).toBe(true);
    expect(check({ not: no }, ctx(state))).toBe(true);
    expect(check(undefined, ctx(state))).toBe(true);
  });

  it('reads stats, meters and derived metrics', () => {
    const state = freshRun();
    expect(check({ metric: 'cash', gte: 50_000 }, ctx(state))).toBe(true);
    expect(check({ metric: 'cash', lte: 49_999 }, ctx(state))).toBe(false);
    expect(check({ metric: 'teamSize', gte: 2, lte: 2 }, ctx(state))).toBe(true);
    state.meters.scandal = 40;
    expect(check({ metric: 'scandal', gte: 40 }, ctx(state))).toBe(true);
  });

  it('treats missing flags as false and supports numeric flags', () => {
    const state = freshRun();
    expect(check({ flag: 'lawyer' }, ctx(state))).toBe(false);
    expect(check({ flag: 'lawyer', is: false }, ctx(state))).toBe(true);
    state.flags.crunches = 3;
    expect(check({ flag: 'crunches', gte: 3 }, ctx(state))).toBe(true);
  });

  it('checks trust, stages, roles, traits and setup', () => {
    const state = freshRun();
    state.team.push(employee({ role: 'designer', traits: ['mentor'] }));
    expect(check({ trust: 'cofounder', gte: 60 }, ctx(state))).toBe(true);
    expect(check({ stage: ['garage'] }, ctx(state))).toBe(true);
    expect(check({ stageAtLeast: 'startup' }, ctx(state))).toBe(false);
    expect(check({ hasRole: 'designer' }, ctx(state))).toBe(true);
    expect(check({ hasRole: 'designer', count: 2 }, ctx(state))).toBe(false);
    expect(check({ hasTrait: 'mentor' }, ctx(state))).toBe(true);
    expect(check({ market: ['saas'] }, ctx(state))).toBe(true);
    expect(check({ background: ['designer'] }, ctx(state))).toBe(false);
    expect(check({ cofounder: true }, ctx(state))).toBe(true);
  });

  it('reads the event subject', () => {
    const state = freshRun();
    const subject = employee({ role: 'engineer', traits: ['loyal'] });
    expect(check({ subjectRole: ['engineer'] }, ctx(state, { subject }))).toBe(true);
    expect(check({ subjectTrait: 'loyal' }, ctx(state, { subject }))).toBe(true);
    expect(check({ subjectRole: ['engineer'] }, ctx(state))).toBe(false);
  });

  it('fails co-founder trust checks when there is no co-founder', () => {
    const state = freshRun({ cofounder: null });
    expect(check({ trust: 'cofounder', gte: 0 }, ctx(state))).toBe(false);
  });

  it('resolves fixed, ranged and scaled amounts', () => {
    const state = freshRun();
    expect(resolveAmount(5, ctx(state))).toBe(5);
    for (let i = 0; i < 50; i++) {
      const v = resolveAmount({ min: 2, max: 4 }, ctx(state));
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(4);
    }
    expect(resolveAmount({ metric: 'cash', times: 0.1 }, ctx(state))).toBe(5000);
    expect(resolveAmount({ metric: 'cash', times: 0.1, max: 1000 }, ctx(state))).toBe(1000);
  });
});

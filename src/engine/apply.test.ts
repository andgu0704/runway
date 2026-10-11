import { describe, expect, it } from 'vitest';
import { act, content, freshRun, launchedCompany, must } from '../test/helpers';
import { apply, applyInPlace } from './apply';
import { visibleActions } from './actions';

describe('rules', () => {
  it('spends action points and refuses actions once they are gone', () => {
    const state = freshRun();
    expect(state.ap).toEqual({ used: 0, max: 3 });
    act(state, 'userInterviews');
    act(state, 'writeValues');
    act(state, 'coffeeWithJournalist');
    expect(state.ap.used).toBe(3);
    expect(applyInPlace(state, content, { type: 'performAction', action: 'messageRival' })).toBe(
      'actionPoints',
    );
    must(state, { type: 'endTurn' });
    expect(state.ap.used).toBe(0);
  });

  it('charges cash costs and refuses actions you cannot afford', () => {
    const state = freshRun();
    act(state, 'securityReview');
    expect(state.stats.cash).toBe(46_000);
    state.stats.cash = 100;
    expect(applyInPlace(state, content, { type: 'performAction', action: 'retainLawyer' })).toBe(
      'cash',
    );
  });

  it('enforces cooldowns and once-only actions', () => {
    const state = freshRun();
    act(state, 'writeValues');
    act(state, 'userInterviews');
    must(state, { type: 'endTurn' });
    if (state.pendingEvent !== null) state.pendingEvent = null;
    expect(applyInPlace(state, content, { type: 'performAction', action: 'writeValues' })).toBe(
      'once',
    );
    expect(applyInPlace(state, content, { type: 'performAction', action: 'userInterviews' })).toBe(
      'cooldown',
    );
  });

  it('validates action parameters', () => {
    const state = freshRun();
    expect(
      applyInPlace(state, content, {
        type: 'performAction',
        action: 'buildFeature',
        params: { feature: 'mobileApp' },
      }),
    ).toBe('invalidParams');
    act(state, 'buildFeature', { feature: 'coreProduct' });
    expect(state.product.roadmap).toEqual([{ feature: 'coreProduct', progress: 0 }]);
    expect(applyInPlace(state, content, { type: 'performAction', action: 'nonsense' })).toBe(
      'unknownAction',
    );
  });

  it('blocks actions and turn end while an event is pending', () => {
    const state = freshRun();
    state.pendingEvent = { event: 'conferenceInvite', subject: null, cause: null };
    expect(applyInPlace(state, content, { type: 'performAction', action: 'writeValues' })).toBe(
      'eventPending',
    );
    expect(applyInPlace(state, content, { type: 'endTurn' })).toBe('eventPending');
    must(state, { type: 'resolveEvent', option: 'decline' });
    expect(state.pendingEvent).toBeNull();
  });

  it('shows locked options but refuses to resolve them', () => {
    const state = freshRun({ cofounder: null });
    state.pendingEvent = { event: 'conferenceInvite', subject: null, cause: null };
    expect(applyInPlace(state, content, { type: 'resolveEvent', option: 'sendCofounder' })).toBe(
      'optionLocked',
    );
    expect(applyInPlace(state, content, { type: 'resolveEvent', option: 'bogus' })).toBe(
      'unknownOption',
    );
  });

  it('hides options whose visibility condition fails', () => {
    const state = launchedCompany();
    state.flags.savingsGone = 1;
    state.stats.cash = -1000;
    state.pendingEvent = { event: 'cashCrunch', subject: null, cause: null };
    expect(applyInPlace(state, content, { type: 'resolveEvent', option: 'personalSavings' })).toBe(
      'unknownOption',
    );
  });

  it('records the event choice and its result', () => {
    const state = freshRun();
    state.pendingEvent = { event: 'conferenceInvite', subject: null, cause: null };
    must(state, { type: 'resolveEvent', option: 'decline' });
    expect(state.timeline.at(-1)).toMatchObject({
      kind: 'decision',
      key: 'timeline.eventChoice',
      params: { event: 'conferenceInvite', option: 'decline' },
    });
    expect(state.feed.at(-1)?.key).toBe('event.conferenceInvite.option.decline.result');
  });

  it('only shows stage-appropriate actions', () => {
    const state = freshRun();
    const ids = visibleActions(state, content).map((s) => s.action.id);
    expect(ids).toContain('pitchAngels');
    expect(ids).not.toContain('hackathon');
    expect(ids).not.toContain('designSprint');
    expect(ids).toContain('allNighter');
  });
});

describe('apply', () => {
  it('never mutates the input state', () => {
    const state = freshRun();
    const before = JSON.stringify(state);
    const result = apply(state, content, { type: 'endTurn' });
    expect(result.ok).toBe(true);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('reports signals and the new feed entries', () => {
    const state = freshRun();
    const result = apply(state, content, { type: 'endTurn' });
    if (!result.ok) throw new Error(result.error);
    expect(result.signals).toContain('turnEnded');
    expect(result.feed.length).toBeGreaterThan(0);
    expect(result.feed.every((f) => f.id > (state.feed.at(-1)?.id ?? 0))).toBe(true);
  });

  it('signals a closed deal', () => {
    const state = freshRun();
    act(state, 'pitchAngels');
    const result = apply(state, content, { type: 'negotiate', move: { type: 'settle' } });
    if (!result.ok) throw new Error(result.error);
    expect(result.signals).toContain('dealClosed');
  });

  it('returns errors instead of throwing', () => {
    const state = freshRun();
    expect(apply(state, content, { type: 'resolveEvent', option: 'x' })).toEqual({
      ok: false,
      error: 'noEventPending',
    });
  });
});

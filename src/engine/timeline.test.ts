import { describe, expect, it } from 'vitest';
import { content, launchedCompany, must } from '../test/helpers';
import { endTurn } from './turn';

describe('cause and effect', () => {
  it('a skipped security review comes back as a breach that names its cause', () => {
    const state = launchedCompany();
    state.month = 4;
    state.pendingEvent = { event: 'securityChecklist', subject: null, cause: null };
    must(state, { type: 'resolveEvent', option: 'skipIt' });
    const scheduled = state.scheduled[0];
    expect(scheduled?.cause).toEqual({
      month: 4,
      key: 'event.securityChecklist.option.skipIt.cause',
      params: {},
    });

    for (let i = 0; i < 20 && state.pendingEvent?.event !== 'dataBreach'; i++) {
      state.pendingEvent = null;
      endTurn(state, content);
    }
    expect(state.pendingEvent?.event).toBe('dataBreach');
    expect(state.pendingEvent?.cause?.month).toBe(4);
    const entry = state.timeline.find((t) => t.kind === 'consequence');
    expect(entry).toMatchObject({
      key: 'consequence.breachFromSkippedReview.timeline',
      cause: { month: 4, key: 'event.securityChecklist.option.skipIt.cause' },
    });
    const feed = state.feed.find((f) => f.key === 'consequence.breachFromSkippedReview.feed');
    expect(feed?.cause?.month).toBe(4);
  });

  it('actions with delayed effects record the action as the cause', () => {
    const state = launchedCompany();
    must(state, { type: 'performAction', action: 'creditCards' });
    expect(state.scheduled[0]?.cause.key).toBe('action.creditCards.cause');
    expect(state.timeline.at(-1)?.key).toBe('action.creditCards.timeline');
  });
});

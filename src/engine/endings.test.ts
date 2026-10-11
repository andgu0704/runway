import { describe, expect, it } from 'vitest';
import { content, employee, freshRun, launchedCompany, must, nextMonth } from '../test/helpers';
import { applyInPlace } from './apply';
import { founderProceeds } from './endings';
import { endTurn } from './turn';

describe('endings', () => {
  it('raises a last-chance event when cash runs out', () => {
    const state = launchedCompany();
    state.stats.users = 10;
    state.stats.cash = 1000;
    for (let i = 0; i < 6; i++) state.team.push(employee());
    must(state, { type: 'endTurn' });
    expect(state.stats.cash).toBeLessThan(0);
    expect(state.pendingEvent?.event).toBe('cashCrunch');
    expect(state.ending).toBeNull();
  });

  it('goes bankrupt if the last chance does not fix the cash', () => {
    const state = launchedCompany();
    state.stats.cash = -200_000;
    state.pendingEvent = { event: 'cashCrunch', subject: null, cause: null };
    must(state, { type: 'resolveEvent', option: 'personalSavings' });
    expect(state.ending?.id).toBe('bankrupt');
    expect(state.ending?.netWorth).toBe(0);
  });

  it('goes straight to bankruptcy when cash runs out twice in quick succession', () => {
    const state = launchedCompany();
    state.stats.users = 10;
    state.eventLastSeen.cashCrunch = state.month;
    state.stats.cash = -50_000;
    endTurn(state, content);
    expect(state.ending?.id).toBe('bankrupt');
  });

  it('ends the run and blocks further commands', () => {
    const state = freshRun();
    must(state, { type: 'abandon' });
    expect(state.ending?.id).toBe('walkedAway');
    expect(applyInPlace(state, content, { type: 'endTurn' })).toBe('ended');
    expect(applyInPlace(state, content, { type: 'performAction', action: 'writeValues' })).toBe(
      'ended',
    );
  });

  it('pays investors their money back first when the exit is small', () => {
    const state = freshRun({ cofounder: null });
    state.capTable = [
      { holder: 'founder', bps: 8000 },
      { holder: 'inv:hollowpine', bps: 2000 },
    ];
    state.rounds = [
      { month: 0, investor: 'hollowpine', amount: 2_000_000, bps: 2000, preMoney: 8_000_000 },
    ];
    expect(founderProceeds(state, 3_000_000)).toBe(1_000_000);
    expect(founderProceeds(state, 1_500_000)).toBe(0);
    expect(founderProceeds(state, 20_000_000)).toBe(16_000_000);
  });

  it('reaching Scale-up ends the run with a success', () => {
    const state = launchedCompany();
    state.stage = 'startup';
    for (let i = 0; i < 30; i++) state.team.push(employee({ salary: 50_000 }));
    state.stats.users = 12_000;
    state.stats.cash = 50_000_000;
    nextMonth(state);
    expect(state.ending?.id).toBe('reachedScaleup');
    expect(state.ending?.netWorth).toBeGreaterThan(0);
    expect(content.endings.get(state.ending!.id)?.kind).toBe('success');
  });

  it('runs out of time at year fifteen', () => {
    const state = launchedCompany();
    state.month = content.rules.maxMonths - 1;
    endTurn(state, content);
    expect(state.ending?.id).toBe('lifestyleBusiness');
  });
});

describe('stages', () => {
  it('moves from Garage to Startup once the entry rule is met', () => {
    const state = launchedCompany();
    for (let i = 0; i < 3; i++) state.team.push(employee());
    state.flags.pricedRound = 1;
    nextMonth(state);
    expect(state.stage).toBe('startup');
    expect(state.timeline.some((t) => t.key === 'timeline.stageReached')).toBe(true);
  });

  it('stays in Garage while the team is small', () => {
    const state = launchedCompany();
    state.flags.pricedRound = 1;
    nextMonth(state);
    expect(state.stage).toBe('garage');
  });
});

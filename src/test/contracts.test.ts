import { describe, it, expect } from 'vitest';
import { integrationBus, FlipTimerStateBroadcast } from '../core/contracts/integrationContracts';

describe('Cross-Platform Integration Contracts Unit Tests', () => {
  it('dispatches FlipTimer broadcasts to subscribers', () => {
    let received: any = null;
    const unsub = integrationBus.subscribe('FLIP_TIMER', (data) => {
      received = data;
    });

    const payload: FlipTimerStateBroadcast = {
      type: 'FLIP_TIMER_STATE',
      mode: 'pomodoro',
      status: 'running',
      timeRemaining: 1200,
      totalDuration: 1500,
      flipDigits: {
        hoursTens: 0,
        hoursUnits: 0,
        minutesTens: 2,
        minutesUnits: 0,
        secondsTens: 0,
        secondsUnits: 0,
      },
    };

    integrationBus.emitFlipTimerBroadcast(payload);

    expect(received).toEqual(payload);
    unsub();
  });

  it('dispatches Prep OS study log event with subject tag', () => {
    let received: any = null;
    const unsub = integrationBus.subscribe('PREP_OS_EVENT', (data) => {
      received = data;
    });

    integrationBus.emitPrepOSSession(
      {
        id: 'sess_123',
        startedAt: Date.now() - 1500000,
        endedAt: Date.now(),
        durationSeconds: 1500,
        mode: 'pomodoro',
        subjectTag: 'RBI-Management',
        completedSuccessfully: true,
      },
      'RBI_PREP_OS'
    );

    expect(received).not.toBeNull();
    expect(received.targetSystem).toBe('RBI_PREP_OS');
    expect(received.payload.subjectTag).toBe('RBI-Management');
    expect(received.payload.durationMinutes).toBe(25);
    unsub();
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TimerEngine } from '../core/timer/timerEngine';

describe('TimerEngine Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default pomodoro duration (25 mins = 1500s)', () => {
    const engine = new TimerEngine();
    const state = engine.getState();
    expect(state.mode).toBe('pomodoro');
    expect(state.status).toBe('idle');
    expect(state.timeRemaining).toBe(1500);
    expect(state.totalDuration).toBe(1500);
  });

  it('starts, updates time, and pauses correctly', () => {
    const engine = new TimerEngine();
    engine.start();

    expect(engine.getState().status).toBe('running');

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);
    // Trigger tick
    engine['reconcileWithWallClock'](Date.now() + 10000);

    engine.pause();
    expect(engine.getState().status).toBe('paused');
    expect(engine.getState().timeRemaining).toBeLessThanOrEqual(1490);
  });

  it('resets timer back to initial idle duration', () => {
    const engine = new TimerEngine();
    engine.start();
    vi.advanceTimersByTime(5000);
    engine['reconcileWithWallClock'](Date.now() + 5000);

    engine.reset();
    const state = engine.getState();
    expect(state.status).toBe('idle');
    expect(state.timeRemaining).toBe(1500);
    expect(state.elapsedSeconds).toBe(0);
  });

  it('switches modes correctly (pomodoro -> shortBreak -> stopwatch)', () => {
    const engine = new TimerEngine();
    engine.setMode('shortBreak');
    expect(engine.getState().mode).toBe('shortBreak');
    expect(engine.getState().timeRemaining).toBe(300); // 5 mins

    engine.setMode('stopwatch');
    expect(engine.getState().mode).toBe('stopwatch');
    expect(engine.getState().timeRemaining).toBe(0);
  });

  it('handles completion and auto-cycles to short break', () => {
    const engine = new TimerEngine({ pomodoroWork: 10, shortBreak: 5 });
    let completedFired = false;
    engine.subscribe('completed', () => {
      completedFired = true;
    });

    engine.start();
    // Simulate target reached
    engine['reconcileWithWallClock'](Date.now() + 11000);

    expect(completedFired).toBe(true);
    expect(engine.getState().mode).toBe('shortBreak');
    expect(engine.getState().timeRemaining).toBe(5);
  });
});

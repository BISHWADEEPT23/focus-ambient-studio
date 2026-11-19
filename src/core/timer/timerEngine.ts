import { TimerConfig, TimerMode, TimerState } from '../../types';
import { WorkerTimerProvider } from './workerTimer';

export type TimerEvent = 'tick' | 'stateChange' | 'completed' | 'modeChange';
export type TimerListener = (state: TimerState) => void;

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  pomodoroWork: 25 * 60, // 25 mins
  shortBreak: 5 * 60,    // 5 mins
  longBreak: 15 * 60,    // 15 mins
  longBreakInterval: 4,
  countdownTarget: 60 * 60, // 60 mins
  animedoroWork: 50 * 60,   // 50 mins
  animedoroBreak: 20 * 60,  // 20 mins
  autoStartBreaks: false,
  autoStartPomodoros: false,
  chimeSound: true,
};

export class TimerEngine {
  private config: TimerConfig;
  private state: TimerState;
  private listeners: Map<TimerEvent, Set<TimerListener>> = new Map();
  private timerProvider: WorkerTimerProvider;

  constructor(initialConfig?: Partial<TimerConfig>, initialState?: Partial<TimerState>) {
    this.config = { ...DEFAULT_TIMER_CONFIG, ...initialConfig };
    
    const initialMode: TimerMode = initialState?.mode ?? 'pomodoro';
    const initialDuration = this.getDurationForMode(initialMode);

    this.state = {
      mode: initialMode,
      status: 'idle',
      timeRemaining: initialDuration,
      totalDuration: initialDuration,
      elapsedSeconds: 0,
      completedCycles: 0,
      ...initialState,
    };

    this.timerProvider = new WorkerTimerProvider((timestamp) => this.handleTick(timestamp), 250);

    // Visibility change handler for immediate reconciliation on tab wake
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.state.status === 'running') {
          this.reconcileWithWallClock(Date.now());
        }
      });
    }
  }

  public getDurationForMode(mode: TimerMode): number {
    switch (mode) {
      case 'pomodoro':
        return this.config.pomodoroWork;
      case 'shortBreak':
        return this.config.shortBreak;
      case 'longBreak':
        return this.config.longBreak;
      case 'countdown':
        return this.config.countdownTarget;
      case 'animedoro':
        return this.config.animedoroWork;
      case 'stopwatch':
        return 0; // Stopwatch starts at 0 and counts up
      case 'custom':
        return this.state?.totalDuration || 25 * 60;
      default:
        return 25 * 60;
    }
  }

  public getState(): Readonly<TimerState> {
    return { ...this.state };
  }

  public getConfig(): Readonly<TimerConfig> {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (this.state.status === 'idle') {
      const dur = this.getDurationForMode(this.state.mode);
      this.state.totalDuration = dur;
      this.state.timeRemaining = dur;
      this.notify('stateChange');
    }
  }

  public start(): void {
    if (this.state.status === 'running') return;

    const now = Date.now();
    this.state.status = 'running';
    this.state.startedAt = this.state.startedAt ?? now;
    this.state.lastTickTimestamp = now;

    if (this.state.mode !== 'stopwatch') {
      // Set absolute target end time
      this.state.targetEndTime = now + this.state.timeRemaining * 1000;
    }

    this.timerProvider.start();
    this.notify('stateChange');
  }

  public pause(): void {
    if (this.state.status !== 'running') return;

    this.reconcileWithWallClock(Date.now());
    this.state.status = 'paused';
    this.timerProvider.stop();
    this.notify('stateChange');
  }

  public reset(): void {
    this.timerProvider.stop();
    const duration = this.getDurationForMode(this.state.mode);
    this.state = {
      ...this.state,
      status: 'idle',
      timeRemaining: duration,
      totalDuration: duration,
      elapsedSeconds: 0,
      startedAt: undefined,
      targetEndTime: undefined,
      lastTickTimestamp: undefined,
    };
    this.notify('stateChange');
  }

  public setMode(mode: TimerMode, customDuration?: number): void {
    this.timerProvider.stop();
    const duration = customDuration ?? this.getDurationForMode(mode);
    this.state = {
      ...this.state,
      mode,
      status: 'idle',
      totalDuration: duration,
      timeRemaining: duration,
      elapsedSeconds: 0,
      startedAt: undefined,
      targetEndTime: undefined,
      lastTickTimestamp: undefined,
    };
    this.notify('modeChange');
    this.notify('stateChange');
  }

  public setActiveTaskId(taskId?: string): void {
    this.state.activeTaskId = taskId;
    this.notify('stateChange');
  }

  private handleTick(timestamp: number): void {
    if (this.state.status !== 'running') return;
    this.reconcileWithWallClock(timestamp);
  }

  private reconcileWithWallClock(now: number): void {
    if (this.state.mode === 'stopwatch') {
      const start = this.state.startedAt ?? now;
      const elapsed = Math.max(0, Math.floor((now - start) / 1000));
      this.state.elapsedSeconds = elapsed;
      this.state.timeRemaining = elapsed;
      this.notify('tick');
      return;
    }

    if (this.state.targetEndTime) {
      const remainingMs = this.state.targetEndTime - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      this.state.timeRemaining = remainingSec;
      this.state.elapsedSeconds = Math.max(0, this.state.totalDuration - remainingSec);
      this.state.lastTickTimestamp = now;

      this.notify('tick');

      if (remainingSec <= 0) {
        this.handleSessionCompletion();
      }
    }
  }

  private handleSessionCompletion(): void {
    this.timerProvider.stop();
    this.state.status = 'completed';
    this.state.timeRemaining = 0;
    this.state.elapsedSeconds = this.state.totalDuration;

    // Cycle handling for Pomodoro
    if (this.state.mode === 'pomodoro') {
      this.state.completedCycles += 1;
    }

    this.notify('completed');
    this.notify('stateChange');

    // Auto-transition to next interval
    this.autoTransitionNext();
  }

  private autoTransitionNext(): void {
    let nextMode: TimerMode = 'pomodoro';

    if (this.state.mode === 'pomodoro') {
      if (this.state.completedCycles % this.config.longBreakInterval === 0) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'shortBreak';
      }
    } else if (this.state.mode === 'shortBreak' || this.state.mode === 'longBreak') {
      nextMode = 'pomodoro';
    } else if (this.state.mode === 'animedoro') {
      // Alternates between animedoro focus and animedoro break
      if (this.state.totalDuration === this.config.animedoroWork) {
        this.setMode('animedoro', this.config.animedoroBreak);
        if (this.config.autoStartBreaks) this.start();
        return;
      } else {
        this.setMode('animedoro', this.config.animedoroWork);
        if (this.config.autoStartPomodoros) this.start();
        return;
      }
    } else {
      // Countdown / Stopwatch don't auto-loop
      return;
    }

    this.setMode(nextMode);

    const shouldAutoStart = 
      (nextMode === 'shortBreak' || nextMode === 'longBreak') 
        ? this.config.autoStartBreaks 
        : this.config.autoStartPomodoros;

    if (shouldAutoStart) {
      this.start();
    }
  }

  public subscribe(event: TimerEvent, listener: TimerListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private notify(event: TimerEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(this.getState());
        } catch (err) {
          console.error(`Error in timer listener for event ${event}:`, err);
        }
      }
    }
  }

  public destroy(): void {
    this.timerProvider.destroy();
    this.listeners.clear();
  }
}

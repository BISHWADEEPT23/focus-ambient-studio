/**
 * StudyFlipTimerAdapter.ts
 * Bi-directional event emitter and state broadcaster for the mechanical flip timer display.
 * Bridges the core TimerEngine with hardware flip clocks, companion displays, and external iframes.
 */

import { TimerEngine } from '../core/timer/timerEngine';
import { TimerMode, TimerState } from '../types';
import {
  FlipTimerStateBroadcast,
  IntegrationEventBus,
  integrationBus,
} from '../core/contracts/integrationContracts';

export type FlipTimerCommandType =
  | 'START_TIMER'
  | 'PAUSE_TIMER'
  | 'RESET_TIMER'
  | 'TOGGLE_TIMER'
  | 'SET_MODE'
  | 'SET_DURATION'
  | 'SET_TASK'
  | 'SYNC_STATE';

export interface FlipTimerInboundCommand {
  type: FlipTimerCommandType;
  mode?: TimerMode;
  durationSeconds?: number;
  taskId?: string;
  source?: string;
}

export type BroadcastListener = (broadcast: FlipTimerStateBroadcast) => void;
export type InboundCommandListener = (command: FlipTimerInboundCommand) => void;

export interface FlipTimerDigitDecomposition {
  hoursTens: number;
  hoursUnits: number;
  minutesTens: number;
  minutesUnits: number;
  secondsTens: number;
  secondsUnits: number;
}

export class StudyFlipTimerAdapter {
  private timerEngine?: TimerEngine;
  private unsubscribeTimer?: () => void;
  private broadcastListeners: Set<BroadcastListener> = new Set();
  private commandListeners: Set<InboundCommandListener> = new Set();
  private bus: IntegrationEventBus;
  private windowMessageHandler?: (event: MessageEvent) => void;
  private lastBroadcast?: FlipTimerStateBroadcast;

  constructor(timerEngine?: TimerEngine, bus: IntegrationEventBus = integrationBus) {
    this.bus = bus;

    if (timerEngine) {
      this.attach(timerEngine);
    }

    this.setupWindowListener();
  }

  /**
   * Decomposes total seconds into 6 individual flip digit components (HH:MM:SS)
   */
  public calculateFlipDigits(totalSeconds: number): FlipTimerDigitDecomposition {
    const clamped = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(clamped / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const seconds = clamped % 60;

    return {
      hoursTens: Math.floor(hours / 10) % 10,
      hoursUnits: hours % 10,
      minutesTens: Math.floor(minutes / 10),
      minutesUnits: minutes % 10,
      secondsTens: Math.floor(seconds / 10),
      secondsUnits: seconds % 10,
    };
  }

  /**
   * Converts a TimerState to a FlipTimerStateBroadcast schema
   */
  public createBroadcastPayload(state: TimerState): FlipTimerStateBroadcast {
    const displaySeconds = state.mode === 'stopwatch' ? state.elapsedSeconds : state.timeRemaining;
    const flipDigits = this.calculateFlipDigits(displaySeconds);

    return {
      type: 'FLIP_TIMER_STATE',
      mode: state.mode,
      status: state.status,
      timeRemaining: state.timeRemaining,
      totalDuration: state.totalDuration,
      flipDigits,
    };
  }

  /**
   * Broadcasts the current timer state over the IntegrationEventBus and window message bus
   */
  public broadcastTimerState(state: TimerState): FlipTimerStateBroadcast {
    const broadcast = this.createBroadcastPayload(state);
    this.lastBroadcast = broadcast;

    // Dispatch via standard bus
    this.bus.emitFlipTimerBroadcast(broadcast);

    // Dispatch to local subscribers
    for (const listener of this.broadcastListeners) {
      try {
        listener(broadcast);
      } catch (err) {
        console.error('Error in FlipTimer broadcast listener:', err);
      }
    }

    return broadcast;
  }

  /**
   * Returns the last broadcast state
   */
  public getLastBroadcast(): FlipTimerStateBroadcast | undefined {
    return this.lastBroadcast;
  }

  /**
   * Attaches to an active TimerEngine instance and sets up bidirectional event flow
   */
  public attach(timerEngine: TimerEngine): () => void {
    if (this.timerEngine) {
      this.detach();
    }

    this.timerEngine = timerEngine;

    // Listen to timer ticks, state changes, mode changes, and completion
    const unTick = timerEngine.subscribe('tick', (state) => this.broadcastTimerState(state));
    const unState = timerEngine.subscribe('stateChange', (state) => this.broadcastTimerState(state));
    const unMode = timerEngine.subscribe('modeChange', (state) => this.broadcastTimerState(state));
    const unComplete = timerEngine.subscribe('completed', (state) => {
      this.broadcastTimerState(state);
      this.dispatchIntervalEndEvent(state);
    });

    this.unsubscribeTimer = () => {
      unTick();
      unState();
      unMode();
      unComplete();
    };

    // Initial broadcast of attached timer's state
    this.broadcastTimerState(timerEngine.getState());

    return () => this.detach();
  }

  /**
   * Detaches from current TimerEngine
   */
  public detach(): void {
    if (this.unsubscribeTimer) {
      this.unsubscribeTimer();
      this.unsubscribeTimer = undefined;
    }
    this.timerEngine = undefined;
  }

  /**
   * Handles inbound commands from external flip displays / companion devices
   */
  public handleInboundCommand(command: FlipTimerInboundCommand): void {
    // Notify registered command subscribers
    for (const listener of this.commandListeners) {
      try {
        listener(command);
      } catch (err) {
        console.error('Error in inbound command listener:', err);
      }
    }

    // Execute directly on attached TimerEngine if available
    if (!this.timerEngine) {
      return;
    }

    switch (command.type) {
      case 'START_TIMER':
        this.timerEngine.start();
        break;
      case 'PAUSE_TIMER':
        this.timerEngine.pause();
        break;
      case 'RESET_TIMER':
        this.timerEngine.reset();
        break;
      case 'TOGGLE_TIMER': {
        const state = this.timerEngine.getState();
        if (state.status === 'running') {
          this.timerEngine.pause();
        } else {
          this.timerEngine.start();
        }
        break;
      }
      case 'SET_MODE':
        if (command.mode) {
          this.timerEngine.setMode(command.mode, command.durationSeconds);
        }
        break;
      case 'SET_DURATION':
        if (typeof command.durationSeconds === 'number' && command.durationSeconds > 0) {
          const currentMode = this.timerEngine.getState().mode;
          this.timerEngine.setMode(currentMode, command.durationSeconds);
        }
        break;
      case 'SET_TASK':
        this.timerEngine.setActiveTaskId(command.taskId);
        break;
      case 'SYNC_STATE':
        this.broadcastTimerState(this.timerEngine.getState());
        break;
      default:
        console.warn(`Unknown inbound FlipTimer command: ${(command as any).type}`);
    }
  }

  /**
   * Subscribes to outbound flip timer state broadcasts
   */
  public onBroadcast(listener: BroadcastListener): () => void {
    this.broadcastListeners.add(listener);
    return () => {
      this.broadcastListeners.delete(listener);
    };
  }

  /**
   * Subscribes to inbound commands received by this adapter
   */
  public onCommand(listener: InboundCommandListener): () => void {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  /**
   * Dispatches interval end event
   */
  private dispatchIntervalEndEvent(state: TimerState): void {
    const payload = {
      event: 'ON_INTERVAL_END',
      mode: state.mode,
      completedCycles: state.completedCycles,
      timestamp: Date.now(),
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocus_interval_end', { detail: payload }));
      window.postMessage({ source: 'FLOCUS_ENGINE', ...payload }, '*');
    }
  }

  /**
   * Listens for inbound window.postMessage events targeting the flip timer
   */
  private setupWindowListener(): void {
    if (typeof window === 'undefined') return;

    this.windowMessageHandler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // Match commands with source 'STUDY_FLIP_TIMER' or type 'STUDY_FLIP_COMMAND'
      if (data.source === 'STUDY_FLIP_TIMER' && data.command) {
        this.handleInboundCommand(data.command);
      } else if (data.type === 'STUDY_FLIP_COMMAND' && data.payload) {
        this.handleInboundCommand(data.payload);
      }
    };

    window.addEventListener('message', this.windowMessageHandler);
  }

  /**
   * Cleans up all event listeners and detaches from timer
   */
  public destroy(): void {
    this.detach();
    this.broadcastListeners.clear();
    this.commandListeners.clear();

    if (typeof window !== 'undefined' && this.windowMessageHandler) {
      window.removeEventListener('message', this.windowMessageHandler);
      this.windowMessageHandler = undefined;
    }
  }
}

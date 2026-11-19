/**
 * Cross-Platform Integration Contracts for Focus & Ambient Engine.
 * Formal event schemas, message bus contracts, and adapter specifications.
 */

import { FocusSessionLog, TimerMode } from '../../types';

export interface FlipTimerStateBroadcast {
  type: 'FLIP_TIMER_STATE';
  mode: TimerMode;
  status: 'idle' | 'running' | 'paused' | 'completed';
  timeRemaining: number;
  totalDuration: number;
  flipDigits: {
    hoursTens: number;
    hoursUnits: number;
    minutesTens: number;
    minutesUnits: number;
    secondsTens: number;
    secondsUnits: number;
  };
}

export interface PrepOSStudyLogEvent {
  type: 'PREP_OS_STUDY_LOG';
  targetSystem: 'UPSC_PREP_OS' | 'RBI_PREP_OS' | 'PERSONAL_INTEL_OS';
  payload: {
    sessionId: string;
    subjectTag: string;
    syllabusModule?: string;
    durationMinutes: number;
    completedAt: number;
    studyIntensityRating?: 1 | 2 | 3 | 4 | 5;
  };
}

export interface AndroidComposeBridgeContract {
  command: 'UPDATE_MEDIA_NOTIFICATION' | 'ACQUIRE_WAKELOCK' | 'RELEASE_WAKELOCK' | 'TRIGGER_HAPTIC';
  params?: Record<string, any>;
}

export interface DesktopTauriContract {
  event: 'WINDOW_MINIMIZE' | 'WINDOW_MAXIMIZE' | 'WINDOW_CLOSE' | 'SET_ALWAYS_ON_TOP';
  alwaysOnTop?: boolean;
}

export class IntegrationEventBus {
  private static instance: IntegrationEventBus;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  public static getInstance(): IntegrationEventBus {
    if (!IntegrationEventBus.instance) {
      IntegrationEventBus.instance = new IntegrationEventBus();
    }
    return IntegrationEventBus.instance;
  }

  public emitFlipTimerBroadcast(state: FlipTimerStateBroadcast): void {
    this.dispatch('FLIP_TIMER', state);
    if (typeof window !== 'undefined') {
      window.postMessage({ source: 'FLOCUS_ENGINE', ...state }, '*');
    }
  }

  public emitPrepOSSession(session: FocusSessionLog, target: 'UPSC_PREP_OS' | 'RBI_PREP_OS'): void {
    const event: PrepOSStudyLogEvent = {
      type: 'PREP_OS_STUDY_LOG',
      targetSystem: target,
      payload: {
        sessionId: session.id,
        subjectTag: session.subjectTag || (target === 'UPSC_PREP_OS' ? 'GS-General' : 'Finance-General'),
        durationMinutes: Math.round(session.durationSeconds / 60),
        completedAt: session.endedAt,
      },
    };

    this.dispatch('PREP_OS_EVENT', event);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('prep_os_study_log', { detail: event }));
    }
  }

  public subscribe(channel: string, listener: (data: any) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);
    return () => {
      this.listeners.get(channel)?.delete(listener);
    };
  }

  private dispatch(channel: string, data: any): void {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      for (const listener of channelListeners) {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error in integration listener on channel ${channel}:`, e);
        }
      }
    }
  }
}

export const integrationBus = IntegrationEventBus.getInstance();

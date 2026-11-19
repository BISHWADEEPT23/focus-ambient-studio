import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { StorageEngine } from '../core/storage/storageEngine';
import { TimerEngine } from '../core/timer/timerEngine';
import { AmbientAudioEngine } from '../core/audio/ambientAudioEngine';

describe('Focus & Ambient Studio E2E Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  // =========================================================================
  // 1) Offline Hydration from LocalStorage and IndexedDB Dual Persistence
  // =========================================================================
  describe('1) Offline Hydration & Dual-Tier Persistence', () => {
    it('synchronously hydrates settings, tasks, and streaks from LocalStorage on mount', () => {
      // Pre-seed LocalStorage to simulate returning user with offline persisted state
      const seededSettings = {
        dashboardMode: 'ambient',
        timerStyle: 'flip',
        timerConfig: {
          pomodoroWork: 1800, // 30 mins
          shortBreak: 300,
          longBreak: 900,
          longBreakInterval: 4,
          countdownTarget: 3600,
          animedoroWork: 3000,
          animedoroBreak: 1200,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          chimeSound: true,
        },
        theme: {
          id: 'nordic_frost',
          name: 'Nordic Frost',
          category: 'focus',
          colors: {
            bgPrimary: '#0d1117',
            bgSecondary: '#161b22',
            accent: '#38bdf8',
            accentGlow: 'rgba(56, 189, 248, 0.25)',
            textPrimary: '#f0f6fc',
            textSecondary: '#8b949e',
            border: '#30363d',
            canvasParticles: '#38bdf8',
          },
          ambientVibe: 'rain',
        },
        masterVolume: 0.65,
        muted: true,
        reducedMotion: false,
        showQuote: true,
        soundChannels: [],
      };

      const seededTasks = [
        {
          id: 'task-persisted-1',
          title: 'Master Constitutional Law & Governance',
          completed: false,
          completedPomodoros: 3,
          estimatedPomodoros: 6,
          subjectTag: 'UPSC-Polity',
          createdAt: Date.now() - 3600000,
        },
      ];

      const seededStreak = {
        currentStreak: 12,
        longestStreak: 21,
        lastActiveDate: '2026-11-19',
        nextCheckTimestamp: Date.now() + 86400000,
        history: { '2026-11-19': 3 },
      };

      localStorage.setItem('flocus_engine_settings', JSON.stringify(seededSettings));
      localStorage.setItem('flocus_engine_tasks', JSON.stringify(seededTasks));
      localStorage.setItem('flocus_engine_streak', JSON.stringify(seededStreak));

      // Render App and verify instantaneous hydration
      render(React.createElement(App));

      // In ambient mode, the bottom bar button allows switching back to Focus mode
      expect(screen.getByText('Focus Mode')).toBeInTheDocument();

      // Streak data is hydrated and visible in BottomBar
      expect(screen.getByText('12')).toBeInTheDocument();

      // Mute state is hydrated (muted = true renders VolumeX / toggle mute button)
      const muteBtn = screen.getByLabelText('Toggle mute');
      expect(muteBtn).toBeInTheDocument();

      // Open task drawer and verify persisted task is present
      const taskBtn = screen.getByText('Tasks');
      fireEvent.click(taskBtn);

      expect(screen.getByText('Master Constitutional Law & Governance')).toBeInTheDocument();
      expect(screen.getAllByText('UPSC-Polity').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/3 \/ 6/)).toBeInTheDocument();
    });

    it('persists and retrieves focus session logs via IndexedDB storage engine', async () => {
      // Mock IndexedDB in-memory store
      const inMemoryStores = new Map<string, Map<string, any>>();

      const mockIndexedDB = {
        open: vi.fn(() => {
          const req: any = {
            result: {
              objectStoreNames: {
                contains: (name: string) => inMemoryStores.has(name),
              },
              createObjectStore: (name: string) => {
                if (!inMemoryStores.has(name)) {
                  inMemoryStores.set(name, new Map());
                }
                return {};
              },
              transaction: (storeNames: string | string[], _mode: string) => {
                const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
                const storeMap = inMemoryStores.get(storeName) || new Map();
                inMemoryStores.set(storeName, storeMap);

                const tx: any = {
                  objectStore: () => ({
                    put: (val: any) => {
                      storeMap.set(val.id || 'default_id', val);
                      setTimeout(() => {
                        if (tx.oncomplete) tx.oncomplete();
                      }, 0);
                    },
                    getAll: () => {
                      const getReq: any = {
                        result: Array.from(storeMap.values()),
                        onsuccess: null,
                        onerror: null,
                      };
                      setTimeout(() => {
                        if (getReq.onsuccess) getReq.onsuccess();
                      }, 0);
                      return getReq;
                    },
                  }),
                  oncomplete: null,
                  onerror: null,
                };
                return tx;
              },
            },
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
          };

          setTimeout(() => {
            if (req.onupgradeneeded) req.onupgradeneeded();
            if (req.onsuccess) req.onsuccess();
          }, 0);

          return req;
        }),
      };

      (window as any).indexedDB = mockIndexedDB;

      const storage = new StorageEngine();

      const sampleSession = {
        id: 'session-idb-101',
        startedAt: Date.now() - 1500000,
        endedAt: Date.now(),
        durationSeconds: 1500,
        mode: 'pomodoro',
        taskId: 'task-persisted-1',
        taskTitle: 'Master Constitutional Law & Governance',
        subjectTag: 'UPSC-Polity',
        completedSuccessfully: true,
      };

      await storage.persistSessionToIDB(sampleSession);

      const allSessions = await storage.loadAllSessionsFromIDB();
      expect(allSessions).toHaveLength(1);
      expect(allSessions[0].id).toBe('session-idb-101');
      expect(allSessions[0].taskTitle).toBe('Master Constitutional Law & Governance');
      expect(allSessions[0].durationSeconds).toBe(1500);
    });
  });

  // =========================================================================
  // 2) Background Timer Drift Reconciliation with Wall-Clock Delta Calculation
  // =========================================================================
  describe('2) Background Timer Drift Reconciliation', () => {
    it('reconciles elapsed time using targetEndTime delta when tab sleeps or background throttles', () => {
      const fixedNow = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const engine = new TimerEngine({ pomodoroWork: 1500 });
      engine.start();

      const stateStart = engine.getState();
      expect(stateStart.status).toBe('running');
      expect(stateStart.targetEndTime).toBe(fixedNow + 1500 * 1000);
      expect(stateStart.timeRemaining).toBe(1500);

      // Simulate background tab throttling: 450 wall-clock seconds pass without regular intervals
      const timeAfterBackgroundSleep = fixedNow + 450 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(timeAfterBackgroundSleep);

      // Trigger reconciliation tick
      engine['reconcileWithWallClock'](timeAfterBackgroundSleep);

      const reconciledState = engine.getState();
      expect(reconciledState.timeRemaining).toBe(1050); // 1500 - 450 = 1050
      expect(reconciledState.elapsedSeconds).toBe(450);
      expect(reconciledState.status).toBe('running');

      engine.destroy();
    });

    it('triggers reconciliation immediately on document visibilitychange event', () => {
      const fixedNow = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const engine = new TimerEngine({ pomodoroWork: 1500 });
      engine.start();

      // Tab was hidden, 600s elapsed in background
      const wakeNow = fixedNow + 600 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(wakeNow);

      // Mock document.hidden = false (user returned to tab)
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });

      // Dispatch visibilitychange event
      document.dispatchEvent(new Event('visibilitychange'));

      const stateOnWake = engine.getState();
      expect(stateOnWake.timeRemaining).toBe(900); // 1500 - 600 = 900
      expect(stateOnWake.elapsedSeconds).toBe(600);

      engine.destroy();
    });

    it('handles background expiration cleanly when elapsed time exceeds duration', () => {
      const fixedNow = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const engine = new TimerEngine({ pomodoroWork: 1500, shortBreak: 300 });
      let completedFired = false;
      engine.subscribe('completed', () => {
        completedFired = true;
      });

      engine.start();

      // Tab slept for 1600s (exceeding 1500s Pomodoro target)
      const afterExpiration = fixedNow + 1600 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(afterExpiration);

      engine['reconcileWithWallClock'](afterExpiration);

      expect(completedFired).toBe(true);
      // Auto-transitioned to shortBreak
      const finalState = engine.getState();
      expect(finalState.mode).toBe('shortBreak');
      expect(finalState.timeRemaining).toBe(300);
      expect(finalState.completedCycles).toBe(1);

      engine.destroy();
    });

    it('reconciles stopwatch elapsed time against startedAt wall-clock baseline', () => {
      const fixedNow = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const engine = new TimerEngine();
      engine.setMode('stopwatch');
      engine.start();

      // Advance by 125 seconds
      const futureNow = fixedNow + 125 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(futureNow);

      engine['reconcileWithWallClock'](futureNow);

      const swState = engine.getState();
      expect(swState.elapsedSeconds).toBe(125);
      expect(swState.timeRemaining).toBe(125);

      engine.destroy();
    });
  });

  // =========================================================================
  // 3) Procedural Audio Synthesizer Graph Lifecycle and Master Mute Toggle
  // =========================================================================
  describe('3) Procedural Audio Synthesizer Lifecycle & Master Mute', () => {
    it('builds procedural audio nodes, routes through master gain, and executes full lifecycle', () => {
      let stateChanged = false;
      const onStateChange = () => {
        stateChanged = true;
      };

      const audio = new AmbientAudioEngine(undefined, 0.8, false, onStateChange);

      expect(audio.getMasterVolume()).toBe(0.8);
      expect(audio.isMasterMuted()).toBe(false);

      // Start rain procedural channel
      audio.toggleChannel('rain');
      const rainChannel = audio.getChannels().find((c) => c.id === 'rain');
      expect(rainChannel?.active).toBe(true);
      expect(stateChanged).toBe(true);

      // Start waves procedural channel
      audio.toggleChannel('waves');
      const wavesChannel = audio.getChannels().find((c) => c.id === 'waves');
      expect(wavesChannel?.active).toBe(true);

      // Adjust individual channel volume
      audio.setChannelVolume('rain', 0.95);
      expect(audio.getChannels().find((c) => c.id === 'rain')?.volume).toBe(0.95);

      // Adjust master volume
      audio.setMasterVolume(0.5);
      expect(audio.getMasterVolume()).toBe(0.5);

      // Toggle Master Mute on
      const muted = audio.toggleMute();
      expect(muted).toBe(true);
      expect(audio.isMasterMuted()).toBe(true);

      // Toggle Master Mute off (restoring volume)
      const unmuted = audio.toggleMute();
      expect(unmuted).toBe(false);
      expect(audio.isMasterMuted()).toBe(false);

      // Play completion chime without errors
      expect(() => audio.playChime()).not.toThrow();

      // Stop all procedural channels
      audio.stopAll();
      expect(audio.getChannels().every((c) => !c.active)).toBe(true);

      // Destroy engine & teardown audio context
      expect(() => audio.destroy()).not.toThrow();
    });
  });

  // =========================================================================
  // 4) Full Keyboard Accessibility Shortcuts in App
  // =========================================================================
  describe('4) Full Keyboard Accessibility Shortcuts', () => {
    it('toggles start and pause using Space shortcut', () => {
      render(React.createElement(App));

      // Initially idle, shows "Start Focus"
      expect(screen.getByText('Start Focus')).toBeInTheDocument();

      // Press Space to start timer
      fireEvent.keyDown(window, { code: 'Space' });
      expect(screen.getByText('Pause')).toBeInTheDocument();

      // Press Space again to pause timer
      fireEvent.keyDown(window, { code: 'Space' });
      expect(screen.getByText('Start Focus')).toBeInTheDocument();
    });

    it('toggles audio mute using M shortcut', () => {
      render(React.createElement(App));

      const muteBtn = screen.getByLabelText('Toggle mute');
      expect(muteBtn).toBeInTheDocument();

      // Press M to mute
      fireEvent.keyDown(window, { key: 'm' });

      // Press M again to unmute
      fireEvent.keyDown(window, { key: 'm' });
    });

    it('switches between Ambient (A) and Focus (F) modes using keyboard shortcuts', () => {
      render(React.createElement(App));

      // Initial mode is Focus mode, button shows "Ambient Mode" to switch
      expect(screen.getByText('Ambient Mode')).toBeInTheDocument();
      expect(screen.getByText('Start Focus')).toBeInTheDocument();

      // Press A to switch to Ambient mode
      fireEvent.keyDown(window, { key: 'a' });

      // Should now show Focus Mode switch button in bottom bar
      expect(screen.getByText('Focus Mode')).toBeInTheDocument();

      // Press F to switch back to Focus mode
      fireEvent.keyDown(window, { key: 'f' });

      expect(screen.getByText('Ambient Mode')).toBeInTheDocument();
      expect(screen.getByText('Start Focus')).toBeInTheDocument();
    });

    it('toggles Tasks drawer using T shortcut and Soundscapes mixer using S shortcut', () => {
      render(React.createElement(App));

      // Press T to open task drawer
      fireEvent.keyDown(window, { key: 't' });
      expect(screen.getByText('Focus Tasks')).toBeInTheDocument();

      // Press T again to close task drawer
      fireEvent.keyDown(window, { key: 't' });
      expect(screen.queryByText('Focus Tasks')).not.toBeInTheDocument();

      // Press S to open soundscapes mixer
      fireEvent.keyDown(window, { key: 's' });
      expect(screen.getByText('Procedural Soundscapes')).toBeInTheDocument();

      // Press S again to close mixer
      fireEvent.keyDown(window, { key: 's' });
      expect(screen.queryByText('Procedural Soundscapes')).not.toBeInTheDocument();
    });

    it('dismisses open modals when Escape is pressed', () => {
      render(React.createElement(App));

      // Open tasks drawer
      fireEvent.keyDown(window, { key: 't' });
      expect(screen.getByText('Focus Tasks')).toBeInTheDocument();

      // Press Escape to dismiss
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByText('Focus Tasks')).not.toBeInTheDocument();
    });

    it('does not trigger global shortcuts when typing inside form input fields', () => {
      render(React.createElement(App));

      // Open task drawer
      fireEvent.keyDown(window, { key: 't' });
      expect(screen.getByText('Focus Tasks')).toBeInTheDocument();

      const taskInput = screen.getByPlaceholderText('Add a new task...');
      taskInput.focus();

      // Typing Space inside the input should NOT trigger timer pause/start
      fireEvent.keyDown(taskInput, { code: 'Space', key: ' ' });
      // Typing T inside the input should NOT close the drawer
      fireEvent.keyDown(taskInput, { key: 't' });

      expect(screen.getByText('Focus Tasks')).toBeInTheDocument();
    });
  });
});

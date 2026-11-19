import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TimerEngine } from './core/timer/timerEngine';
import { AmbientAudioEngine } from './core/audio/ambientAudioEngine';
import { ThemeEngine, PRESET_THEMES } from './core/themes/themeEngine';
import { TaskEngine } from './core/tasks/taskEngine';
import { AnalyticsEngine } from './core/analytics/analyticsEngine';
import { globalStorage } from './core/storage/storageEngine';
import { integrationBus } from './core/contracts/integrationContracts';
import {
  AppSettings,
  DashboardMode,
  FocusSessionLog,
  SoundChannel,
  StreakData,
  TaskItem,
  TimerState,
  TimerStyle,
} from './types';
import { AmbientCanvas } from './components/AmbientCanvas';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/BottomBar';
import { TimerHero } from './components/TimerHero';
import { AmbientMiniTimer } from './components/AmbientMiniTimer';
import { AudioMixerModal } from './components/AudioMixerModal';
import { TaskDrawer } from './components/TaskDrawer';
import { AnalyticsModal } from './components/AnalyticsModal';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: AppSettings = {
  dashboardMode: 'focus',
  timerStyle: 'digital',
  timerConfig: {
    pomodoroWork: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    longBreakInterval: 4,
    countdownTarget: 60 * 60,
    animedoroWork: 50 * 60,
    animedoroBreak: 20 * 60,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    chimeSound: true,
  },
  theme: PRESET_THEMES[0],
  masterVolume: 0.8,
  muted: false,
  reducedMotion: false,
  showQuote: true,
  soundChannels: [],
};

export const App: React.FC = () => {
  const keys = globalStorage.getKeys();

  // Hydrate initial state synchronously from LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() =>
    globalStorage.loadLocalSync<AppSettings>(keys.SETTINGS, DEFAULT_SETTINGS)
  );

  const [tasks, setTasks] = useState<TaskItem[]>(() =>
    globalStorage.loadLocalSync<TaskItem[]>(keys.TASKS, [])
  );

  const [streakData, setStreakData] = useState<StreakData>(() =>
    globalStorage.loadLocalSync<StreakData>(keys.STREAK, {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      nextCheckTimestamp: new Date().setHours(24, 0, 0, 0),
      history: {},
    })
  );

  // Engine singletons wrapped in refs
  const timerEngineRef = useRef<TimerEngine | null>(null);
  const audioEngineRef = useRef<AmbientAudioEngine | null>(null);
  const themeEngineRef = useRef<ThemeEngine | null>(null);
  const taskEngineRef = useRef<TaskEngine | null>(null);
  const analyticsEngineRef = useRef<AnalyticsEngine | null>(null);

  // Active UI modal states
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Reactive state mirroring engines
  const [timerState, setTimerState] = useState<TimerState>({
    mode: 'pomodoro',
    status: 'idle',
    timeRemaining: settings.timerConfig.pomodoroWork,
    totalDuration: settings.timerConfig.pomodoroWork,
    elapsedSeconds: 0,
    completedCycles: 0,
  });

  const [soundChannels, setSoundChannels] = useState<SoundChannel[]>([]);
  const [isMuted, setIsMuted] = useState(settings.muted);
  const [masterVolume, setMasterVolume] = useState(settings.masterVolume);

  // Initialize Engines on mount
  useEffect(() => {
    // 1. Task Engine
    const taskEngine = new TaskEngine(tasks, (updated) => {
      setTasks(updated);
      globalStorage.debouncedSave(keys.TASKS, updated);
    });
    taskEngineRef.current = taskEngine;

    // 2. Analytics Engine
    const savedSessions = globalStorage.loadLocalSync<FocusSessionLog[]>(keys.SESSIONS, []);
    const analyticsEngine = new AnalyticsEngine(savedSessions, streakData, (updatedSessions, updatedStreak) => {
      setStreakData(updatedStreak);
      globalStorage.debouncedSave(keys.STREAK, updatedStreak);
      globalStorage.debouncedSave(keys.SESSIONS, updatedSessions);
    });
    analyticsEngineRef.current = analyticsEngine;

    // 3. Audio Engine
    const audioEngine = new AmbientAudioEngine(
      settings.soundChannels.length > 0 ? settings.soundChannels : undefined,
      settings.masterVolume,
      settings.muted,
      (channels, vol, muted) => {
        setSoundChannels(channels);
        setMasterVolume(vol);
        setIsMuted(muted);
        globalStorage.debouncedSave(keys.SETTINGS, {
          ...settings,
          soundChannels: channels,
          masterVolume: vol,
          muted,
        });
      }
    );
    audioEngineRef.current = audioEngine;
    setSoundChannels(audioEngine.getChannels());

    // 4. Theme Engine
    const themeEngine = new ThemeEngine(settings.theme);
    themeEngineRef.current = themeEngine;

    // 5. Timer Engine
    const timerEngine = new TimerEngine(settings.timerConfig, {
      mode: 'pomodoro',
    });
    timerEngineRef.current = timerEngine;

    timerEngine.subscribe('tick', (st) => setTimerState({ ...st }));
    timerEngine.subscribe('stateChange', (st) => {
      setTimerState({ ...st });

      // Broadcast to Flip Timer integration contract bus
      const totalSec = st.timeRemaining;
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      integrationBus.emitFlipTimerBroadcast({
        type: 'FLIP_TIMER_STATE',
        mode: st.mode,
        status: st.status,
        timeRemaining: st.timeRemaining,
        totalDuration: st.totalDuration,
        flipDigits: {
          hoursTens: Math.floor(hours / 10),
          hoursUnits: hours % 10,
          minutesTens: Math.floor(minutes / 10),
          minutesUnits: minutes % 10,
          secondsTens: Math.floor(seconds / 10),
          secondsUnits: seconds % 10,
        },
      });
    });

    timerEngine.subscribe('completed', (st) => {
      // Play completion chime
      if (settings.timerConfig.chimeSound) {
        audioEngine.playChime();
      }

      // Record to analytics
      const activeTask = taskEngine.getActiveFocusTask();
      if (st.mode === 'pomodoro' || st.mode === 'animedoro') {
        const sessionLog = analyticsEngine.logSession({
          startedAt: st.startedAt || Date.now() - st.totalDuration * 1000,
          endedAt: Date.now(),
          durationSeconds: st.totalDuration,
          mode: st.mode,
          taskId: activeTask?.id,
          taskTitle: activeTask?.title,
          subjectTag: activeTask?.subjectTag,
          completedSuccessfully: true,
        });

        // Emit Prep OS study contract event
        if (activeTask?.subjectTag?.includes('UPSC')) {
          integrationBus.emitPrepOSSession(sessionLog, 'UPSC_PREP_OS');
        } else if (activeTask?.subjectTag?.includes('RBI')) {
          integrationBus.emitPrepOSSession(sessionLog, 'RBI_PREP_OS');
        }

        // Increment task pomodoro counter
        if (activeTask) {
          taskEngine.incrementCompletedPomodoros(activeTask.id);
        }

        // Persist session to IndexedDB
        globalStorage.persistSessionToIDB(sessionLog).catch(console.warn);
      }
    });

    return () => {
      timerEngine.destroy();
      audioEngine.destroy();
    };
  }, []);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when focused on inputs or textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (timerEngineRef.current) {
          if (timerState.status === 'running') {
            timerEngineRef.current.pause();
          } else {
            timerEngineRef.current.start();
          }
        }
      } else if (e.key === 'r' || e.key === 'R') {
        timerEngineRef.current?.reset();
      } else if (e.key === 'm' || e.key === 'M') {
        audioEngineRef.current?.toggleMute();
      } else if (e.key === 'a' || e.key === 'A') {
        setSettings((prev) => {
          const next = { ...prev, dashboardMode: 'ambient' as DashboardMode };
          globalStorage.saveLocalSync(keys.SETTINGS, next);
          return next;
        });
      } else if (e.key === 'f' || e.key === 'F') {
        setSettings((prev) => {
          const next = { ...prev, dashboardMode: 'focus' as DashboardMode };
          globalStorage.saveLocalSync(keys.SETTINGS, next);
          return next;
        });
      } else if (e.key === 't' || e.key === 'T') {
        setIsTasksOpen((v) => !v);
      } else if (e.key === 's' || e.key === 'S') {
        setIsMixerOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setIsMixerOpen(false);
        setIsTasksOpen(false);
        setIsAnalyticsOpen(false);
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState.status]);

  // Active focus task helper
  const activeFocusTask = useMemo(() => {
    return tasks.find((t) => t.isCurrentFocus && !t.completed);
  }, [tasks]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => !t.completed).length;
  }, [tasks]);

  const backgroundStyle = useMemo(() => {
    return themeEngineRef.current?.getBackgroundStyle() || { background: '#07070b' };
  }, [settings.theme.id]);

  return (
    <div
      style={backgroundStyle}
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between transition-colors duration-700"
    >
      {/* Real-time Generative Ambient Canvas Background */}
      <AmbientCanvas
        sceneType={settings.theme.sceneType}
        reducedMotion={settings.reducedMotion}
      />

      {/* Background Dimming Opacity Overlay */}
      <div
        style={{
          backgroundColor: `rgba(0, 0, 0, ${settings.theme.overlayOpacity})`,
          backdropFilter: settings.theme.blurAmount > 0 ? `blur(${settings.theme.blurAmount}px)` : undefined,
        }}
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
      />

      {/* Top Header Bar */}
      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        showQuote={settings.showQuote}
      />

      {/* Main Center Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center">
        {settings.dashboardMode === 'focus' ? (
          <TimerHero
            timerState={timerState}
            timerStyle={settings.timerStyle}
            activeTask={activeFocusTask}
            onStart={() => timerEngineRef.current?.start()}
            onPause={() => timerEngineRef.current?.pause()}
            onReset={() => timerEngineRef.current?.reset()}
            onModeSelect={(m) => timerEngineRef.current?.setMode(m)}
            onToggleTimerStyle={() => {
              const nextStyle: TimerStyle = settings.timerStyle === 'digital' ? 'flip' : 'digital';
              setSettings((prev) => {
                const updated = { ...prev, timerStyle: nextStyle };
                globalStorage.saveLocalSync(keys.SETTINGS, updated);
                return updated;
              });
            }}
            onToggleTaskComplete={(id) => taskEngineRef.current?.toggleTaskCompletion(id)}
          />
        ) : (
          <AmbientMiniTimer
            timerState={timerState}
            activeTask={activeFocusTask}
            onStart={() => timerEngineRef.current?.start()}
            onPause={() => timerEngineRef.current?.pause()}
            onReset={() => timerEngineRef.current?.reset()}
            onExpandToFocus={() => {
              setSettings((prev) => {
                const next = { ...prev, dashboardMode: 'focus' as DashboardMode };
                globalStorage.saveLocalSync(keys.SETTINGS, next);
                return next;
              });
            }}
          />
        )}
      </main>

      {/* Bottom Control Bar */}
      <BottomBar
        mode={settings.dashboardMode}
        onToggleMode={() => {
          const nextMode: DashboardMode = settings.dashboardMode === 'focus' ? 'ambient' : 'focus';
          setSettings((prev) => {
            const next = { ...prev, dashboardMode: nextMode };
            globalStorage.saveLocalSync(keys.SETTINGS, next);
            return next;
          });
        }}
        soundChannels={soundChannels}
        isMuted={isMuted}
        onToggleMute={() => audioEngineRef.current?.toggleMute()}
        onOpenMixer={() => setIsMixerOpen(true)}
        onOpenTasks={() => setIsTasksOpen(true)}
        pendingTasksCount={pendingTasksCount}
        streakData={streakData}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
      />

      {/* Modals & Drawers */}
      <AudioMixerModal
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        channels={soundChannels}
        masterVolume={masterVolume}
        isMuted={isMuted}
        onToggleChannel={(id) => audioEngineRef.current?.toggleChannel(id)}
        onChannelVolumeChange={(id, v) => audioEngineRef.current?.setChannelVolume(id, v)}
        onMasterVolumeChange={(v) => audioEngineRef.current?.setMasterVolume(v)}
        onToggleMute={() => audioEngineRef.current?.toggleMute()}
        onTestChime={() => audioEngineRef.current?.playChime()}
      />

      <TaskDrawer
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        tasks={tasks}
        onAddTask={(title, priority, tag, est) => {
          taskEngineRef.current?.addTask(title, priority, tag, est);
        }}
        onToggleTask={(id) => taskEngineRef.current?.toggleTaskCompletion(id)}
        onDeleteTask={(id) => taskEngineRef.current?.deleteTask(id)}
        onSetFocusTask={(id) => taskEngineRef.current?.setFocusTask(id)}
        onAddSubtask={(id, title) => taskEngineRef.current?.addSubtask(id, title)}
        onToggleSubtask={(tId, sId) => taskEngineRef.current?.toggleSubtask(tId, sId)}
        onDeleteSubtask={(tId, sId) => taskEngineRef.current?.deleteSubtask(tId, sId)}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        streakData={streakData}
        dailyStats={analyticsEngineRef.current?.getDailyStats(7) || []}
        subjectBreakdown={analyticsEngineRef.current?.getSubjectBreakdown() || {}}
        onExportBackup={() => {
          const json = analyticsEngineRef.current?.exportBackup();
          if (json) {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `focus-ambient-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }}
        onImportBackup={(json) => {
          return analyticsEngineRef.current?.importBackup(json) ?? false;
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => {
          setSettings((prev) => {
            const updated = { ...prev, ...newVals };
            globalStorage.saveLocalSync(keys.SETTINGS, updated);
            if (newVals.timerConfig && timerEngineRef.current) {
              timerEngineRef.current.updateConfig(newVals.timerConfig);
            }
            return updated;
          });
        }}
        onSelectTheme={(th) => {
          setSettings((prev) => {
            const updated = { ...prev, theme: th };
            globalStorage.saveLocalSync(keys.SETTINGS, updated);
            themeEngineRef.current?.setTheme(th.id);
            return updated;
          });
        }}
      />
    </div>
  );
};

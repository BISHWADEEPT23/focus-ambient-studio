// Core Type Definitions for Focus & Ambient Engine

export type DashboardMode = 'focus' | 'ambient';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'countdown' | 'stopwatch' | 'animedoro' | 'custom';

export type TimerStyle = 'digital' | 'flip';

export interface TimerConfig {
  pomodoroWork: number; // in seconds (e.g. 1500 = 25m)
  shortBreak: number;   // in seconds (e.g. 300 = 5m)
  longBreak: number;    // in seconds (e.g. 900 = 15m)
  longBreakInterval: number; // intervals before long break (default 4)
  countdownTarget: number;   // in seconds (e.g. 3600 = 60m)
  animedoroWork: number;     // e.g. 3000 = 50m
  animedoroBreak: number;    // e.g. 1200 = 20m
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  chimeSound: boolean;
}

export interface TimerState {
  mode: TimerMode;
  status: 'idle' | 'running' | 'paused' | 'completed';
  timeRemaining: number; // seconds
  totalDuration: number; // seconds
  elapsedSeconds: number; // seconds
  completedCycles: number;
  activeTaskId?: string;
  startedAt?: number; // timestamp
  targetEndTime?: number; // timestamp
  lastTickTimestamp?: number; // timestamp
}

export interface SoundChannel {
  id: string;
  name: string;
  category: 'nature' | 'noise' | 'atmospheric' | 'cozy';
  volume: number; // 0.0 to 1.0
  active: boolean;
  iconName: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  category: 'gradient' | 'ambient-canvas' | 'minimal';
  overlayOpacity: number; // 0.0 to 0.9
  blurAmount: number; // 0 to 20 px
  sceneType?: 'stars' | 'aurora' | 'rain' | 'forest' | 'particles';
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  subjectTag?: string; // e.g. "UPSC-History", "RBI-Phase2", "Engineering", "General"
  estimatedPomodoros: number;
  completedPomodoros: number;
  subtasks: SubTask[];
  createdAt: number;
  completedAt?: number;
  isCurrentFocus?: boolean;
}

export interface FocusSessionLog {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  mode: TimerMode;
  taskId?: string;
  taskTitle?: string;
  subjectTag?: string;
  completedSuccessfully: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  nextCheckTimestamp: number;
  history: Record<string, number>; // date string -> total focus seconds
}

export interface AppSettings {
  dashboardMode: DashboardMode;
  timerStyle: TimerStyle;
  timerConfig: TimerConfig;
  theme: ThemeConfig;
  masterVolume: number;
  muted: boolean;
  reducedMotion: boolean;
  showQuote: boolean;
  soundChannels: SoundChannel[];
}

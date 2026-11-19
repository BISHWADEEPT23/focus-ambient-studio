import React from 'react';
import { Volume2, VolumeX, CheckSquare, BarChart2, Compass, Eye } from 'lucide-react';
import { DashboardMode, SoundChannel, StreakData } from '../types';

interface BottomBarProps {
  mode: DashboardMode;
  onToggleMode: () => void;
  soundChannels: SoundChannel[];
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenMixer: () => void;
  onOpenTasks: () => void;
  pendingTasksCount: number;
  streakData: StreakData;
  onOpenAnalytics: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  mode,
  onToggleMode,
  soundChannels,
  isMuted,
  onToggleMute,
  onOpenMixer,
  onOpenTasks,
  pendingTasksCount,
  streakData,
  onOpenAnalytics,
}) => {
  const activeSoundsCount = soundChannels.filter((c) => c.active).length;

  return (
    <nav className="fixed bottom-6 inset-x-0 z-30 flex items-center justify-between px-6 pointer-events-none">
      {/* Left: Mode Switcher */}
      <div className="pointer-events-auto">
        <button
          onClick={onToggleMode}
          className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-full text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-xl active:scale-95"
          title={`Switch to ${mode === 'focus' ? 'Ambient' : 'Focus'} Mode (A/F)`}
        >
          {mode === 'focus' ? (
            <>
              <Eye className="w-3.5 h-3.5 text-primary-400" />
              <span>Ambient Mode</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-primary-400" />
              <span>Focus Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Center / Right: Audio Mixer, Tasks, Streaks & Analytics */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Audio Mixer Trigger */}
        <div className="flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-xl">
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-full transition-all ${
              isMuted ? 'text-neutral-500 hover:text-neutral-300' : 'text-primary-400 hover:text-primary-300'
            }`}
            title="Mute / Unmute Audio (M)"
            aria-label="Toggle mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenMixer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
            title="Open Soundscapes Mixer"
          >
            <span>Sounds</span>
            {activeSoundsCount > 0 && !isMuted && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Task Drawer Trigger */}
        <button
          onClick={onOpenTasks}
          className="relative flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-full text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-xl active:scale-95"
          title="Open Task Manager (T)"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Tasks</span>
          {pendingTasksCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary-600 text-white">
              {pendingTasksCount}
            </span>
          )}
        </button>

        {/* Streak Counter & Analytics Modal Trigger */}
        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-full text-xs font-medium text-amber-400 hover:text-amber-300 transition-all shadow-xl active:scale-95"
          title="View Streak & Focus Analytics"
        >
          <span className="text-sm">🔥</span>
          <span className="font-bold">{streakData.currentStreak}</span>
          <span className="text-neutral-400 text-[11px] hidden sm:inline">days</span>
          <BarChart2 className="w-3 h-3 ml-1 text-neutral-400" />
        </button>
      </div>
    </nav>
  );
};

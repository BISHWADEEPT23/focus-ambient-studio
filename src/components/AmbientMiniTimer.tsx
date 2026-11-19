import React from 'react';
import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import { TimerState, TaskItem } from '../types';

interface AmbientMiniTimerProps {
  timerState: TimerState;
  activeTask?: TaskItem;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onExpandToFocus: () => void;
}

export const AmbientMiniTimer: React.FC<AmbientMiniTimerProps> = ({
  timerState,
  activeTask,
  onStart,
  onPause,
  onReset,
  onExpandToFocus,
}) => {
  const isRunning = timerState.status === 'running';
  const totalSeconds = timerState.timeRemaining;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="fixed top-6 right-6 z-30 flex flex-col items-end gap-2 animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:border-white/20 transition-all">
        {/* Play/Pause Button */}
        <button
          onClick={isRunning ? onPause : onStart}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition-all transform active:scale-95"
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Time display */}
        <div className="flex flex-col">
          <span className="font-mono text-xl font-bold tracking-tight text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider capitalize">
            {timerState.mode}
          </span>
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-all"
          title="Reset"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Maximize to Focus mode */}
        <button
          onClick={onExpandToFocus}
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
          title="Expand to Focus Mode"
          aria-label="Expand to Focus Mode"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Docked active task in ambient mode */}
      {activeTask && (
        <div className="max-w-xs px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl text-xs text-neutral-300 truncate shadow-md">
          <span className="text-primary-400 mr-1.5 font-semibold">●</span>
          {activeTask.title}
        </div>
      )}
    </div>
  );
};

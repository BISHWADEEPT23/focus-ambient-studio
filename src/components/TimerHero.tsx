import React from 'react';
import { Play, Pause, RotateCcw, Clock, FlipHorizontal } from 'lucide-react';
import { TimerMode, TimerState, TimerStyle, TaskItem } from '../types';
import { FlipCard } from './FlipCard';

interface TimerHeroProps {
  timerState: TimerState;
  timerStyle: TimerStyle;
  activeTask?: TaskItem;
  reducedMotion?: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onModeSelect: (mode: TimerMode) => void;
  onToggleTimerStyle: () => void;
  onToggleTaskComplete?: (taskId: string) => void;
}

export const TimerHero: React.FC<TimerHeroProps> = ({
  timerState,
  timerStyle,
  activeTask,
  reducedMotion = false,
  onStart,
  onPause,
  onReset,
  onModeSelect,
  onToggleTimerStyle,
  onToggleTaskComplete,
}) => {
  const isRunning = timerState.status === 'running';

  const totalSeconds = timerState.timeRemaining;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const modeTabs: Array<{ id: TimerMode; label: string }> = [
    { id: 'pomodoro', label: 'Pomodoro' },
    { id: 'shortBreak', label: 'Short Break' },
    { id: 'longBreak', label: 'Long Break' },
    { id: 'stopwatch', label: 'Stopwatch' },
    { id: 'animedoro', label: 'Animedoro' },
  ];

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl w-full mx-auto px-4 py-8 z-10 transition-all duration-300">
      {/* Mode Navigation Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 mb-8 shadow-inner">
        {modeTabs.map((tab) => {
          const isActive = timerState.mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onModeSelect(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Display: Digital or Flip */}
      <div className="my-4 flex items-center justify-center">
        {timerStyle === 'flip' ? (
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5" data-testid="flip-clock-display">
            {hours > 0 && (
              <>
                <FlipCard digit={hours} label="Hours" reducedMotion={reducedMotion} />
                <span className="text-2xl sm:text-3xl md:text-5xl font-mono text-neutral-600 font-bold mb-4">:</span>
              </>
            )}
            <FlipCard digit={minutes} label="Minutes" reducedMotion={reducedMotion} />
            <span className="text-2xl sm:text-3xl md:text-5xl font-mono text-neutral-600 font-bold mb-4">:</span>
            <FlipCard digit={seconds} label="Seconds" reducedMotion={reducedMotion} />
          </div>
        ) : (
          <div className="text-7xl md:text-9xl font-mono font-bold tracking-tighter text-white drop-shadow-2xl select-none">
            {hours > 0 && `${String(hours).padStart(2, '0')}:`}
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={onReset}
          className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all transform active:scale-95"
          title="Reset timer (R)"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={isRunning ? onPause : onStart}
          className={`flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-base transition-all transform active:scale-95 shadow-xl ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
              : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/30'
          }`}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>Start Focus</span>
            </>
          )}
        </button>

        <button
          onClick={onToggleTimerStyle}
          className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all transform active:scale-95"
          title={`Switch to ${timerStyle === 'flip' ? 'Digital' : 'Flip'} style`}
          aria-label="Toggle timer display style"
        >
          {timerStyle === 'flip' ? <Clock className="w-5 h-5" /> : <FlipHorizontal className="w-5 h-5" />}
        </button>
      </div>

      {/* Docked Active Focus Task */}
      {activeTask && (
        <div className="mt-8 px-4 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3 shadow-lg max-w-md w-full animate-fade-in">
          <input
            type="checkbox"
            checked={activeTask.completed}
            onChange={() => onToggleTaskComplete?.(activeTask.id)}
            className="w-4 h-4 rounded border-neutral-700 text-primary-600 focus:ring-0 cursor-pointer accent-primary-600"
            aria-label={`Mark ${activeTask.title} complete`}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-primary-400 font-medium uppercase tracking-wider">Current Focus</div>
            <div className="text-sm font-medium text-neutral-200 truncate">{activeTask.title}</div>
          </div>
          {activeTask.subjectTag && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-neutral-300">
              {activeTask.subjectTag}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

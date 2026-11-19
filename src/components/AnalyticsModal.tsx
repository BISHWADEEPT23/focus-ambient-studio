import React, { useRef } from 'react';
import { X, Flame, Trophy, BarChart2, Download, Upload, PieChart } from 'lucide-react';
import { StreakData } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakData: StreakData;
  dailyStats: Array<{ date: string; minutes: number }>;
  subjectBreakdown: Record<string, number>;
  onExportBackup: () => void;
  onImportBackup: (json: string) => boolean;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  streakData,
  dailyStats,
  subjectBreakdown,
  onExportBackup,
  onImportBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const maxMinutes = Math.max(1, ...dailyStats.map((d) => d.minutes));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportBackup(content);
        if (ok) {
          alert('Analytics data restored successfully!');
        } else {
          alert('Failed to parse backup JSON. Invalid structure.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-semibold text-white">Focus Analytics & Streaks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
            aria-label="Close analytics"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Streak Metric Badges */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{streakData.currentStreak}</div>
              <div className="text-xs text-amber-300/80 font-medium">Current Streak Days</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{streakData.longestStreak}</div>
              <div className="text-xs text-purple-300/80 font-medium">Longest Streak Days</div>
            </div>
          </div>
        </div>

        {/* 7-Day Focus Minutes Bar Chart */}
        <div className="my-5 p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
            Daily Focus Minutes (Last 7 Days)
          </h3>

          <div className="flex items-end justify-between gap-2 h-32 pt-4">
            {dailyStats.map((stat) => {
              const heightPercent = Math.round((stat.minutes / maxMinutes) * 100);
              const label = stat.date.substring(5); // MM-DD
              return (
                <div key={stat.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-neutral-400">{stat.minutes}m</span>
                  <div className="w-full max-w-[28px] bg-neutral-800 rounded-t-md overflow-hidden flex items-end h-full">
                    <div
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                      className="w-full bg-primary-500 hover:bg-primary-400 transition-all rounded-t-md"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Breakdown */}
        {Object.keys(subjectBreakdown).length > 0 && (
          <div className="my-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-neutral-400" />
              <span>Subject Breakdown</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(subjectBreakdown).map(([subject, mins]) => (
                <div
                  key={subject}
                  className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2 text-xs"
                >
                  <span className="text-neutral-300 font-medium">{subject}</span>
                  <span className="font-mono text-primary-400 font-bold">{mins}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backup & Restore Controls */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
          <button
            onClick={onExportBackup}
            className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-medium text-neutral-200 flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-medium text-neutral-200 flex items-center justify-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

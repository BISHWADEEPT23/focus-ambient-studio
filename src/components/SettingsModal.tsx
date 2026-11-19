import React from 'react';
import { X, Sliders, Palette, Keyboard, ShieldCheck } from 'lucide-react';
import { AppSettings, ThemeConfig } from '../types';
import { PRESET_THEMES } from '../core/themes/themeEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectTheme: (theme: ThemeConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-semibold text-white">Settings & Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Section: Timer Durations */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <span>Timer Durations (Minutes)</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <label className="text-[11px] text-neutral-400 block mb-1">Focus</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={Math.round(settings.timerConfig.pomodoroWork / 60)}
                  onChange={(e) =>
                    onUpdateSettings({
                      timerConfig: {
                        ...settings.timerConfig,
                        pomodoroWork: (parseInt(e.target.value) || 25) * 60,
                      },
                    })
                  }
                  className="w-full bg-transparent font-mono text-base font-bold text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <label className="text-[11px] text-neutral-400 block mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={Math.round(settings.timerConfig.shortBreak / 60)}
                  onChange={(e) =>
                    onUpdateSettings({
                      timerConfig: {
                        ...settings.timerConfig,
                        shortBreak: (parseInt(e.target.value) || 5) * 60,
                      },
                    })
                  }
                  className="w-full bg-transparent font-mono text-base font-bold text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <label className="text-[11px] text-neutral-400 block mb-1">Long Break</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={Math.round(settings.timerConfig.longBreak / 60)}
                  onChange={(e) =>
                    onUpdateSettings({
                      timerConfig: {
                        ...settings.timerConfig,
                        longBreak: (parseInt(e.target.value) || 15) * 60,
                      },
                    })
                  }
                  className="w-full bg-transparent font-mono text-base font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Themes & Visuals */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Ambient Theme</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_THEMES.map((th) => {
                const isSelected = settings.theme.id === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => onSelectTheme(th)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-primary-950/40 border-primary-500 shadow-md shadow-primary-500/20'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-semibold text-white">{th.name}</span>
                    <span className="text-[10px] text-neutral-400 capitalize">{th.category}</span>
                  </button>
                );
              })}
            </div>

            {/* Opacity Dimmer */}
            <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-2xl">
              <div className="flex justify-between text-xs text-neutral-400 mb-1.5 font-medium">
                <span>Background Dimming Opacity</span>
                <span>{Math.round(settings.theme.overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={settings.theme.overlayOpacity}
                onChange={(e) =>
                  onSelectTheme({
                    ...settings.theme,
                    overlayOpacity: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>
          </div>

          {/* Section: Accessibility */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Accessibility & Motion</span>
            </h3>

            <label className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-2xl cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">Reduce Motion</span>
                <span className="text-[10px] text-neutral-400">
                  Disables background canvas animation loops and active particle effects
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-700 text-primary-600 accent-primary-600 cursor-pointer"
              />
            </label>
          </div>

          {/* Section: Keyboard Shortcuts */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard Shortcuts</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Start / Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">Space</kbd>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Reset Timer</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">R</kbd>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Mute Audio</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">M</kbd>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Toggle Ambient</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">A</kbd>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Toggle Focus</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">F</kbd>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Task Drawer</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">T</kbd>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Audio Mixer</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">S</kbd>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-400">Close Dialog</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[10px]">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

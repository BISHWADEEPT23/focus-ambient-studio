import React from 'react';
import { X, Volume2, VolumeX, CloudRain, Waves, Wind, Flame, AudioWaveform, BellRing, Feather } from 'lucide-react';
import { SoundChannel } from '../types';

interface AudioMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: SoundChannel[];
  masterVolume: number;
  isMuted: boolean;
  onToggleChannel: (id: string) => void;
  onChannelVolumeChange: (id: string, vol: number) => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onTestChime: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  CloudRain,
  Waves,
  Wind,
  Flame,
  AudioWaveform,
  Feather,
};

export const AudioMixerModal: React.FC<AudioMixerModalProps> = ({
  isOpen,
  onClose,
  channels,
  masterVolume,
  isMuted,
  onToggleChannel,
  onChannelVolumeChange,
  onMasterVolumeChange,
  onToggleMute,
  onTestChime,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mixer-title"
    >
      <div className="w-full max-w-lg max-h-[88vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 id="mixer-title" className="text-sm sm:text-base font-semibold text-white">
                Procedural Soundscapes
              </h2>
              <p className="text-[11px] text-neutral-400">Pure Web Audio ambient generators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
            aria-label="Close mixer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Controls Section - Fixed Container Separated from List */}
        <div className="my-3 sm:my-4 p-3.5 sm:p-4 bg-neutral-950/90 border border-neutral-800/90 rounded-2xl flex items-center justify-between gap-3 sm:gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={onToggleMute}
            aria-label="Toggle master mute"
            className={`p-2.5 rounded-xl border transition-all flex-shrink-0 active:scale-95 ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                : 'bg-neutral-800/90 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-700'
            }`}
            title={isMuted ? 'Unmute Master Audio' : 'Mute Master Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs text-neutral-400 font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">Master Volume</span>
              <span className="font-mono font-bold text-white text-[11px]">
                {isMuted ? 'Muted' : `${Math.round(masterVolume * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              aria-label="Master volume slider"
            />
          </div>

          <button
            onClick={onTestChime}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-all flex-shrink-0 active:scale-95"
            title="Test session completion chime"
            aria-label="Test alert chime"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Chime</span>
          </button>
        </div>

        {/* Scrollable Sound Cards Container */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-1 pr-1.5 custom-scrollbar" data-testid="sound-cards-container">
          {channels.map((ch) => {
            const Icon = ICON_MAP[ch.iconName] || AudioWaveform;
            return (
              <div
                key={ch.id}
                data-testid={`sound-card-${ch.id}`}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  ch.active
                    ? 'bg-primary-950/40 border-primary-500/40 shadow-sm shadow-primary-500/10'
                    : 'bg-neutral-950/80 border-neutral-800/70 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleChannel(ch.id)}
                      aria-label={`Toggle ${ch.name}`}
                      className={`p-2 rounded-xl border transition-all active:scale-95 flex-shrink-0 ${
                        ch.active
                          ? 'bg-primary-600 border-primary-500 text-white shadow-md shadow-primary-600/30'
                          : 'bg-neutral-800/90 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white">{ch.name}</div>
                      <span className="text-[10px] text-neutral-400 font-medium capitalize bg-white/5 px-1.5 py-0.5 rounded">
                        {ch.category}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold ${ch.active ? 'text-primary-400' : 'text-neutral-500'}`}>
                    {ch.active ? `${Math.round(ch.volume * 100)}%` : 'Off'}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={!ch.active}
                  value={ch.volume}
                  onChange={(e) => onChannelVolumeChange(ch.id, parseFloat(e.target.value))}
                  className={`w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-500 transition-opacity ${
                    !ch.active ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
                  }`}
                  aria-label={`${ch.name} volume slider`}
                />
              </div>
            );
          })}
          {/* Bottom spacing cushion to guarantee last item visibility */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
};

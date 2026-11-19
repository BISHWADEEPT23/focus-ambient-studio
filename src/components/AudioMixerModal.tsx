import React from 'react';
import { X, Volume2, VolumeX, CloudRain, Waves, Wind, Flame, AudioWaveform, BellRing } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-semibold text-white">Procedural Soundscapes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
            aria-label="Close mixer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Controls */}
        <div className="py-4 border-b border-neutral-800 flex items-center justify-between gap-4">
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-xs text-neutral-400 font-medium">
              <span>Master Volume</span>
              <span>{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          <button
            onClick={onTestChime}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700 transition-all"
            title="Test alert chime"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>Chime</span>
          </button>
        </div>

        {/* Multi-Track Channel Sliders */}
        <div className="py-4 space-y-4 max-h-72 overflow-y-auto pr-1">
          {channels.map((ch) => {
            const Icon = ICON_MAP[ch.iconName] || AudioWaveform;
            return (
              <div
                key={ch.id}
                className={`p-3 rounded-2xl border transition-all ${
                  ch.active
                    ? 'bg-primary-950/20 border-primary-800/40'
                    : 'bg-neutral-950/40 border-neutral-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onToggleChannel(ch.id)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        ch.active
                          ? 'bg-primary-600 border-primary-500 text-white shadow-md shadow-primary-600/30'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="text-xs font-semibold text-white">{ch.name}</div>
                      <div className="text-[10px] text-neutral-400 capitalize">{ch.category}</div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-neutral-400">
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
                  className={`w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-500 ${
                    !ch.active && 'opacity-40 cursor-not-allowed'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

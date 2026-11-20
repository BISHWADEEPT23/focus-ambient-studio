import { SoundChannel } from '../../types';
import {
  ProceduralChannelInstance,
  playHarmonicChime,
  startBrownNoiseSound,
  startCampfireSound,
  startForestBirdsSound,
  startOceanWavesSound,
  startPinkNoiseSound,
  startRainSound,
  startWhiteNoiseSound,
  startWindSound,
} from './proceduralGenerators';

export const DEFAULT_SOUND_CHANNELS: SoundChannel[] = [
  { id: 'rain', name: 'Gentle Rain', category: 'nature', volume: 0.7, active: false, iconName: 'CloudRain' },
  { id: 'waves', name: 'Ocean Waves', category: 'nature', volume: 0.65, active: false, iconName: 'Waves' },
  { id: 'birds', name: 'Forest Birds', category: 'nature', volume: 0.6, active: false, iconName: 'Feather' },
  { id: 'wind', name: 'Forest Breeze', category: 'nature', volume: 0.5, active: false, iconName: 'Wind' },
  { id: 'fire', name: 'Cozy Hearth', category: 'cozy', volume: 0.55, active: false, iconName: 'Flame' },
  { id: 'brown_noise', name: 'Deep Brown Noise', category: 'noise', volume: 0.6, active: false, iconName: 'AudioWaveform' },
  { id: 'pink_noise', name: 'Calm Pink Noise', category: 'noise', volume: 0.55, active: false, iconName: 'AudioWaveform' },
  { id: 'white_noise', name: 'Pure White Noise', category: 'noise', volume: 0.5, active: false, iconName: 'AudioWaveform' },
];

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private channels: SoundChannel[];
  private activeInstances: Map<string, ProceduralChannelInstance> = new Map();
  private masterVolume: number;
  private isMuted: boolean;
  private onStateChange?: (channels: SoundChannel[], masterVolume: number, isMuted: boolean) => void;

  constructor(
    initialChannels?: SoundChannel[],
    masterVolume = 0.8,
    isMuted = false,
    onStateChange?: (channels: SoundChannel[], masterVolume: number, isMuted: boolean) => void
  ) {
    if (initialChannels && initialChannels.length > 0) {
      // Merge with default channels to preserve any missing new channels
      const channelMap = new Map<string, SoundChannel>();
      DEFAULT_SOUND_CHANNELS.forEach((def) => channelMap.set(def.id, { ...def }));
      initialChannels.forEach((saved) => {
        if (channelMap.has(saved.id)) {
          channelMap.set(saved.id, { ...channelMap.get(saved.id)!, ...saved });
        } else {
          channelMap.set(saved.id, { ...saved });
        }
      });
      this.channels = Array.from(channelMap.values());
    } else {
      this.channels = DEFAULT_SOUND_CHANNELS.map((ch) => ({ ...ch }));
    }

    this.masterVolume = masterVolume;
    this.isMuted = isMuted;
    this.onStateChange = onStateChange;
  }

  public initAudioContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx!;
  }

  public async resumeAudioContext(): Promise<void> {
    const ctx = this.initAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterGainNode(): GainNode | null {
    return this.masterGain;
  }

  public getActiveInstances(): Map<string, ProceduralChannelInstance> {
    return this.activeInstances;
  }

  public getChannels(): SoundChannel[] {
    return [...this.channels];
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public isMasterMuted(): boolean {
    return this.isMuted;
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
    this.notifyState();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
    this.notifyState();
    return this.isMuted;
  }

  public toggleChannel(channelId: string): boolean {
    const channel = this.channels.find((c) => c.id === channelId);
    if (!channel) return false;

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.warn('AudioContext resume error:', err));
    }

    channel.active = !channel.active;

    if (channel.active) {
      this.startChannelSynthesis(channel);
    } else {
      this.stopChannelSynthesis(channel.id);
    }

    this.notifyState();
    return channel.active;
  }

  public setChannelVolume(channelId: string, volume: number): void {
    const channel = this.channels.find((c) => c.id === channelId);
    if (!channel) return;

    channel.volume = Math.max(0, Math.min(1, volume));

    const instance = this.activeInstances.get(channelId);
    if (instance && this.ctx) {
      instance.gainNode.gain.setValueAtTime(channel.volume, this.ctx.currentTime);
    }

    this.notifyState();
  }

  private startChannelSynthesis(channel: SoundChannel): void {
    const ctx = this.initAudioContext();
    if (!ctx || !this.masterGain) return;

    // Stop existing instance if running
    this.stopChannelSynthesis(channel.id);

    let instance: ProceduralChannelInstance | null = null;

    switch (channel.id) {
      case 'rain':
        instance = startRainSound(ctx, this.masterGain);
        break;
      case 'waves':
        instance = startOceanWavesSound(ctx, this.masterGain);
        break;
      case 'birds':
        instance = startForestBirdsSound(ctx, this.masterGain);
        break;
      case 'wind':
        instance = startWindSound(ctx, this.masterGain);
        break;
      case 'fire':
        instance = startCampfireSound(ctx, this.masterGain);
        break;
      case 'brown_noise':
        instance = startBrownNoiseSound(ctx, this.masterGain);
        break;
      case 'pink_noise':
        instance = startPinkNoiseSound(ctx, this.masterGain);
        break;
      case 'white_noise':
        instance = startWhiteNoiseSound(ctx, this.masterGain);
        break;
    }

    if (instance) {
      instance.gainNode.gain.setValueAtTime(channel.volume, ctx.currentTime);
      this.activeInstances.set(channel.id, instance);
    }
  }

  private stopChannelSynthesis(channelId: string): void {
    const instance = this.activeInstances.get(channelId);
    if (instance) {
      instance.stop();
      this.activeInstances.delete(channelId);
    }
  }

  public playChime(): void {
    const ctx = this.initAudioContext();
    if (ctx) {
      playHarmonicChime(ctx);
    }
  }

  public stopAll(): void {
    for (const [id, instance] of this.activeInstances.entries()) {
      instance.stop();
      const ch = this.channels.find((c) => c.id === id);
      if (ch) ch.active = false;
    }
    this.activeInstances.clear();
    this.notifyState();
  }

  private notifyState(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getChannels(), this.masterVolume, this.isMuted);
    }
  }

  public destroy(): void {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

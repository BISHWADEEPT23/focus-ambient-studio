import { describe, it, expect } from 'vitest';
import { AmbientAudioEngine } from '../core/audio/ambientAudioEngine';
import {
  createNoiseBuffer,
  startRainSound,
  startOceanWavesSound,
  startForestBirdsSound,
  startWindSound,
  startCampfireSound,
  startBrownNoiseSound,
  startPinkNoiseSound,
  startWhiteNoiseSound,
  playHarmonicChime,
} from '../core/audio/proceduralGenerators';

describe('Ambient Audio Engine Unit Tests', () => {
  it('initializes with default sound channels and default volume', () => {
    const engine = new AmbientAudioEngine();
    const channels = engine.getChannels();

    expect(channels.length).toBeGreaterThanOrEqual(7);
    expect(channels.some((c) => c.id === 'rain')).toBe(true);
    expect(channels.some((c) => c.id === 'waves')).toBe(true);
    expect(channels.some((c) => c.id === 'birds')).toBe(true);
    expect(channels.some((c) => c.id === 'wind')).toBe(true);
    expect(channels.some((c) => c.id === 'fire')).toBe(true);
    expect(channels.some((c) => c.id === 'brown_noise')).toBe(true);
    expect(channels.some((c) => c.id === 'white_noise')).toBe(true);
    expect(engine.getMasterVolume()).toBe(0.8);
    expect(engine.isMasterMuted()).toBe(false);
  });

  it('adjusts master volume and toggles mute state', () => {
    const engine = new AmbientAudioEngine();
    engine.setMasterVolume(0.45);
    expect(engine.getMasterVolume()).toBe(0.45);

    const muted = engine.toggleMute();
    expect(muted).toBe(true);
    expect(engine.isMasterMuted()).toBe(true);

    const unmuted = engine.toggleMute();
    expect(unmuted).toBe(false);
    expect(engine.isMasterMuted()).toBe(false);
  });

  it('toggles channels and adjusts channel volume', () => {
    const engine = new AmbientAudioEngine();
    engine.toggleChannel('rain');
    let rain = engine.getChannels().find((c) => c.id === 'rain');
    expect(rain?.active).toBe(true);

    engine.setChannelVolume('rain', 0.9);
    rain = engine.getChannels().find((c) => c.id === 'rain');
    expect(rain?.volume).toBe(0.9);

    engine.toggleChannel('rain');
    rain = engine.getChannels().find((c) => c.id === 'rain');
    expect(rain?.active).toBe(false);
  });

  it('toggles forest birds, white noise, and pink noise channels', () => {
    const engine = new AmbientAudioEngine();
    
    // Toggle Forest Birds
    expect(engine.toggleChannel('birds')).toBe(true);
    expect(engine.getChannels().find((c) => c.id === 'birds')?.active).toBe(true);
    
    // Toggle White Noise
    expect(engine.toggleChannel('white_noise')).toBe(true);
    expect(engine.getChannels().find((c) => c.id === 'white_noise')?.active).toBe(true);

    // Adjust volume
    engine.setChannelVolume('birds', 0.7);
    expect(engine.getChannels().find((c) => c.id === 'birds')?.volume).toBe(0.7);

    // Stop all
    engine.stopAll();
    expect(engine.getChannels().every((c) => !c.active)).toBe(true);
  });

  it('creates synthetic procedural noise buffers without crashing', () => {
    const ctx = new AudioContext();
    const whiteBuf = createNoiseBuffer(ctx, 'white', 1);
    const pinkBuf = createNoiseBuffer(ctx, 'pink', 1);
    const brownBuf = createNoiseBuffer(ctx, 'brown', 1);

    expect(whiteBuf.length).toBe(ctx.sampleRate);
    expect(pinkBuf.length).toBe(ctx.sampleRate);
    expect(brownBuf.length).toBe(ctx.sampleRate);
  });

  it('verifies all procedural sound generator factories start and clean up cleanly', () => {
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();

    const generators = [
      { name: 'rain', fn: () => startRainSound(ctx, masterGain) },
      { name: 'waves', fn: () => startOceanWavesSound(ctx, masterGain) },
      { name: 'birds', fn: () => startForestBirdsSound(ctx, masterGain) },
      { name: 'wind', fn: () => startWindSound(ctx, masterGain) },
      { name: 'fire', fn: () => startCampfireSound(ctx, masterGain) },
      { name: 'brown', fn: () => startBrownNoiseSound(ctx, masterGain) },
      { name: 'white', fn: () => startWhiteNoiseSound(ctx, masterGain) },
      { name: 'pink', fn: () => startPinkNoiseSound(ctx, masterGain) },
    ];

    for (const gen of generators) {
      const instance = gen.fn();
      expect(instance).toBeDefined();
      expect(instance.gainNode).toBeDefined();
      expect(typeof instance.stop).toBe('function');
      expect(() => instance.stop()).not.toThrow();
    }
  });

  it('plays harmonic chime without error', () => {
    const ctx = new AudioContext();
    expect(() => playHarmonicChime(ctx)).not.toThrow();
  });
});

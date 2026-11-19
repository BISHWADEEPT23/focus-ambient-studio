import { describe, it, expect } from 'vitest';
import { AmbientAudioEngine } from '../core/audio/ambientAudioEngine';
import { createNoiseBuffer } from '../core/audio/proceduralGenerators';

describe('Ambient Audio Engine Unit Tests', () => {
  it('initializes with default sound channels and default volume', () => {
    const engine = new AmbientAudioEngine();
    const channels = engine.getChannels();

    expect(channels.length).toBeGreaterThanOrEqual(4);
    expect(channels.some((c) => c.id === 'rain')).toBe(true);
    expect(channels.some((c) => c.id === 'waves')).toBe(true);
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

  it('creates synthetic procedural noise buffers without crashing', () => {
    const ctx = new AudioContext();
    const whiteBuf = createNoiseBuffer(ctx, 'white', 1);
    const pinkBuf = createNoiseBuffer(ctx, 'pink', 1);
    const brownBuf = createNoiseBuffer(ctx, 'brown', 1);

    expect(whiteBuf.length).toBe(ctx.sampleRate);
    expect(pinkBuf.length).toBe(ctx.sampleRate);
    expect(brownBuf.length).toBe(ctx.sampleRate);
  });
});

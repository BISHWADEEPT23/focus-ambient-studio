/**
 * Procedural Web Audio Generators for Focus & Ambient Engine.
 * 100% clean-room, zero-asset algorithmic synthesis.
 * Requires no external audio files or proprietary recordings.
 */

export function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown', durationSeconds = 5): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const output = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }
  }

  return buffer;
}

export interface ProceduralChannelInstance {
  sourceNode: AudioNode;
  gainNode: GainNode;
  stop: () => void;
}

export function startRainSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 4);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  // Filter 1: Low-pass filter for steady rain rumble
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1200;

  // Filter 2: High-pass to remove muddy sub-bass
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 250;

  const gain = ctx.createGain();
  gain.gain.value = 0.5;

  source.connect(lowpass);
  lowpass.connect(highpass);
  highpass.connect(gain);
  gain.connect(destination);

  source.start();

  return {
    sourceNode: source,
    gainNode: gain,
    stop: () => {
      try { source.stop(); } catch (_) {}
      source.disconnect();
      lowpass.disconnect();
      highpass.disconnect();
      gain.disconnect();
    }
  };
}

export function startOceanWavesSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 6);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 2.0;

  // LFO to modulate filter frequency (simulating rising and falling waves)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1; // ~10 second wave cycle

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 350; // Modulate frequency between ~50Hz and 750Hz

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0.6;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  source.start();
  lfo.start();

  return {
    sourceNode: source,
    gainNode: gain,
    stop: () => {
      try { source.stop(); lfo.stop(); } catch (_) {}
      source.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      filter.disconnect();
      gain.disconnect();
    }
  };
}

export function startWindSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const noiseBuffer = createNoiseBuffer(ctx, 'white', 5);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 450;
  bandpass.Q.value = 3.0;

  // Slow LFO for howling / whistling wind fluctuation
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 200;

  lfo.connect(lfoGain);
  lfoGain.connect(bandpass.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0.4;

  source.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destination);

  source.start();
  lfo.start();

  return {
    sourceNode: source,
    gainNode: gain,
    stop: () => {
      try { source.stop(); lfo.stop(); } catch (_) {}
      source.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      bandpass.disconnect();
      gain.disconnect();
    }
  };
}

export function startCampfireSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const brownBuffer = createNoiseBuffer(ctx, 'brown', 4);
  const source = ctx.createBufferSource();
  source.buffer = brownBuffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 300;

  const gain = ctx.createGain();
  gain.gain.value = 0.45;

  source.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(destination);

  source.start();

  return {
    sourceNode: source,
    gainNode: gain,
    stop: () => {
      try { source.stop(); } catch (_) {}
      source.disconnect();
      lowpass.disconnect();
      gain.disconnect();
    }
  };
}

export function startBrownNoiseSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const brownBuffer = createNoiseBuffer(ctx, 'brown', 5);
  const source = ctx.createBufferSource();
  source.buffer = brownBuffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 450;

  const gain = ctx.createGain();
  gain.gain.value = 0.55;

  source.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(destination);

  source.start();

  return {
    sourceNode: source,
    gainNode: gain,
    stop: () => {
      try { source.stop(); } catch (_) {}
      source.disconnect();
      lowpass.disconnect();
      gain.disconnect();
    }
  };
}

/**
 * Harmonic Chime Synthesis for Session Completion Notification.
 * Generates an ethereal C Major triad (C5, E5, G5) with gentle envelope decay.
 */
export function playHarmonicChime(ctx: AudioContext): void {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    const startTime = now + idx * 0.12;
    const duration = 1.8;

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

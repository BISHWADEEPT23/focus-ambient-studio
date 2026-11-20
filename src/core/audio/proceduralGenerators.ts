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
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.22;
      b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 4.2; // Gain compensation for deep rumble
    }
  }

  return buffer;
}

export interface ProceduralChannelInstance {
  sourceNode: AudioNode;
  gainNode: GainNode;
  stop: () => void;
}

/**
 * 1. Gentle Rain: Layered pink noise with lowpass resonance and highpass shelf
 */
export function startRainSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 6);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1400;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 200;

  const gain = ctx.createGain();
  gain.gain.value = 0.8;

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

/**
 * 2. Ocean Waves: Sine-modulated low-pass pink noise with swelling ebb and flow
 */
export function startOceanWavesSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 8);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 450;
  filter.Q.value = 2.5;

  // LFO to modulate filter frequency (simulating rising and receding waves)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.12; // ~8 second swell cycle

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 400; // Modulates between 50Hz and 850Hz

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0.85;

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

/**
 * 3. Forest Birds: Procedural melodic chirps with frequency modulation and random burst timing
 */
export function startForestBirdsSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const channelGain = ctx.createGain();
  channelGain.gain.value = 0.75;
  channelGain.connect(destination);

  let isRunning = true;
  let timerId: number | null = null;
  const activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  const triggerChirp = () => {
    if (!isRunning || ctx.state === 'closed') return;

    try {
      const now = ctx.currentTime;
      // Phrase of 2 to 4 rapid melodic chirps
      const phraseCount = Math.floor(Math.random() * 3) + 2;
      let offset = 0;

      for (let i = 0; i < phraseCount; i++) {
        const startTime = now + offset;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Varied bird frequency between 2.2 kHz and 4.2 kHz
        const baseFreq = 2200 + Math.random() * 1000;
        const peakFreq = baseFreq + 800 + Math.random() * 700;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(peakFreq, startTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, startTime + 0.12);

        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13);

        osc.connect(noteGain);
        noteGain.connect(channelGain);

        osc.start(startTime);
        osc.stop(startTime + 0.15);

        activeNodes.push({ osc, gain: noteGain });
        offset += 0.11 + Math.random() * 0.06;
      }
    } catch (_) {}

    if (isRunning) {
      // Natural interval between bird calls: 2.5 to 5.5 seconds
      const nextDelay = 2500 + Math.random() * 3000;
      timerId = window.setTimeout(triggerChirp, nextDelay);
    }
  };

  // Trigger initial bird call
  triggerChirp();

  return {
    sourceNode: channelGain,
    gainNode: channelGain,
    stop: () => {
      isRunning = false;
      if (timerId) window.clearTimeout(timerId);
      for (const node of activeNodes) {
        try {
          node.osc.stop();
          node.osc.disconnect();
          node.gain.disconnect();
        } catch (_) {}
      }
      activeNodes.length = 0;
      channelGain.disconnect();
    }
  };
}

/**
 * 4. Forest Breeze / Wind: Filtered white noise with fluctuating howling resonance
 */
export function startWindSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const noiseBuffer = createNoiseBuffer(ctx, 'white', 6);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 500;
  bandpass.Q.value = 3.5;

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.16;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 240;

  lfo.connect(lfoGain);
  lfoGain.connect(bandpass.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0.7;

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

/**
 * 5. Cozy Hearth / Fire: Warm brown noise rumble
 */
export function startCampfireSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const brownBuffer = createNoiseBuffer(ctx, 'brown', 6);
  const source = ctx.createBufferSource();
  source.buffer = brownBuffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 400;

  const gain = ctx.createGain();
  gain.gain.value = 0.75;

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
 * 6. Deep Brown Noise: Brownian 1/f² filtered walk
 */
export function startBrownNoiseSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const brownBuffer = createNoiseBuffer(ctx, 'brown', 6);
  const source = ctx.createBufferSource();
  source.buffer = brownBuffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 500;

  const gain = ctx.createGain();
  gain.gain.value = 0.85;

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
 * 7. Calm Pink Noise: Balanced 1/f spectral density
 */
export function startPinkNoiseSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const pinkBuffer = createNoiseBuffer(ctx, 'pink', 6);
  const source = ctx.createBufferSource();
  source.buffer = pinkBuffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.75;

  source.connect(gain);
  gain.connect(destination);

  source.start();

  return {
    sourceNode: source,
    gainNode: gain,
    stop: () => {
      try { source.stop(); } catch (_) {}
      source.disconnect();
      gain.disconnect();
    }
  };
}

/**
 * 8. Pure White Noise: Uniform spectral power
 */
export function startWhiteNoiseSound(ctx: AudioContext, destination: AudioNode): ProceduralChannelInstance {
  const whiteBuffer = createNoiseBuffer(ctx, 'white', 6);
  const source = ctx.createBufferSource();
  source.buffer = whiteBuffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.55;

  source.connect(gain);
  gain.connect(destination);

  source.start();

  return {
    sourceNode: source,
    gainNode: gain,
    stop: () => {
      try { source.stop(); } catch (_) {}
      source.disconnect();
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
    if (typeof gain.gain.linearRampToValueAtTime === 'function') {
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.04);
    } else {
      gain.gain.setValueAtTime(0.35, startTime + 0.04);
    }
    if (typeof gain.gain.exponentialRampToValueAtTime === 'function') {
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    } else {
      gain.gain.setValueAtTime(0.0001, startTime + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

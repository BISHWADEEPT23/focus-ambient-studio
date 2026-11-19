import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Web Audio API mock for test environment
class MockAudioNode {
  connect() {}
  disconnect() {}
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

class MockBiquadFilterNode extends MockAudioNode {
  frequency = { value: 1000, setValueAtTime: vi.fn() };
  Q = { value: 1 };
  type = 'lowpass';
}

class MockOscillatorNode extends MockAudioNode {
  type = 'sine';
  frequency = { value: 440, setValueAtTime: vi.fn() };
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioBufferSourceNode extends MockAudioNode {
  buffer = null;
  loop = false;
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = new MockAudioNode();
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  createGain = () => new MockGainNode();
  createBiquadFilter = () => new MockBiquadFilterNode();
  createOscillator = () => new MockOscillatorNode();
  createBufferSource = () => new MockAudioBufferSourceNode();
  createBuffer = (channels: number, length: number, sampleRate: number) => ({
    numberOfChannels: channels,
    length,
    sampleRate,
    getChannelData: () => new Float32Array(length),
  });
}

// Canvas mock for JSDOM
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  }) as any;
}

// Attach mocks to global window
if (typeof window !== 'undefined') {
  (window as any).AudioContext = MockAudioContext;
  (window as any).webkitAudioContext = MockAudioContext;
  
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as any;
  };
}

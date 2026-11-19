/**
 * Inline Web Worker for drift-free background timer execution.
 * Browsers throttle setInterval/setTimeout in background tabs down to 1s or less.
 * Running interval ticks inside a dedicated Web Worker bypasses main thread throttling.
 */

const WORKER_CODE = `
let timerId = null;

self.onmessage = function(e) {
  const { action, interval } = e.data;
  if (action === 'start') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'tick', timestamp: Date.now() });
    }, interval || 250);
  } else if (action === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
`;

export class WorkerTimerProvider {
  private worker: Worker | null = null;
  private intervalMs: number;
  private onTickCallback: (timestamp: number) => void;
  private fallbackIntervalId: number | null = null;

  constructor(onTick: (timestamp: number) => void, intervalMs: number = 250) {
    this.onTickCallback = onTick;
    this.intervalMs = intervalMs;
  }

  public start(): void {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        if (!this.worker) {
          const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          this.worker = new Worker(url);
          this.worker.onmessage = (e) => {
            if (e.data?.type === 'tick') {
              this.onTickCallback(e.data.timestamp);
            }
          };
        }
        this.worker.postMessage({ action: 'start', interval: this.intervalMs });
        return;
      } catch (err) {
        console.warn('Worker init failed, falling back to window.setInterval', err);
      }
    }

    // Fallback for non-worker environments (e.g. testing / SSR)
    if (!this.fallbackIntervalId && typeof window !== 'undefined') {
      this.fallbackIntervalId = window.setInterval(() => {
        this.onTickCallback(Date.now());
      }, this.intervalMs);
    }
  }

  public stop(): void {
    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }
    if (this.fallbackIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.fallbackIntervalId);
      this.fallbackIntervalId = null;
    }
  }

  public destroy(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

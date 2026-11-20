import React, { useState, useEffect, useRef, useCallback } from 'react';

interface FlipDigitProps {
  digit: number;
  label?: string;
  reducedMotion?: boolean;
}

type FlipPhase = 'IDLE' | 'FLIPPING';

export const FlipDigit: React.FC<FlipDigitProps> = ({ digit, label, reducedMotion = false }) => {
  // State machine values
  const [currentDigit, setCurrentDigit] = useState<number>(digit);
  const [previousDigit, setPreviousDigit] = useState<number>(digit);
  const [phase, setPhase] = useState<FlipPhase>('IDLE');

  // Stable references to prevent stale closures across async transitions
  const currentDigitRef = useRef<number>(digit);
  const previousDigitRef = useRef<number>(digit);
  const phaseRef = useRef<FlipPhase>('IDLE');
  const fallbackTimerRef = useRef<number | null>(null);
  const pendingDigitRef = useRef<number | null>(null);

  // Keep refs synchronized with state
  currentDigitRef.current = currentDigit;
  previousDigitRef.current = previousDigit;
  phaseRef.current = phase;

  // Clear any existing fallback timer safely
  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Commit transition: finalize state machine to IDLE with the target digit
  const commitFlip = useCallback((targetDigit: number) => {
    clearFallbackTimer();
    setCurrentDigit(targetDigit);
    setPreviousDigit(targetDigit);
    setPhase('IDLE');

    // If another digit change arrived while flipping, start the next flip sequentially
    if (pendingDigitRef.current !== null && pendingDigitRef.current !== targetDigit) {
      const nextDigit = pendingDigitRef.current;
      pendingDigitRef.current = null;
      // Trigger flip to the queued digit on next microtask
      requestAnimationFrame(() => {
        startFlip(nextDigit, targetDigit);
      });
    } else {
      pendingDigitRef.current = null;
    }
  }, [clearFallbackTimer]);

  const startFlip = useCallback((newDigit: number, oldDigit: number) => {
    setPreviousDigit(oldDigit);
    setCurrentDigit(newDigit);
    setPhase('FLIPPING');

    // Guarded fallback timeout: 750ms transition + 30ms guard buffer = 780ms
    clearFallbackTimer();
    fallbackTimerRef.current = window.setTimeout(() => {
      commitFlip(newDigit);
    }, 780);
  }, [clearFallbackTimer, commitFlip]);

  // Handle incoming prop changes
  useEffect(() => {
    if (digit === currentDigitRef.current && phaseRef.current === 'IDLE') {
      return; // Value unchanged, no transition needed
    }

    if (reducedMotion) {
      // Instant switch when reduced-motion is requested
      clearFallbackTimer();
      pendingDigitRef.current = null;
      setCurrentDigit(digit);
      setPreviousDigit(digit);
      setPhase('IDLE');
      return;
    }

    if (phaseRef.current === 'FLIPPING') {
      // If an animation is already in progress (e.g. countdown jump or rapid reset)
      const isResetOrJump = Math.abs(digit - currentDigitRef.current) > 1;
      if (isResetOrJump) {
        // Immediate snap to the new target value
        clearFallbackTimer();
        pendingDigitRef.current = null;
        setCurrentDigit(digit);
        setPreviousDigit(digit);
        setPhase('IDLE');
      } else {
        // Buffer the next sequential digit to flip after current flip commits
        pendingDigitRef.current = digit;
      }
      return;
    }

    // Normal transition from IDLE
    startFlip(digit, currentDigitRef.current);
  }, [digit, reducedMotion, startFlip, clearFallbackTimer]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearFallbackTimer();
    };
  }, [clearFallbackTimer]);

  // Native transition end event handler
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // Only respond to transform events on the rotating card itself
    if (e.propertyName === 'transform' && phaseRef.current === 'FLIPPING') {
      commitFlip(currentDigitRef.current);
    }
  };

  const isFlipping = phase === 'FLIPPING' && !reducedMotion;

  return (
    <div
      className="flip-card-perspective relative w-11 h-18 sm:w-16 sm:h-24 md:w-20 md:h-32 rounded-2xl border border-neutral-800 flip-card-container overflow-hidden select-none"
      data-testid="flip-digit-card"
      data-digit={currentDigit}
      aria-label={label ? `${label} ${currentDigit}` : `${currentDigit}`}
    >
      {/* 1. Static Underlayer: Always present */}
      {/* Top half: reveals NEXT / CURRENT digit as the flap folds down */}
      <div className="flip-card-half flip-card-top">
        <div className="flip-digit-inner flip-digit-inner-top">
          <span className="flip-digit-glyph text-3xl sm:text-5xl md:text-7xl">
            {currentDigit}
          </span>
        </div>
      </div>

      {/* Bottom half: displays PREVIOUS digit while flipping, then CURRENT when committed */}
      <div className="flip-card-half flip-card-bottom">
        <div className="flip-digit-inner flip-digit-inner-bottom">
          <span className="flip-digit-glyph flip-digit-glyph-bottom text-3xl sm:text-5xl md:text-7xl">
            {isFlipping ? previousDigit : currentDigit}
          </span>
        </div>
      </div>

      {/* 2. Active 3D Rotating Card (turns -180deg around horizontal center) */}
      {isFlipping && (
        <div
          className="flip-rotating-card is-flipping"
          onTransitionEnd={handleTransitionEnd}
          data-testid="flip-rotating-card"
        >
          {/* Front Face: Upper half of outgoing / previous digit */}
          <div className="flip-face-front animate-flip-top">
            <div className="flip-card-half flip-card-top">
              <div className="flip-digit-inner flip-digit-inner-top">
                <span className="flip-digit-glyph text-3xl sm:text-5xl md:text-7xl">
                  {previousDigit}
                </span>
              </div>
            </div>
          </div>

          {/* Rear Face: Lower half of incoming / current digit (pre-rotated 180deg) */}
          <div className="flip-face-back animate-flip-bottom">
            <div className="flip-card-half flip-card-bottom">
              <div className="flip-digit-inner flip-digit-inner-bottom">
                <span className="flip-digit-glyph flip-digit-glyph-bottom text-3xl sm:text-5xl md:text-7xl">
                  {currentDigit}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Center Hinge Line & Mechanical Bracket Pins */}
      <div className="flip-hinge-line absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-black/90 shadow-[0_1px_3px_rgba(0,0,0,0.9)] z-40 pointer-events-none" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-neutral-600 rounded-r-sm z-40 pointer-events-none" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-neutral-600 rounded-l-sm z-40 pointer-events-none" />
    </div>
  );
};

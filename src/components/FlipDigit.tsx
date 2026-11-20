import React, { useState, useEffect, useRef } from 'react';

interface FlipDigitProps {
  digit: number;
  label?: string;
  reducedMotion?: boolean;
}

export const FlipDigit: React.FC<FlipDigitProps> = ({ digit, label, reducedMotion = false }) => {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [previousDigit, setPreviousDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (digit !== currentDigit) {
      if (reducedMotion) {
        setCurrentDigit(digit);
        setPreviousDigit(digit);
        setIsFlipping(false);
      } else {
        setPreviousDigit(currentDigit);
        setCurrentDigit(digit);
        setIsFlipping(true);

        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
          setIsFlipping(false);
          setPreviousDigit(digit);
        }, 520);
      }
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [digit, currentDigit, reducedMotion]);

  return (
    <div
      className="relative w-11 h-18 sm:w-16 sm:h-24 md:w-20 md:h-32 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flip-card-perspective select-none"
      data-testid="flip-digit-card"
      data-digit={currentDigit}
      aria-label={label ? `${label} ${currentDigit}` : `${currentDigit}`}
    >
      {/* 1. Static Upper Background Card (Shows NEXT / CURRENT digit) */}
      <div className="flip-card-half flip-card-top bg-neutral-900 border-b border-black/80">
        <div className="flip-digit-inner flip-digit-inner-top">
          <span className="flip-digit-glyph text-3xl sm:text-5xl md:text-7xl">
            {currentDigit}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* 2. Static Lower Background Card (Shows PREVIOUS digit while flipping, then CURRENT) */}
      <div className="flip-card-half flip-card-bottom bg-neutral-900">
        <div className="flip-digit-inner flip-digit-inner-bottom">
          <span className="flip-digit-glyph text-3xl sm:text-5xl md:text-7xl">
            {isFlipping ? previousDigit : currentDigit}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 3. Animated Upper Flap (Folds downward displaying PREVIOUS digit) */}
      {isFlipping && !reducedMotion && (
        <div className="flip-card-half flip-card-top bg-neutral-900 border-b border-black/80 animate-flip-top z-20">
          <div className="flip-digit-inner flip-digit-inner-top">
            <span className="flip-digit-glyph text-3xl sm:text-5xl md:text-7xl">
              {previousDigit}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/50 pointer-events-none" />
        </div>
      )}

      {/* 4. Animated Lower Flap (Unfolds downward displaying CURRENT digit) */}
      {isFlipping && !reducedMotion && (
        <div className="flip-card-half flip-card-bottom bg-neutral-900 animate-flip-bottom z-30">
          <div className="flip-digit-inner flip-digit-inner-bottom">
            <span className="flip-digit-glyph text-3xl sm:text-5xl md:text-7xl">
              {currentDigit}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* Center Hinge Divider with Depth Shadow & Metal Bracket Pins */}
      <div className="flip-hinge-line absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-black/90 shadow-[0_1px_3px_rgba(0,0,0,0.9)] z-40 pointer-events-none" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-neutral-600 rounded-r-sm z-40" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-neutral-600 rounded-l-sm z-40" />
    </div>
  );
};

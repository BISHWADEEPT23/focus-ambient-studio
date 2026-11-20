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
        }, 560);
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
      className="relative w-10 h-16 sm:w-12 sm:h-20 md:w-16 md:h-24 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flip-card-perspective select-none"
      data-testid="flip-digit-card"
      data-digit={currentDigit}
      aria-label={label ? `${label} ${currentDigit}` : `${currentDigit}`}
    >
      {/* 1. Static Upper Background Card (Shows NEXT / CURRENT digit) */}
      <div className="flip-card-half flip-card-top bg-neutral-900 border-b border-black/60">
        <span className="font-mono text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tighter leading-[4rem] sm:leading-[5rem] md:leading-[6rem]">
          {currentDigit}
        </span>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-black/30 pointer-events-none" />
      </div>

      {/* 2. Static Lower Background Card (Shows PREVIOUS digit while flipping, then CURRENT) */}
      <div className="flip-card-half flip-card-bottom bg-neutral-900">
        <span className="font-mono text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tighter leading-[4rem] sm:leading-[5rem] md:leading-[6rem] -mt-8 sm:-mt-10 md:-mt-12">
          {isFlipping ? previousDigit : currentDigit}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* 3. Animated Upper Flap (Folds downward displaying PREVIOUS digit) */}
      {isFlipping && !reducedMotion && (
        <div className="flip-card-half flip-card-top bg-neutral-900 border-b border-black/60 animate-flip-top z-20">
          <span className="font-mono text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tighter leading-[4rem] sm:leading-[5rem] md:leading-[6rem]">
            {previousDigit}
          </span>
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-black/40 pointer-events-none" />
        </div>
      )}

      {/* 4. Animated Lower Flap (Unfolds downward displaying CURRENT digit) */}
      {isFlipping && !reducedMotion && (
        <div className="flip-card-half flip-card-bottom bg-neutral-900 animate-flip-bottom z-30">
          <span className="font-mono text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tighter leading-[4rem] sm:leading-[5rem] md:leading-[6rem] -mt-8 sm:-mt-10 md:-mt-12">
            {currentDigit}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Center Hinge Divider with Depth Shadow */}
      <div className="flip-hinge-line absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/80 shadow-[0_1px_2px_rgba(0,0,0,0.8)] z-40 pointer-events-none" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1 bg-neutral-700/60 rounded-r-sm z-40" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1 bg-neutral-700/60 rounded-l-sm z-40" />
    </div>
  );
};

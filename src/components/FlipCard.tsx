import React from 'react';

interface FlipCardProps {
  digit: string | number;
  label?: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({ digit, label }) => {
  const formatted = String(digit).padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-28 md:w-28 md:h-36 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden">
        {/* Top half shine */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-white/[0.03] border-b border-black/40 z-10 pointer-events-none" />

        {/* Center horizontal divider line */}
        <div className="absolute inset-x-0 top-1/2 h-[2px] bg-neutral-950 z-20" />

        {/* Big Digit */}
        <span className="font-mono text-5xl md:text-7xl font-bold tracking-tight text-neutral-100 select-none">
          {formatted}
        </span>
      </div>
      {label && (
        <span className="mt-2 text-xs uppercase tracking-widest text-neutral-400 font-medium">
          {label}
        </span>
      )}
    </div>
  );
};

import React from 'react';
import { FlipDigit } from './FlipDigit';

interface FlipCardProps {
  digit?: string | number;
  value?: string | number;
  label?: string;
  reducedMotion?: boolean;
}

export const FlipCard: React.FC<FlipCardProps> = ({ digit, value, label, reducedMotion = false }) => {
  const raw = digit !== undefined ? digit : value;
  const num = typeof raw === 'number' ? raw : parseInt(String(raw || 0), 10) || 0;
  const tens = Math.floor(Math.abs(num) / 10) % 10;
  const units = Math.abs(num) % 10;

  return (
    <div className="flex flex-col items-center select-none" data-testid="flip-unit-group">
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        <FlipDigit digit={tens} label={label ? `${label} tens` : undefined} reducedMotion={reducedMotion} />
        <FlipDigit digit={units} label={label ? `${label} units` : undefined} reducedMotion={reducedMotion} />
      </div>
      {label && (
        <span className="mt-2 text-[10px] sm:text-xs uppercase tracking-widest text-neutral-400 font-medium">
          {label}
        </span>
      )}
    </div>
  );
};

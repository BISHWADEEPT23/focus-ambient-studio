import React, { useState, useEffect } from 'react';
import { Settings, Maximize, Minimize } from 'lucide-react';

interface TopBarProps {
  onOpenSettings: () => void;
  showQuote?: boolean;
}

const MOTIVATIONAL_QUOTES = [
  'Focus is a muscle: the more you protect your attention, the stronger it grows.',
  'Deep work produces rare and valuable results.',
  'Small steps, done with unwavering consistency, build monumental mastery.',
  'Silence the noise. Elevate the signal.',
  'Your mind is for having ideas, not holding them.',
];

export const TopBar: React.FC<TopBarProps> = ({ onOpenSettings, showQuote = true }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 w-full max-w-7xl mx-auto select-none">
      {/* Greeting and Quote */}
      <div className="flex flex-col">
        <h1 className="text-sm font-semibold tracking-wide text-neutral-200">
          {greeting} <span className="text-neutral-500 font-normal">| Studio</span>
        </h1>
        {showQuote && (
          <p className="text-xs text-neutral-400/80 italic mt-0.5 max-w-md hidden sm:block">
            "{MOTIVATIONAL_QUOTES[quoteIndex]}"
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
          title="Settings (S)"
          aria-label="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

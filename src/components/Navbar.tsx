import React from 'react';

export type AppScreen = 'landing' | 'trip' | 'style' | 'loading' | 'results';

interface NavbarProps {
  currentScreen: AppScreen;
  savedCount: number;
  onGoHome: () => void;
  onGoSavedLists: () => void;
  onStartNewTrip: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  savedCount,
  onGoHome,
  onGoSavedLists,
  onStartNewTrip,
}) => {
  return (
    <header className="no-print md:sticky md:top-0 z-30 bg-[#F7F5F0]/95 backdrop-blur-sm border-b border-[#E2DDD3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#1F4D3A] hover:text-[#173B2C] transition-colors whitespace-nowrap shrink-0 min-h-11 flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A] rounded"
        >
          Earth Voyage Hub
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#5A655E]">
          <button
            type="button"
            onClick={onGoHome}
            className={`min-h-11 px-1 transition-colors whitespace-nowrap shrink-0 underline-offset-8 hover:text-[#1C2420] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A] rounded ${
              currentScreen === 'landing' ? 'text-[#1F4D3A] underline decoration-[#D9734E] decoration-2' : ''
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={onGoSavedLists}
            className="min-h-11 px-1 transition-colors whitespace-nowrap shrink-0 underline-offset-8 hover:text-[#1C2420] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A] rounded tabular-nums"
          >
            {savedCount > 0 ? `Saved Lists (${savedCount})` : 'Saved Lists'}
          </button>
          <button
            type="button"
            onClick={onStartNewTrip}
            className={`min-h-11 px-1 transition-colors whitespace-nowrap shrink-0 underline-offset-8 hover:text-[#1C2420] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A] rounded ${
              currentScreen === 'trip' || currentScreen === 'style'
                ? 'text-[#1F4D3A] underline decoration-[#D9734E] decoration-2'
                : ''
            }`}
          >
            Trip Planner
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartNewTrip}
            className="min-h-11 px-4 py-2 text-sm font-medium text-white bg-[#1F4D3A] hover:bg-[#173B2C] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
          >
            New Packing List
          </button>
        </div>
      </div>
    </header>
  );
};

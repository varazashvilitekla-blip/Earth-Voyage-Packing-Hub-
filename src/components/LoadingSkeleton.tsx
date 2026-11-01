import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, CloudOff, RefreshCw, Sun, ThermometerSnowflake, Wind } from 'lucide-react';
import { ManualClimate } from '../types/packing';

interface LoadingSkeletonProps {
  destinationName: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ destinationName }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-4xl mx-auto space-y-6 pb-16"
    >
      <div className="bg-white border border-[#E2DDD3] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-[#1F4D3A]">
              Checking Open-Meteo weather for {destinationName || 'your trip'}&hellip;
            </p>
            <div className="h-8 w-64 max-w-full bg-[#EFECE4] rounded animate-pulse" />
            <div className="h-4 w-80 max-w-full bg-[#EFECE4] rounded animate-pulse" />
          </div>
          <div className="hidden sm:block h-16 w-40 bg-[#EFECE4] rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#EFECE4]">
          <div className="h-14 bg-[#F7F5F0] rounded-lg animate-pulse" />
          <div className="h-14 bg-[#F7F5F0] rounded-lg animate-pulse" />
        </div>
      </div>

      {[1, 2, 3].map((group) => (
        <div
          key={group}
          className="bg-white border border-[#E2DDD3] rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#EFECE4]">
            <div className="h-5 w-44 bg-[#EFECE4] rounded animate-pulse" />
            <div className="h-4 w-16 bg-[#EFECE4] rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-5 h-5 rounded bg-[#EFECE4] animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-48 max-w-full bg-[#EFECE4] rounded animate-pulse" />
                  <div className="h-3 w-32 bg-[#F7F5F0] rounded animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-20 bg-[#EFECE4] rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

interface WeatherErrorViewProps {
  destinationName: string;
  errorMessage: string;
  onRetry: () => void;
  onUseManualClimate: (climate: ManualClimate) => void;
  onBackToTrip: () => void;
}

const CLIMATE_CHOICES: {
  id: ManualClimate;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'cold',
    label: 'Cold',
    description: 'Coats, thermal base layers, warm socks, knit hat & gloves',
    Icon: ThermometerSnowflake,
  },
  {
    id: 'mild',
    label: 'Mild',
    description: 'Sweaters, light rain jacket, trousers & layering tees',
    Icon: Wind,
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'T-shirts, shorts, light evening trousers & sun protection',
    Icon: Sun,
  },
  {
    id: 'hot',
    label: 'Hot',
    description: 'Breathable linen/cotton tops, sandals, sun hat & sunscreen',
    Icon: AlertTriangle,
  },
];

export const WeatherErrorView: React.FC<WeatherErrorViewProps> = ({
  destinationName,
  errorMessage,
  onRetry,
  onUseManualClimate,
  onBackToTrip,
}) => {
  const [selectedClimate, setSelectedClimate] = useState<ManualClimate>('mild');

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div
        role="alert"
        className="bg-white border border-[#E2DDD3] rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#FBF0EC] text-[#D9734E] flex items-center justify-center shrink-0">
            <CloudOff className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold text-[#1C2420]">
              Couldn&rsquo;t load weather for {destinationName}
            </h1>
            <p className="text-sm text-[#5A655E]">
              {errorMessage || 'Open-Meteo did not respond in time.'} You can try loading live
              weather again, or pick the expected climate manually to build your checklist now.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 px-4 py-2.5 text-sm font-medium text-white bg-[#1F4D3A] hover:bg-[#173B2C] rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Try again</span>
          </button>

          <button
            type="button"
            onClick={onBackToTrip}
            className="min-h-11 px-4 py-2.5 text-sm font-medium text-[#1C2420] bg-[#F7F5F0] hover:bg-[#EFECE4] border border-[#E2DDD3] rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Edit destination or dates</span>
          </button>
        </div>

        <div className="pt-5 border-t border-[#EFECE4] space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1C2420]">
              Or choose expected climate manually
            </h2>
            <p className="text-xs text-[#5A655E] mt-0.5">
              We won&rsquo;t invent weather numbers—your list will clearly state that a manual climate was used.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Manual climate choice">
            {CLIMATE_CHOICES.map(({ id, label, description, Icon }) => {
              const active = selectedClimate === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedClimate(id)}
                  className={`min-h-14 p-3.5 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                    active
                      ? 'bg-[#E9F0EC] border-[#1F4D3A]'
                      : 'bg-white border-[#E2DDD3] hover:bg-[#F7F5F0]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 shrink-0 ${
                      active ? 'text-[#1F4D3A]' : 'text-[#5A655E]'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#1C2420]">{label}</p>
                    <p className="text-xs text-[#5A655E] mt-0.5 leading-snug">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onUseManualClimate(selectedClimate)}
            className="w-full sm:w-auto min-h-11 px-5 py-2.5 text-sm font-medium text-white bg-[#D9734E] hover:bg-[#C25E3A] rounded-lg transition-colors whitespace-nowrap"
          >
            Build list with {selectedClimate} climate
          </button>
        </div>
      </div>
    </div>
  );
};

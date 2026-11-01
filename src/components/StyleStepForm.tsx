import React, { useState } from 'react';
import {
  ArrowLeft,
  Backpack,
  Briefcase,
  Camera,
  Check,
  Compass,
  Dumbbell,
  Luggage,
  Mountain,
  Shirt,
  Snowflake,
  Sparkles,
  Utensils,
  Waves,
} from 'lucide-react';
import {
  ACTIVITY_OPTIONS,
  ActivityId,
  LUGGAGE_OPTIONS,
  LuggageType,
  StylePreferences,
} from '../types/packing';

interface StyleStepFormProps {
  style: StylePreferences;
  durationDays: number;
  travelers: number;
  onChangeStyle: (updated: StylePreferences) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const ACTIVITY_ICONS: Record<ActivityId, React.ComponentType<{ className?: string }>> = {
  sightseeing: Compass,
  hiking: Mountain,
  beach: Waves,
  work: Briefcase,
  dining: Utensils,
  fitness: Dumbbell,
  photography: Camera,
  winter: Snowflake,
};

const LUGGAGE_ICONS: Record<LuggageType, React.ComponentType<{ className?: string }>> = {
  personal: Backpack,
  'carry-on': Briefcase,
  checked: Luggage,
};

export const StyleStepForm: React.FC<StyleStepFormProps> = ({
  style,
  durationDays,
  travelers,
  onChangeStyle,
  onBack,
  onSubmit,
}) => {
  const [activityError, setActivityError] = useState<string | null>(null);

  const toggleActivity = (id: ActivityId) => {
    const exists = style.activities.includes(id);
    const nextActivities = exists
      ? style.activities.filter((a) => a !== id)
      : [...style.activities, id];

    onChangeStyle({ ...style, activities: nextActivities });
    if (nextActivities.length > 0 && activityError) {
      setActivityError(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (style.activities.length === 0) {
      setActivityError('Please choose at least one activity for your trip.');
      return;
    }
    setActivityError(null);
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate className="max-w-3xl mx-auto pb-24 md:pb-12">
      <div className="bg-white border border-[#E2DDD3] rounded-xl p-5 sm:p-8 space-y-8">
        <div className="border-b border-[#EFECE4] pb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C2420]">
            Activities &amp; bag size
          </h1>
          <p className="text-sm text-[#5A655E] mt-1">
            Tell us what you plan to do and what bag you&rsquo;re bringing so we size your list realistically.
          </p>
        </div>

        {/* Activities Multi-Select */}
        <fieldset className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <legend className="text-base font-semibold text-[#1C2420]">
              Planned activities <span className="text-xs font-normal text-[#5A655E]">(select all that apply)</span>
            </legend>
            <span className="text-xs font-mono text-[#5A655E] tabular-nums">
              {style.activities.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACTIVITY_OPTIONS.map((option) => {
              const selected = style.activities.includes(option.id);
              const Icon = ACTIVITY_ICONS[option.id];

              return (
                <button
                  key={option.id}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleActivity(option.id)}
                  className={`min-h-14 p-3.5 rounded-lg border text-left flex items-start justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A] ${
                    selected
                      ? 'bg-[#E9F0EC] border-[#1F4D3A] text-[#1C2420]'
                      : 'bg-white border-[#E2DDD3] hover:bg-[#F7F5F0] text-[#1C2420]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        selected ? 'text-[#1F4D3A]' : 'text-[#5A655E]'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{option.label}</p>
                      <p className="text-xs text-[#5A655E] mt-0.5 leading-snug">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                      selected
                        ? 'bg-[#1F4D3A] border-[#1F4D3A] text-white'
                        : 'border-[#E2DDD3] bg-white'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>

          {activityError && (
            <p role="alert" className="text-sm text-[#B93829] pt-1">
              {activityError}
            </p>
          )}
        </fieldset>

        {/* Luggage Type Single-Select */}
        <fieldset className="space-y-3 pt-4 border-t border-[#EFECE4]">
          <legend className="text-base font-semibold text-[#1C2420]">
            Primary bag per traveler
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['personal', 'carry-on', 'checked'] as LuggageType[]).map((type) => {
              const info = LUGGAGE_OPTIONS[type];
              const Icon = LUGGAGE_ICONS[type];
              const isSelected = style.luggageType === type;

              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChangeStyle({ ...style, luggageType: type })}
                  className={`min-h-14 p-4 rounded-lg border text-left flex flex-col justify-between gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A] ${
                    isSelected
                      ? 'bg-[#E9F0EC] border-[#1F4D3A]'
                      : 'bg-white border-[#E2DDD3] hover:bg-[#F7F5F0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon
                      className={`w-5 h-5 ${isSelected ? 'text-[#1F4D3A]' : 'text-[#5A655E]'}`}
                    />
                    <span className="text-xs font-mono text-[#5A655E] tabular-nums">
                      ~{info.capacityLitres * travelers} L{travelers > 1 ? ' total' : ''}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C2420]">{info.label}</p>
                    <p className="text-xs text-[#5A655E] mt-0.5 leading-snug">
                      {info.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Laundry Toggle */}
        <div className="pt-4 border-t border-[#EFECE4]">
          <button
            type="button"
            role="switch"
            aria-checked={style.laundry}
            onClick={() => onChangeStyle({ ...style, laundry: !style.laundry })}
            className="w-full min-h-14 p-4 rounded-lg border border-[#E2DDD3] bg-[#F7F5F0] hover:bg-[#EFECE4]/70 flex items-center justify-between gap-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
          >
            <div className="flex items-start gap-3">
              <Shirt className="w-5 h-5 text-[#1F4D3A] mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#1C2420]">
                  I&rsquo;ll do laundry during the trip
                </p>
                <p className="text-xs text-[#5A655E] mt-0.5">
                  Caps everyday clothes at 4 days and adds travel detergent sheets
                  {durationDays > 4
                    ? ` (saves ${durationDays - 4} days of clothing bulk).`
                    : '.'}
                </p>
              </div>
            </div>

            <span
              aria-hidden="true"
              className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center ${
                style.laundry ? 'bg-[#1F4D3A] justify-end' : 'bg-[#D2CCC0] justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
            </span>
          </button>
        </div>
      </div>

      {/* Desktop & Sticky Mobile Action Bar */}
      <div className="fixed bottom-0 inset-x-0 md:static z-20 bg-[#F7F5F0]/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t border-[#E2DDD3] md:border-0 px-4 py-3 md:px-0 md:pt-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 px-4 py-2.5 text-sm font-medium text-[#1C2420] bg-white hover:bg-[#EFECE4] border border-[#E2DDD3] rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to trip</span>
          </button>

          <button
            type="submit"
            className="min-h-11 px-6 py-2.5 text-sm font-medium text-white bg-[#D9734E] hover:bg-[#C25E3A] rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Build packing list</span>
          </button>
        </div>
      </div>
    </form>
  );
};

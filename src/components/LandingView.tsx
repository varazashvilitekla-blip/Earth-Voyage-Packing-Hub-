import React, { useState } from 'react';
import { ArrowRight, Luggage, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { GeoLocation, LUGGAGE_OPTIONS, PackingTrip } from '../types/packing';
import { formatDateRange } from '../utils/dateUtils';
import { CitySearchInput, formatLocationLabel } from './CitySearchInput';
import { ResilientImage } from './ResilientImage';

import heroImage from '../assets/images/hero_earth_voyage_1793513661699.jpg';
import kyotoImage from '../assets/images/dest_kyoto_autumn_1793513661943.jpg';
import lisbonImage from '../assets/images/dest_lisbon_coast_1793513663355.jpg';
import icelandImage from '../assets/images/dest_iceland_highlands_1793513664103.jpg';

interface FeaturedDestination {
  location: GeoLocation;
  seasonNote: string;
  image: string;
}

const FEATURED_DESTINATIONS: FeaturedDestination[] = [
  {
    location: {
      id: 'preset-kyoto',
      name: 'Kyoto',
      admin1: 'Kyoto',
      country: 'Japan',
      countryCode: 'JP',
      latitude: 35.0116,
      longitude: 135.7681,
      timezone: 'Asia/Tokyo',
    },
    seasonNote: 'Temple walks, layered mornings & light rain gear',
    image: kyotoImage,
  },
  {
    location: {
      id: 'preset-lisbon',
      name: 'Lisbon',
      admin1: 'Lisbon',
      country: 'Portugal',
      countryCode: 'PT',
      latitude: 38.7223,
      longitude: -9.1393,
      timezone: 'Europe/Lisbon',
    },
    seasonNote: 'Coastal sun, hill walking shoes & breezy evenings',
    image: lisbonImage,
  },
  {
    location: {
      id: 'preset-reykjavik',
      name: 'Reykjavik',
      admin1: 'Capital Region',
      country: 'Iceland',
      countryCode: 'IS',
      latitude: 64.1466,
      longitude: -21.9426,
      timezone: 'Atlantic/Reykjavik',
    },
    seasonNote: 'Thermal base layers, waterproof shell & hot springs',
    image: icelandImage,
  },
];

interface LandingViewProps {
  savedTrips: PackingTrip[];
  recentlyDeletedTrip: PackingTrip | null;
  onStartWithDestination: (query: string, location: GeoLocation | null) => void;
  onOpenSavedTrip: (tripId: string) => void;
  onDeleteSavedTrip: (tripId: string) => void;
  onUndoDeleteTrip: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  savedTrips,
  recentlyDeletedTrip,
  onStartWithDestination,
  onOpenSavedTrip,
  onDeleteSavedTrip,
  onUndoDeleteTrip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<GeoLocation | null>(null);

  const handleHeroStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onStartWithDestination(searchQuery, selectedLoc);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Editorial Hero Split */}
      <section className="pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <p className="text-sm font-medium text-[#1F4D3A]">
              Weather-informed travel checklists · Saved locally
            </p>

            <h1
              className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold text-[#1C2420] leading-[1.1] tracking-tight"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Pack what your trip actually calls for, nothing extra.
            </h1>

            <p className="text-base sm:text-lg text-[#5A655E] leading-relaxed max-w-xl">
              Enter where and when you are going. We check the 14-day Open-Meteo forecast—or last
              year&rsquo;s weather for the same dates on further-out trips—and build a practical
              checklist sized for your bag.
            </p>

            <form
              onSubmit={handleHeroStart}
              className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2DDD3] space-y-3 max-w-xl"
            >
              <CitySearchInput
                label="Where are you heading?"
                placeholder="Search any city (e.g. Kyoto, Lisbon, Oaxaca)"
                value={searchQuery}
                selectedLocation={selectedLoc}
                onChangeQuery={setSearchQuery}
                onSelectLocation={(loc) => setSelectedLoc(loc)}
                onEnterSubmit={() => handleHeroStart()}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-xs text-[#5A655E]">
                  Free Open-Meteo weather data · No account needed
                </p>
                <button
                  type="submit"
                  className="min-h-11 px-5 py-2.5 bg-[#1F4D3A] hover:bg-[#173B2C] text-white text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
                >
                  <span>Start planning</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[#E2DDD3] min-h-[280px] sm:min-h-[360px]">
            <ResilientImage
              src={heroImage}
              alt="Canvas weekender bag packed with folded linen clothes, notebook, and walking shoes overlooking coastal hills"
              fallbackTitle="Earth Voyage Hub"
              className="w-full h-full lg:h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 text-[#F7F5F0]">
              <p className="font-display text-lg font-medium leading-snug">
                Pack lighter with a 4-day laundry cap
              </p>
              <p className="text-xs text-[#F7F5F0]/85 mt-1">
                Quantities adjust to forecast lows, rainy days, planned activities, and bag space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Saved Packing Lists */}
      <section id="saved-lists" className="scroll-mt-24 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E2DDD3] pb-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C2420]">
              Saved packing lists
            </h2>
            <p className="text-sm text-[#5A655E] mt-1">
              Stored in your browser so checked items survive page reloads.
            </p>
          </div>

          {savedTrips.length > 0 && (
            <button
              type="button"
              onClick={() => onStartWithDestination('', null)}
              className="min-h-11 px-4 py-2 text-sm font-medium text-[#1F4D3A] hover:bg-[#EFECE4] rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Start another list</span>
            </button>
          )}
        </div>

        {recentlyDeletedTrip && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 bg-[#EFECE4] border border-[#E2DDD3] rounded-lg px-4 py-3 text-sm text-[#1C2420]"
          >
            <span>
              Deleted list for{' '}
              <strong>
                {recentlyDeletedTrip.trip.location
                  ? formatLocationLabel(recentlyDeletedTrip.trip.location)
                  : recentlyDeletedTrip.trip.destinationQuery}
              </strong>
              .
            </span>
            <button
              type="button"
              onClick={onUndoDeleteTrip}
              className="min-h-11 px-3 py-1.5 font-medium text-[#1F4D3A] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Undo</span>
            </button>
          </div>
        )}

        {savedTrips.length === 0 ? (
          <div className="bg-white border border-[#E2DDD3] rounded-xl p-8 sm:p-10 text-center max-w-2xl mx-auto">
            <Luggage className="w-9 h-9 text-[#D9734E] mx-auto mb-3" aria-hidden="true" />
            <h3 className="font-display text-xl font-semibold text-[#1C2420]">
              No saved packing lists yet
            </h3>
            <p className="text-sm text-[#5A655E] mt-2 max-w-md mx-auto">
              Once you create a packing list, it appears here automatically so you can check off
              items as you pack.
            </p>
            <button
              type="button"
              onClick={() => onStartWithDestination('', null)}
              className="mt-5 min-h-11 px-5 py-2.5 bg-[#1F4D3A] hover:bg-[#173B2C] text-white text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Create your first list</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedTrips.map((saved) => {
              const totalCount = saved.items.length;
              const packedCount = saved.items.filter((i) => i.packed).length;
              const percent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
              const title = saved.trip.location
                ? `${saved.trip.location.name}, ${saved.trip.location.country}`
                : saved.trip.destinationQuery;

              return (
                <article
                  key={saved.id}
                  className="bg-white border border-[#E2DDD3] rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-[#1F4D3A]/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl font-semibold text-[#1C2420] leading-snug">
                        {title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onDeleteSavedTrip(saved.id)}
                        aria-label={`Delete packing list for ${title}`}
                        className="min-w-11 min-h-11 -mr-2 -mt-2 flex items-center justify-center text-[#5A655E] hover:text-[#B93829] rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Zero-pill clean metadata with middot separators */}
                    <p className="text-xs text-[#5A655E] tabular-nums">
                      <span>
                        {formatDateRange(saved.trip.departureDate, saved.trip.returnDate)}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {saved.durationDays} {saved.durationDays === 1 ? 'day' : 'days'}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{LUGGAGE_OPTIONS[saved.style.luggageType].label}</span>
                    </p>

                    {saved.weather.mode !== 'manual' &&
                      saved.weather.avgHighC !== undefined &&
                      saved.weather.avgLowC !== undefined && (
                        <p className="text-xs text-[#5A655E] tabular-nums">
                          <span>
                            Avg {saved.weather.avgHighC}°C / {saved.weather.avgLowC}°C
                          </span>
                          {typeof saved.weather.rainyDays === 'number' && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span>
                                {saved.weather.rainyDays === 0
                                  ? 'No rain days'
                                  : `Rain on ${saved.weather.rainyDays}d`}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#EFECE4]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#5A655E] tabular-nums">
                        <span>
                          {packedCount} of {totalCount} packed
                        </span>
                        <span className="font-mono">{percent}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#EFECE4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1F4D3A] transition-transform duration-200 origin-left"
                          style={{ transform: `scaleX(${percent / 100})` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenSavedTrip(saved.id)}
                      className="w-full min-h-11 px-4 py-2 bg-[#F7F5F0] hover:bg-[#E9F0EC] text-[#1F4D3A] text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <span>Open checklist</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick-Start Destination Ideas */}
      <section className="space-y-5">
        <div className="border-b border-[#E2DDD3] pb-3">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C2420]">
            Quick-start destinations
          </h2>
          <p className="text-sm text-[#5A655E] mt-1">
            Pick a sample destination to pre-fill coordinates and see real seasonal weather in action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_DESTINATIONS.map((item) => {
            const label = formatLocationLabel(item.location);
            return (
              <button
                key={item.location.id}
                type="button"
                onClick={() => onStartWithDestination(label, item.location)}
                className="group bg-white border border-[#E2DDD3] rounded-xl overflow-hidden text-left flex flex-col hover:border-[#1F4D3A]/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#EFECE4]">
                  <ResilientImage
                    src={item.image}
                    alt={`${item.location.name}, ${item.location.country}`}
                    fallbackTitle={item.location.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#5A655E]">{item.location.country}</p>
                    <h3 className="font-display text-xl font-semibold text-[#1C2420] mt-0.5">
                      {item.location.name}
                    </h3>
                    <p className="text-sm text-[#5A655E] mt-1.5 leading-snug">
                      {item.seasonNote}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[#D9734E] group-hover:text-[#C25E3A] inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span>Plan {item.location.name} trip</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

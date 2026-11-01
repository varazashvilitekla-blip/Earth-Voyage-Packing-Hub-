import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Loader2, Minus, Plus, Users } from 'lucide-react';
import { GeoLocation, TripDetails } from '../types/packing';
import { searchCities } from '../services/weatherService';
import {
  addDaysISO,
  calculateTripDays,
  diffCalendarDays,
  getLocalTodayISO,
} from '../utils/dateUtils';
import { CitySearchInput, formatLocationLabel } from './CitySearchInput';

interface TripStepFormProps {
  trip: TripDetails;
  isEditingExisting: boolean;
  onChangeTrip: (updated: TripDetails) => void;
  onBack: () => void;
  onContinue: (validatedTrip: TripDetails) => void;
}

interface TripErrors {
  destination?: string;
  departureDate?: string;
  returnDate?: string;
}

export const TripStepForm: React.FC<TripStepFormProps> = ({
  trip,
  isEditingExisting,
  onChangeTrip,
  onBack,
  onContinue,
}) => {
  const [errors, setErrors] = useState<TripErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isResolvingCity, setIsResolvingCity] = useState(false);

  const todayISO = getLocalTodayISO();
  const durationDays =
    trip.departureDate && trip.returnDate
      ? calculateTripDays(trip.departureDate, trip.returnDate)
      : null;

  const daysUntilReturn =
    trip.returnDate ? diffCalendarDays(todayISO, trip.returnDate) : null;
  const daysUntilDeparture =
    trip.departureDate ? diffCalendarDays(todayISO, trip.departureDate) : null;

  const validateSync = (draft: TripDetails): TripErrors => {
    const nextErrors: TripErrors = {};

    if (!draft.destinationQuery.trim()) {
      nextErrors.destination = 'Please enter a destination city.';
    }

    if (!draft.departureDate) {
      nextErrors.departureDate = 'Departure date is required.';
    } else {
      const fromToday = diffCalendarDays(todayISO, draft.departureDate);
      if (fromToday === null) {
        nextErrors.departureDate = 'Enter a valid departure date.';
      } else if (fromToday < 0) {
        nextErrors.departureDate = 'Departure date cannot be in the past.';
      }
    }

    if (!draft.returnDate) {
      nextErrors.returnDate = 'Return date is required.';
    } else if (draft.departureDate) {
      const span = calculateTripDays(draft.departureDate, draft.returnDate);
      if (span === null) {
        nextErrors.returnDate = 'Enter a valid return date.';
      } else if (span < 1) {
        nextErrors.returnDate = 'Return date must be on or after your departure date.';
      } else if (span > 30) {
        nextErrors.returnDate = 'Maximum trip length is 30 days.';
      }
    }

    return nextErrors;
  };

  const handleFieldChange = (updated: TripDetails, fieldName: string) => {
    onChangeTrip(updated);
    if (touched[fieldName] || Object.keys(errors).length > 0) {
      setErrors(validateSync(updated));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ destination: true, departureDate: true, returnDate: true });

    const syncErrors = validateSync(trip);
    if (Object.keys(syncErrors).length > 0) {
      setErrors(syncErrors);
      return;
    }

    let resolvedLocation: GeoLocation | null = trip.location;
    let resolvedQuery = trip.destinationQuery.trim();

    // If user typed a city name without clicking a suggestion, resolve top match via Open-Meteo
    if (!resolvedLocation) {
      setIsResolvingCity(true);
      try {
        const matches = await searchCities(resolvedQuery);
        if (matches.length === 0) {
          setErrors({
            ...syncErrors,
            destination:
              'No matching city found. Check the spelling or choose a city from the dropdown.',
          });
          setIsResolvingCity(false);
          return;
        }
        resolvedLocation = matches[0];
        resolvedQuery = formatLocationLabel(resolvedLocation);
      } catch {
        // Network / API unreachable: allow continuing with an unverified coordinate placeholder
        // so the Weather Error screen can offer "Try again" or Manual Climate selection.
        resolvedLocation = {
          id: `manual-${Date.now()}`,
          name: resolvedQuery,
          country: '',
          latitude: Number.NaN,
          longitude: Number.NaN,
        };
      } finally {
        setIsResolvingCity(false);
      }
    }

    const updatedTrip: TripDetails = {
      ...trip,
      destinationQuery: resolvedQuery,
      location: resolvedLocation,
    };
    onChangeTrip(updatedTrip);
    setErrors({});
    onContinue(updatedTrip);
  };

  const nightsCount = durationDays && durationDays > 0 ? durationDays - 1 : 0;
  const maxAllowedReturnDate = trip.departureDate
    ? addDaysISO(trip.departureDate, 29)
    : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto pb-24 md:pb-12">
      <div className="bg-white border border-[#E2DDD3] rounded-xl p-5 sm:p-8 space-y-7">
        <div className="border-b border-[#EFECE4] pb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C2420]">
            {isEditingExisting ? 'Update trip details' : 'Where and when are you traveling?'}
          </h1>
          <p className="text-sm text-[#5A655E] mt-1">
            We use your destination and dates to check local temperatures and rainfall.
          </p>
        </div>

        {/* Destination */}
        <div>
          <CitySearchInput
            id="trip-destination"
            label="Destination city"
            value={trip.destinationQuery}
            selectedLocation={trip.location}
            error={errors.destination}
            onChangeQuery={(q) =>
              handleFieldChange({ ...trip, destinationQuery: q }, 'destination')
            }
            onSelectLocation={(loc) => {
              const updated = {
                ...trip,
                location: loc,
                destinationQuery: loc ? formatLocationLabel(loc) : trip.destinationQuery,
              };
              onChangeTrip(updated);
              if (loc && errors.destination) {
                const rest = { ...errors };
                delete rest.destination;
                setErrors(rest);
              }
            }}
          />
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="departure-date"
                className="block text-sm font-medium text-[#1C2420] mb-1.5"
              >
                Departure date
              </label>
              <div className="relative">
                <input
                  id="departure-date"
                  type="date"
                  min={todayISO}
                  value={trip.departureDate}
                  aria-invalid={Boolean(errors.departureDate)}
                  aria-describedby={errors.departureDate ? 'departure-error' : undefined}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, departureDate: true }));
                    setErrors(validateSync(trip));
                  }}
                  onChange={(e) => {
                    const nextDep = e.target.value;
                    let nextRet = trip.returnDate;
                    // Auto-bump return date if empty or before new departure
                    if (nextDep && (!nextRet || (diffCalendarDays(nextDep, nextRet) ?? -1) < 0)) {
                      nextRet = addDaysISO(nextDep, 4);
                    }
                    handleFieldChange(
                      { ...trip, departureDate: nextDep, returnDate: nextRet },
                      'departureDate'
                    );
                  }}
                  className={`w-full min-h-12 px-3.5 py-2.5 bg-white text-[#1C2420] text-base rounded-lg border font-mono tabular-nums transition-colors focus:outline-none focus:ring-2 ${
                    errors.departureDate
                      ? 'border-[#B93829] focus:ring-[#B93829]/25'
                      : 'border-[#E2DDD3] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]/20'
                  }`}
                />
              </div>
              {errors.departureDate && (
                <p id="departure-error" role="alert" className="mt-1.5 text-sm text-[#B93829]">
                  {errors.departureDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="return-date"
                className="block text-sm font-medium text-[#1C2420] mb-1.5"
              >
                Return date
              </label>
              <div className="relative">
                <input
                  id="return-date"
                  type="date"
                  min={trip.departureDate || todayISO}
                  max={maxAllowedReturnDate}
                  value={trip.returnDate}
                  aria-invalid={Boolean(errors.returnDate)}
                  aria-describedby={errors.returnDate ? 'return-error' : undefined}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, returnDate: true }));
                    setErrors(validateSync(trip));
                  }}
                  onChange={(e) =>
                    handleFieldChange({ ...trip, returnDate: e.target.value }, 'returnDate')
                  }
                  className={`w-full min-h-12 px-3.5 py-2.5 bg-white text-[#1C2420] text-base rounded-lg border font-mono tabular-nums transition-colors focus:outline-none focus:ring-2 ${
                    errors.returnDate
                      ? 'border-[#B93829] focus:ring-[#B93829]/25'
                      : 'border-[#E2DDD3] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]/20'
                  }`}
                />
              </div>
              {errors.returnDate && (
                <p id="return-error" role="alert" className="mt-1.5 text-sm text-[#B93829]">
                  {errors.returnDate}
                </p>
              )}
            </div>
          </div>

          {/* Auto-calculated duration summary */}
          {durationDays !== null && durationDays >= 1 && durationDays <= 30 && (() => {
            const hasForecastNote =
              daysUntilDeparture !== null &&
              daysUntilDeparture >= 0 &&
              daysUntilReturn !== null;

            const forecastText = hasForecastNote
              ? daysUntilReturn <= 14
                ? 'Within 14 days — uses live weather forecast'
                : 'Beyond 14 days — uses historical weather for these dates last year'
              : null;

            return (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-[#F7F5F0] border border-[#E2DDD3] rounded-lg px-3.5 py-2.5 text-sm text-[#1C2420] tabular-nums">
                <div className="inline-flex items-center gap-2 shrink-0">
                  <Calendar className="w-4 h-4 text-[#1F4D3A] shrink-0" aria-hidden="true" />
                  <span className="font-medium">
                    {durationDays} {durationDays === 1 ? 'day' : 'days'}
                    {nightsCount > 0
                      ? ` (${nightsCount} ${nightsCount === 1 ? 'night' : 'nights'})`
                      : ' (day trip)'}
                  </span>
                </div>
                {forecastText ? (
                  <span className="text-[#5A655E] inline-flex items-center gap-2">
                    <span aria-hidden="true" className="text-[#5A655E] hidden sm:inline">
                      ·
                    </span>
                    <span>{forecastText}</span>
                  </span>
                ) : null}
              </div>
            );
          })()}
        </div>

        {/* Travelers Stepper */}
        <div className="pt-2 border-t border-[#EFECE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1F4D3A]" aria-hidden="true" />
              <span id="travelers-label" className="text-sm font-medium text-[#1C2420]">
                Travelers
              </span>
            </div>
            <p className="text-xs text-[#5A655E] mt-0.5">
              Personal clothing and bag estimates scale by traveler count.
            </p>
          </div>

          <div
            role="group"
            aria-labelledby="travelers-label"
            className="inline-flex items-center gap-3 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() =>
                onChangeTrip({ ...trip, travelers: Math.max(1, trip.travelers - 1) })
              }
              disabled={trip.travelers <= 1}
              aria-label="Decrease travelers"
              className="min-w-11 min-h-11 rounded-lg border border-[#E2DDD3] bg-[#F7F5F0] hover:bg-[#EFECE4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-[#1C2420] transition-colors focus-visible:outline-2 focus-visible:outline-[#1F4D3A]"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>

            <span
              aria-live="polite"
              className="w-16 text-center font-mono text-base font-medium text-[#1C2420] tabular-nums"
            >
              {trip.travelers}
            </span>

            <button
              type="button"
              onClick={() =>
                onChangeTrip({ ...trip, travelers: Math.min(12, trip.travelers + 1) })
              }
              disabled={trip.travelers >= 12}
              aria-label="Increase travelers"
              className="min-w-11 min-h-11 rounded-lg border border-[#E2DDD3] bg-[#F7F5F0] hover:bg-[#EFECE4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-[#1C2420] transition-colors focus-visible:outline-2 focus-visible:outline-[#1F4D3A]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop & Sticky Mobile Action Bar */}
      <div className="fixed bottom-0 inset-x-0 md:static z-20 bg-[#F7F5F0]/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t border-[#E2DDD3] md:border-0 px-4 py-3 md:px-0 md:pt-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 px-4 py-2.5 text-sm font-medium text-[#1C2420] bg-white hover:bg-[#EFECE4] border border-[#E2DDD3] rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>

          <button
            type="submit"
            disabled={isResolvingCity}
            className="min-h-11 px-6 py-2.5 text-sm font-medium text-white bg-[#1F4D3A] hover:bg-[#173B2C] disabled:opacity-60 rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            {isResolvingCity ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Checking city...</span>
              </>
            ) : (
              <>
                <span>Continue to style</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

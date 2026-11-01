/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  GeoLocation,
  ManualClimate,
  PackingItem,
  PackingTrip,
  StylePreferences,
  TripDetails,
  WeatherSummary,
} from './types/packing';
import { fetchTripWeather, searchCities } from './services/weatherService';
import { addDaysISO, calculateTripDays, getLocalTodayISO } from './utils/dateUtils';
import { buildManualWeatherSummary, generatePackingItems } from './utils/packingGenerator';
import { AppScreen, Navbar } from './components/Navbar';
import { Stepper, WizardStep } from './components/Stepper';
import { LandingView } from './components/LandingView';
import { TripStepForm } from './components/TripStepForm';
import { StyleStepForm } from './components/StyleStepForm';
import { LoadingSkeleton, WeatherErrorView } from './components/LoadingSkeleton';
import { ResultsView } from './components/ResultsView';
import { formatLocationLabel } from './components/CitySearchInput';

const STORAGE_TRIPS_KEY = 'earth_voyage_saved_trips_v1';
const STORAGE_SESSION_KEY = 'earth_voyage_active_session_v1';

interface PersistedSession {
  screen: 'landing' | 'results';
  activeTripId: string | null;
}

function loadSavedTrips(): PackingTrip[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_TRIPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function loadSession(): PersistedSession {
  try {
    const raw = window.localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return { screen: 'landing', activeTripId: null };
    const parsed = JSON.parse(raw) as PersistedSession;
    return {
      screen: parsed.screen === 'results' ? 'results' : 'landing',
      activeTripId: parsed.activeTripId || null,
    };
  } catch {
    return { screen: 'landing', activeTripId: null };
  }
}

const createEmptyTrip = (): TripDetails => ({
  destinationQuery: '',
  location: null,
  departureDate: '',
  returnDate: '',
  travelers: 1,
});

const createDefaultStyle = (): StylePreferences => ({
  activities: [],
  luggageType: 'carry-on',
  laundry: false,
});

export default function App() {
  const [savedTrips, setSavedTrips] = useState<PackingTrip[]>(() => loadSavedTrips());
  const initialSession = loadSession();

  const [screen, setScreen] = useState<AppScreen>(() => {
    if (
      initialSession.screen === 'results' &&
      initialSession.activeTripId &&
      loadSavedTrips().some((t) => t.id === initialSession.activeTripId)
    ) {
      return 'results';
    }
    return 'landing';
  });

  const [activeTripId, setActiveTripId] = useState<string | null>(() =>
    initialSession.activeTripId
  );

  // Draft state for Trip & Style wizard steps
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [draftTrip, setDraftTrip] = useState<TripDetails>(createEmptyTrip);
  const [draftStyle, setDraftStyle] = useState<StylePreferences>(createDefaultStyle);

  // Weather error state during generation
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Undo deleted saved trip from Landing
  const [recentlyDeletedTrip, setRecentlyDeletedTrip] = useState<PackingTrip | null>(null);

  // Persist savedTrips whenever they change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_TRIPS_KEY, JSON.stringify(savedTrips));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedTrips]);

  // Persist current viewing session (landing vs active checklist) so reload keeps user in place
  useEffect(() => {
    try {
      const sessionPayload: PersistedSession = {
        screen: screen === 'results' && activeTripId ? 'results' : 'landing',
        activeTripId: screen === 'results' ? activeTripId : null,
      };
      window.localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionPayload));
    } catch {
      // Ignore storage errors
    }
  }, [screen, activeTripId]);

  const activePackingTrip = savedTrips.find((t) => t.id === activeTripId) || null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewTrip = () => {
    setEditingTripId(null);
    setDraftTrip(createEmptyTrip());
    setDraftStyle(createDefaultStyle());
    setWeatherError(null);
    setScreen('trip');
    scrollToTop();
  };

  const handleStartWithDestination = (query: string, location: GeoLocation | null) => {
    const isPresetCard = Boolean(location && location.id.startsWith('preset-'));
    const today = getLocalTodayISO();

    setEditingTripId(null);
    setDraftTrip({
      destinationQuery: location ? formatLocationLabel(location) : query,
      location,
      departureDate: isPresetCard ? addDaysISO(today, 4) : '',
      returnDate: isPresetCard ? addDaysISO(today, 9) : '',
      travelers: 1,
    });
    setDraftStyle({
      activities: isPresetCard ? ['sightseeing'] : [],
      luggageType: 'carry-on',
      laundry: false,
    });
    setWeatherError(null);
    setScreen('trip');
    scrollToTop();
  };

  const handleGoHome = () => {
    setWeatherError(null);
    setScreen('landing');
    scrollToTop();
  };

  const handleGoSavedLists = () => {
    setWeatherError(null);
    setScreen('landing');
    window.setTimeout(() => {
      const el = document.getElementById('saved-lists');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  const handleOpenSavedTrip = (tripId: string) => {
    setActiveTripId(tripId);
    setWeatherError(null);
    setScreen('results');
    scrollToTop();
  };

  const handleDeleteSavedTrip = (tripId: string) => {
    const target = savedTrips.find((t) => t.id === tripId);
    if (!target) return;
    setRecentlyDeletedTrip(target);
    setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
    if (activeTripId === tripId) {
      setActiveTripId(null);
    }
  };

  const handleUndoDeleteTrip = () => {
    if (!recentlyDeletedTrip) return;
    setSavedTrips((prev) => [recentlyDeletedTrip, ...prev]);
    setRecentlyDeletedTrip(null);
  };

  const finalizePackingTrip = (
    tripToUse: TripDetails,
    styleToUse: StylePreferences,
    weatherSummary: WeatherSummary
  ) => {
    const durationDays = Math.max(
      1,
      calculateTripDays(tripToUse.departureDate, tripToUse.returnDate) ?? 1
    );

    const existingTrip = editingTripId
      ? savedTrips.find((t) => t.id === editingTripId)
      : undefined;

    const generatedItems = generatePackingItems({
      trip: tripToUse,
      style: styleToUse,
      durationDays,
      weather: weatherSummary,
      previousItems: existingTrip?.items,
    });

    const nowISO = new Date().toISOString();

    if (existingTrip) {
      const updatedTrip: PackingTrip = {
        ...existingTrip,
        updatedAt: nowISO,
        trip: tripToUse,
        style: styleToUse,
        durationDays,
        weather: weatherSummary,
        items: generatedItems,
      };
      setSavedTrips((prev) =>
        [updatedTrip, ...prev.filter((t) => t.id !== existingTrip.id)]
      );
      setActiveTripId(updatedTrip.id);
    } else {
      const newTrip: PackingTrip = {
        id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: nowISO,
        updatedAt: nowISO,
        trip: tripToUse,
        style: styleToUse,
        durationDays,
        weather: weatherSummary,
        items: generatedItems,
      };
      setSavedTrips((prev) => [newTrip, ...prev]);
      setActiveTripId(newTrip.id);
    }

    setEditingTripId(null);
    setWeatherError(null);
    setScreen('results');
    scrollToTop();
  };

  const executeWeatherAndGenerate = async (
    tripToUse: TripDetails,
    styleToUse: StylePreferences
  ) => {
    setScreen('loading');
    setWeatherError(null);
    scrollToTop();

    const minSkeletonDelay = new Promise((resolve) => window.setTimeout(resolve, 350));

    try {
      let loc = tripToUse.location;

      // If coordinates were previously unresolved due to offline state, retry geocoding first
      if (!loc || Number.isNaN(loc.latitude) || Number.isNaN(loc.longitude)) {
        const matches = await searchCities(tripToUse.destinationQuery);
        if (matches.length === 0) {
          throw new Error('Could not resolve coordinates for this destination.');
        }
        loc = matches[0];
        tripToUse = {
          ...tripToUse,
          location: loc,
          destinationQuery: formatLocationLabel(loc),
        };
        setDraftTrip(tripToUse);
      }

      const [weather] = await Promise.all([
        fetchTripWeather(loc, tripToUse.departureDate, tripToUse.returnDate),
        minSkeletonDelay,
      ]);

      finalizePackingTrip(tripToUse, styleToUse, weather);
    } catch (err) {
      await minSkeletonDelay;
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to reach Open-Meteo weather service.';
      setWeatherError(msg);
    }
  };

  const handleUseManualClimate = (climate: ManualClimate) => {
    const manualWeather = buildManualWeatherSummary(climate);
    finalizePackingTrip(draftTrip, draftStyle, manualWeather);
  };

  const handleUpdateActiveItems = (nextItems: PackingItem[]) => {
    if (!activeTripId) return;
    const nowISO = new Date().toISOString();
    setSavedTrips((prev) =>
      prev.map((t) =>
        t.id === activeTripId ? { ...t, updatedAt: nowISO, items: nextItems } : t
      )
    );
  };

  const handleEditActiveTrip = () => {
    if (!activePackingTrip) return;
    setEditingTripId(activePackingTrip.id);
    setDraftTrip(activePackingTrip.trip);
    setDraftStyle(activePackingTrip.style);
    setWeatherError(null);
    setScreen('trip');
    scrollToTop();
  };

  const handleSelectWizardStep = (step: WizardStep) => {
    if (step === 'trip') {
      if (screen === 'results' && activePackingTrip) {
        handleEditActiveTrip();
      } else {
        setScreen('trip');
      }
    } else if (step === 'style') {
      if (screen === 'results' && activePackingTrip) {
        setEditingTripId(activePackingTrip.id);
        setDraftTrip(activePackingTrip.trip);
        setDraftStyle(activePackingTrip.style);
      }
      setScreen('style');
    } else if (step === 'results' && activePackingTrip) {
      setScreen('results');
    }
    scrollToTop();
  };

  const draftDurationDays =
    calculateTripDays(draftTrip.departureDate, draftTrip.returnDate) ?? 1;

  const destinationShortName =
    draftTrip.location?.name || draftTrip.destinationQuery || 'your destination';

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#1C2420]">
      <Navbar
        currentScreen={screen}
        savedCount={savedTrips.length}
        onGoHome={handleGoHome}
        onGoSavedLists={handleGoSavedLists}
        onStartNewTrip={handleStartNewTrip}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        {screen !== 'landing' && (
          <div className="max-w-4xl mx-auto mb-2">
            <Stepper
              activeStep={
                screen === 'trip'
                  ? 'trip'
                  : screen === 'style'
                  ? 'style'
                  : 'results'
              }
              canNavigateToStyle={Boolean(
                draftTrip.destinationQuery && draftTrip.departureDate && draftTrip.returnDate
              )}
              canNavigateToResults={Boolean(activePackingTrip)}
              onSelectStep={screen === 'loading' ? undefined : handleSelectWizardStep}
            />
          </div>
        )}

        {screen === 'landing' && (
          <LandingView
            savedTrips={savedTrips}
            recentlyDeletedTrip={recentlyDeletedTrip}
            onStartWithDestination={handleStartWithDestination}
            onOpenSavedTrip={handleOpenSavedTrip}
            onDeleteSavedTrip={handleDeleteSavedTrip}
            onUndoDeleteTrip={handleUndoDeleteTrip}
          />
        )}

        {screen === 'trip' && (
          <TripStepForm
            trip={draftTrip}
            isEditingExisting={Boolean(editingTripId)}
            onChangeTrip={setDraftTrip}
            onBack={() => {
              if (editingTripId && activePackingTrip) {
                setScreen('results');
              } else {
                setScreen('landing');
              }
              scrollToTop();
            }}
            onContinue={(validatedTrip) => {
              setDraftTrip(validatedTrip);
              setScreen('style');
              scrollToTop();
            }}
          />
        )}

        {screen === 'style' && (
          <StyleStepForm
            style={draftStyle}
            durationDays={Math.max(1, draftDurationDays)}
            travelers={draftTrip.travelers}
            onChangeStyle={setDraftStyle}
            onBack={() => {
              setScreen('trip');
              scrollToTop();
            }}
            onSubmit={() => executeWeatherAndGenerate(draftTrip, draftStyle)}
          />
        )}

        {screen === 'loading' &&
          (weatherError ? (
            <WeatherErrorView
              destinationName={destinationShortName}
              errorMessage={weatherError}
              onRetry={() => executeWeatherAndGenerate(draftTrip, draftStyle)}
              onUseManualClimate={handleUseManualClimate}
              onBackToTrip={() => {
                setWeatherError(null);
                setScreen('trip');
              }}
            />
          ) : (
            <LoadingSkeleton destinationName={destinationShortName} />
          ))}

        {screen === 'results' && activePackingTrip && (
          <ResultsView
            packingTrip={activePackingTrip}
            onUpdateItems={handleUpdateActiveItems}
            onEditTrip={handleEditActiveTrip}
          />
        )}
      </main>

      <footer className="no-print border-t border-[#E2DDD3] bg-[#F7F5F0] py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5A655E]">
          <span>Earth Voyage Hub · Practical travel checklists</span>
          <span>
            Weather data powered by Open-Meteo Forecast &amp; Historical Archive APIs · Lists saved locally
          </span>
        </div>
      </footer>
    </div>
  );
}

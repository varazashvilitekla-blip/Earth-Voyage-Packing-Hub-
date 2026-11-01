import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { GeoLocation } from '../types/packing';
import { searchCities } from '../services/weatherService';

interface CitySearchInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  selectedLocation: GeoLocation | null;
  error?: string;
  onChangeQuery: (query: string) => void;
  onSelectLocation: (loc: GeoLocation | null) => void;
  onEnterSubmit?: () => void;
}

export function formatLocationLabel(loc: GeoLocation): string {
  const parts = [loc.name];
  if (loc.admin1 && loc.admin1 !== loc.name) {
    parts.push(loc.admin1);
  }
  if (loc.country) {
    parts.push(loc.country);
  }
  return parts.join(', ');
}

export const CitySearchInput: React.FC<CitySearchInputProps> = ({
  id,
  label,
  placeholder = 'Search a city or town (e.g. Kyoto, Lisbon, Vancouver)',
  value,
  selectedLocation,
  error,
  onChangeQuery,
  onSelectLocation,
  onEnterSubmit,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;

  const [results, setResults] = useState<GeoLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setSearchError(null);
      return;
    }

    // If input still matches selectedLocation label, don't re-open dropdown
    if (selectedLocation && formatLocationLabel(selectedLocation) === value) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setSearchError(null);

    const timer = window.setTimeout(async () => {
      try {
        const matches = await searchCities(trimmed, controller.signal);
        setResults(matches);
        setHighlightedIndex(matches.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
          setSearchError('Live city suggestions unavailable right now — you can still continue.');
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 240);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, selectedLocation]);

  const handleChoose = (loc: GeoLocation) => {
    skipNextFetchRef.current = true;
    const formatted = formatLocationLabel(loc);
    onChangeQuery(formatted);
    onSelectLocation(loc);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChangeQuery('');
    onSelectLocation(null);
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOpen && results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
        return;
      }
      if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < results.length) {
        e.preventDefault();
        handleChoose(results[highlightedIndex]);
        return;
      }
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'Enter' && onEnterSubmit) {
      e.preventDefault();
      onEnterSubmit();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#1C2420] mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <Search
          className="w-4 h-4 text-[#5A655E] absolute left-3.5 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChangeQuery(e.target.value);
            if (selectedLocation) {
              onSelectLocation(null);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full min-h-12 pl-10 pr-10 py-2.5 bg-white text-[#1C2420] placeholder:text-[#5A655E]/70 text-base rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-[#B93829] focus:ring-[#B93829]/25'
              : 'border-[#E2DDD3] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]/20'
          }`}
        />

        {isLoading ? (
          <Loader2
            className="w-4 h-4 text-[#1F4D3A] animate-spin absolute right-3.5"
            aria-label="Searching cities"
          />
        ) : value.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear destination"
            className="absolute right-1.5 w-9 h-9 flex items-center justify-center text-[#5A655E] hover:text-[#1C2420] rounded-md focus-visible:outline-2 focus-visible:outline-[#1F4D3A]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen && (results.length > 0 || searchError || (!isLoading && value.trim().length >= 2)) && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-40 left-0 right-0 mt-1.5 bg-white border border-[#E2DDD3] rounded-lg shadow-lg overflow-hidden"
        >
          {results.length > 0 ? (
            <ul className="divide-y divide-[#EFECE4] max-h-64 overflow-y-auto">
              {results.map((loc, idx) => {
                const isActive = idx === highlightedIndex;
                return (
                  <li
                    key={loc.id}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleChoose(loc);
                    }}
                    className={`px-3.5 py-2.5 min-h-11 flex items-center justify-between gap-3 cursor-pointer text-sm transition-colors ${
                      isActive ? 'bg-[#E9F0EC] text-[#1F4D3A]' : 'text-[#1C2420] hover:bg-[#F7F5F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#1F4D3A]' : 'text-[#D9734E]'
                        }`}
                        aria-hidden="true"
                      />
                      <div className="truncate">
                        <span className="font-medium">{loc.name}</span>
                        {(loc.admin1 || loc.country) && (
                          <span className="text-[#5A655E]">
                            {' '}
                            · {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#5A655E] tabular-nums shrink-0">
                      {loc.latitude.toFixed(1)}°, {loc.longitude.toFixed(1)}°
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : searchError ? (
            <div className="px-4 py-3 text-xs text-[#5A655E]">{searchError}</div>
          ) : (
            <div className="px-4 py-3 text-sm text-[#5A655E]">
              No matching cities found for &ldquo;{value.trim()}&rdquo;. Check spelling or try a nearby city.
            </div>
          )}
        </div>
      )}

      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-[#B93829]">
          {error}
        </p>
      )}
    </div>
  );
};

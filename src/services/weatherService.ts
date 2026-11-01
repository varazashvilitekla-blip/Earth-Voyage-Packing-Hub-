import { DailyForecastPoint, GeoLocation, WeatherSummary } from '../types/packing';
import {
  addDaysISO,
  diffCalendarDays,
  formatDateRange,
  getLocalTodayISO,
  shiftISOYearsBack,
} from '../utils/dateUtils';

interface OpenMeteoGeoResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface OpenMeteoDailyResponse {
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_sum?: (number | null)[];
    weather_code?: (number | null)[];
  };
}

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=6&language=en&format=json`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`City search returned status ${response.status}`);
  }

  const data = (await response.json()) as { results?: OpenMeteoGeoResult[] };
  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.map((item) => ({
    id: `${item.id}-${item.latitude}-${item.longitude}`,
    name: item.name,
    admin1: item.admin1,
    country: item.country || item.country_code || 'Unknown',
    countryCode: item.country_code,
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
  }));
}

export async function fetchTripWeather(
  location: GeoLocation,
  departureDate: string,
  returnDate: string
): Promise<WeatherSummary> {
  const todayISO = getLocalTodayISO();
  const daysUntilEnd = diffCalendarDays(todayISO, returnDate);
  const daysUntilStart = diffCalendarDays(todayISO, departureDate);

  if (daysUntilEnd === null || daysUntilStart === null) {
    throw new Error('Invalid trip dates provided.');
  }

  // Use Open-Meteo Forecast API for trips within 14 days from today;
  // otherwise use Open-Meteo Historical Archive API for the same dates last year.
  const useForecast = daysUntilStart >= 0 && daysUntilEnd <= 14;

  let endpoint: string;
  let queryStartDate = departureDate;
  let queryEndDate = returnDate;
  let mode: 'forecast' | 'archive' = 'forecast';
  let sourceLabel = '14-day weather forecast (Open-Meteo)';
  let referenceRangeLabel: string | undefined;

  if (useForecast) {
    endpoint = 'https://api.open-meteo.com/v1/forecast';
  } else {
    mode = 'archive';
    endpoint = 'https://archive-api.open-meteo.com/v1/archive';

    // Default to 1 year prior ("same dates last year").
    // If the trip is scheduled > 1 year ahead so that 1 year prior is still in the future
    // or within the 5-day archive lag window, step back until the archive window is complete.
    let yearsBack = 1;
    const latestArchiveReadyDate = addDaysISO(todayISO, -5);
    while (
      yearsBack < 5 &&
      (diffCalendarDays(shiftISOYearsBack(returnDate, yearsBack), latestArchiveReadyDate) ?? -1) < 0
    ) {
      yearsBack += 1;
    }

    queryStartDate = shiftISOYearsBack(departureDate, yearsBack);
    queryEndDate = shiftISOYearsBack(returnDate, yearsBack);
    referenceRangeLabel = formatDateRange(queryStartDate, queryEndDate);
    sourceLabel =
      yearsBack === 1
        ? `Same dates last year: ${referenceRangeLabel} (Open-Meteo Archive)`
        : `Historical dates: ${referenceRangeLabel} (Open-Meteo Archive)`;
  }

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    timezone: 'auto',
    start_date: queryStartDate,
    end_date: queryEndDate,
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Weather service responded with ${response.status}`);
    }

    const json = (await response.json()) as OpenMeteoDailyResponse;
    const daily = json.daily;

    if (
      !daily ||
      !Array.isArray(daily.time) ||
      !Array.isArray(daily.temperature_2m_max) ||
      !Array.isArray(daily.temperature_2m_min) ||
      daily.time.length === 0
    ) {
      throw new Error('Weather data unavailable for these dates.');
    }

    const points: DailyForecastPoint[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      const maxT = daily.temperature_2m_max[i];
      const minT = daily.temperature_2m_min[i];
      if (typeof maxT === 'number' && typeof minT === 'number') {
        points.push({
          date: daily.time[i],
          maxTempC: maxT,
          minTempC: minT,
          precipitationMm:
            typeof daily.precipitation_sum?.[i] === 'number'
              ? (daily.precipitation_sum[i] as number)
              : 0,
          weatherCode:
            typeof daily.weather_code?.[i] === 'number'
              ? (daily.weather_code[i] as number)
              : undefined,
        });
      }
    }

    if (points.length === 0) {
      throw new Error('No complete daily weather measurements returned.');
    }

    const sumHigh = points.reduce((acc, p) => acc + p.maxTempC, 0);
    const sumLow = points.reduce((acc, p) => acc + p.minTempC, 0);
    const highestTempC = Math.round(Math.max(...points.map((p) => p.maxTempC)));
    const lowestTempC = Math.round(Math.min(...points.map((p) => p.minTempC)));
    const avgHighC = Math.round(sumHigh / points.length);
    const avgLowC = Math.round(sumLow / points.length);
    const rainyDays = points.filter((p) => p.precipitationMm >= 1.0).length;
    const snowyDays = points.filter(
      (p) =>
        (p.weatherCode !== undefined && SNOW_CODES.has(p.weatherCode)) ||
        (p.precipitationMm >= 1.0 && p.minTempC <= 0)
    ).length;

    return {
      mode,
      sourceLabel,
      referenceRangeLabel,
      avgHighC,
      avgLowC,
      highestTempC,
      lowestTempC,
      rainyDays,
      snowyDays,
      measuredDays: points.length,
      dailyPoints: points,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

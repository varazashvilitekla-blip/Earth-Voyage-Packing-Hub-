export interface GeoLocation {
  id: string;
  name: string;
  admin1?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export type ActivityId =
  | 'sightseeing'
  | 'hiking'
  | 'beach'
  | 'work'
  | 'dining'
  | 'fitness'
  | 'photography'
  | 'winter';

export type LuggageType = 'personal' | 'carry-on' | 'checked';

export type ManualClimate = 'cold' | 'mild' | 'warm' | 'hot';

export type CategoryId =
  | 'clothing'
  | 'outerwear'
  | 'footwear'
  | 'toiletries'
  | 'electronics'
  | 'documents'
  | 'gear';

export interface TripDetails {
  destinationQuery: string;
  location: GeoLocation | null;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  travelers: number;
}

export interface StylePreferences {
  activities: ActivityId[];
  luggageType: LuggageType;
  laundry: boolean;
}

export interface DailyForecastPoint {
  date: string;
  maxTempC: number;
  minTempC: number;
  precipitationMm: number;
  weatherCode?: number;
}

export interface WeatherSummary {
  mode: 'forecast' | 'archive' | 'manual';
  sourceLabel: string;
  referenceRangeLabel?: string;
  manualClimate?: ManualClimate;
  // Strictly populated from Open-Meteo when mode !== 'manual'; undefined in manual mode (never invented)
  avgHighC?: number;
  avgLowC?: number;
  highestTempC?: number;
  lowestTempC?: number;
  rainyDays?: number;
  snowyDays?: number;
  measuredDays?: number;
  dailyPoints?: DailyForecastPoint[];
}

export interface PackingItem {
  id: string;
  categoryId: CategoryId;
  name: string;
  reason: string;
  quantity: number;
  packed: boolean;
  volumeLitresPerUnit: number;
  isCustom?: boolean;
}

export interface PackingTrip {
  id: string;
  createdAt: string;
  updatedAt: string;
  trip: TripDetails;
  style: StylePreferences;
  durationDays: number;
  weather: WeatherSummary;
  items: PackingItem[];
}

export type FilterMode = 'all' | 'to-pack' | 'packed';

export interface UndoState {
  message: string;
  previousItems: PackingItem[];
}

export const LUGGAGE_OPTIONS: Record<
  LuggageType,
  { label: string; capacityLitres: number; description: string }
> = {
  personal: {
    label: 'Personal item',
    capacityLitres: 20,
    description: 'Under-seat backpack or tote (~20 L est.)',
  },
  'carry-on': {
    label: 'Carry-on bag',
    capacityLitres: 40,
    description: 'Overhead cabin suitcase or travel pack (~40 L est.)',
  },
  checked: {
    label: 'Checked suitcase',
    capacityLitres: 75,
    description: 'Full-size checked luggage (~75 L est.)',
  },
};

export const ACTIVITY_OPTIONS: {
  id: ActivityId;
  label: string;
  description: string;
}[] = [
  { id: 'sightseeing', label: 'City & Sightseeing', description: 'Museums, neighborhoods, cafés' },
  { id: 'hiking', label: 'Hiking & Nature', description: 'Trails, parks, uneven terrain' },
  { id: 'beach', label: 'Beach & Swimming', description: 'Coast, pool, water time' },
  { id: 'work', label: 'Work & Meetings', description: 'Laptop setup, smart-casual wear' },
  { id: 'dining', label: 'Evening Dining', description: 'Dressier restaurants or shows' },
  { id: 'fitness', label: 'Running & Gym', description: 'Workouts and active training' },
  { id: 'photography', label: 'Photography', description: 'Camera gear, extra storage' },
  { id: 'winter', label: 'Snow & Winter Sports', description: 'Alpine cold, thermal layers' },
];

export const CATEGORY_META: { id: CategoryId; title: string }[] = [
  { id: 'clothing', title: 'Everyday Clothing' },
  { id: 'outerwear', title: 'Weather & Outerwear' },
  { id: 'footwear', title: 'Footwear' },
  { id: 'toiletries', title: 'Toiletries & First Aid' },
  { id: 'electronics', title: 'Electronics & Power' },
  { id: 'documents', title: 'Documents & Essentials' },
  { id: 'gear', title: 'Activity Gear' },
];

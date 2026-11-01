import {
  CategoryId,
  ManualClimate,
  PackingItem,
  StylePreferences,
  TripDetails,
  WeatherSummary,
} from '../types/packing';

interface GeneratorInput {
  trip: TripDetails;
  style: StylePreferences;
  durationDays: number;
  weather: WeatherSummary;
  previousItems?: PackingItem[];
}

export function buildManualWeatherSummary(climate: ManualClimate): WeatherSummary {
  const labels: Record<ManualClimate, string> = {
    cold: 'Manual climate: Cold (weather service unavailable)',
    mild: 'Manual climate: Mild (weather service unavailable)',
    warm: 'Manual climate: Warm (weather service unavailable)',
    hot: 'Manual climate: Hot (weather service unavailable)',
  };

  return {
    mode: 'manual',
    manualClimate: climate,
    sourceLabel: labels[climate],
  };
}

/**
 * Generates a tailored, practical packing checklist with transparent plain-English reasons
 * and rough volume estimates (in litres).
 *
 * Specific clothing rules:
 * - clothesDays = laundry ? min(days, 4) : min(days, 10);
 * - underwear and socks = clothesDays + 1 spare;
 * - tops = clothesDays;
 * - trousers = max(1, ceil(clothesDays/3)) (each worn 2–3 times);
 * - sweater/fleece = 1 (2 only if avg low < 5°C);
 * - sleepwear = 1 (2 if days > 7 and no laundry).
 */
export function generatePackingItems({
  trip,
  style,
  durationDays,
  weather,
  previousItems,
}: GeneratorInput): PackingItem[] {
  const travelers = Math.max(1, trip.travelers);

  // Core rule: clothesDays = laundry ? min(days, 4) : min(days, 10)
  const clothesDays = style.laundry
    ? Math.min(durationDays, 4)
    : Math.min(durationDays, 10);

  const scaleClothes = (perPersonQty: number) => Math.max(1, perPersonQty * travelers);
  const travelerSuffix = travelers > 1 ? ` · ${travelers} travelers` : '';

  // Determine temperature profile strictly from real API numbers or manual climate choice
  const isManual = weather.mode === 'manual';
  const manualClimate = weather.manualClimate;

  const isCold = isManual
    ? manualClimate === 'cold'
    : (weather.lowestTempC ?? 15) <= 7 || (weather.avgHighC ?? 18) <= 12;

  const isFreezing = isManual
    ? manualClimate === 'cold'
    : (weather.lowestTempC ?? 15) <= 2 || (weather.snowyDays ?? 0) > 0;

  const isMild = isManual
    ? manualClimate === 'mild'
    : !isCold && (weather.avgHighC ?? 20) < 24;

  const isWarmOrHot = isManual
    ? manualClimate === 'warm' || manualClimate === 'hot'
    : (weather.highestTempC ?? 20) >= 24;

  const isHot = isManual
    ? manualClimate === 'hot'
    : (weather.highestTempC ?? 20) >= 30;

  const rainyDays = weather.rainyDays ?? 0;
  const measuredDays = weather.measuredDays ?? durationDays;
  const hasRain = isManual
    ? manualClimate === 'cold' || manualClimate === 'mild'
    : rainyDays > 0;

  const hasActivity = (id: StylePreferences['activities'][number]) =>
    style.activities.includes(id);

  const items: PackingItem[] = [];
  let seq = 1;

  const addItem = (
    categoryId: CategoryId,
    key: string,
    name: string,
    quantity: number,
    volumeLitresPerUnit: number,
    reason: string
  ) => {
    items.push({
      id: `item-${key}-${seq++}`,
      categoryId,
      name,
      quantity: Math.max(1, quantity),
      volumeLitresPerUnit,
      reason,
      packed: false,
    });
  };

  // 1. EVERYDAY CLOTHING
  // Rule: underwear & socks = clothesDays + 1 spare
  addItem(
    'clothing',
    'underwear',
    'Underwear',
    scaleClothes(clothesDays + 1),
    0.15,
    `1 per day + 1 spare${travelerSuffix}`
  );

  addItem(
    'clothing',
    'socks',
    isCold ? 'Warm crew socks' : 'Everyday socks',
    scaleClothes(clothesDays + 1),
    0.18,
    `1 per day + 1 spare${travelerSuffix}`
  );

  // Rule: tops = clothesDays
  if (isHot) {
    addItem(
      'clothing',
      'breathable-tops',
      'Breathable linen or cotton shirts',
      scaleClothes(clothesDays),
      0.55,
      `1 per day${travelerSuffix}`
    );
  } else {
    addItem(
      'clothing',
      'tees-tops',
      'Everyday t-shirts or tops',
      scaleClothes(clothesDays),
      0.6,
      `1 per day${travelerSuffix}`
    );
  }

  // Rule: sweater/fleece = 1 (2 only if avg low < 5°C)
  if (isCold || isMild || !isHot) {
    const avgLow = weather.avgLowC ?? weather.lowestTempC;
    const isVeryCold =
      (avgLow !== undefined && avgLow < 5) ||
      (weather.mode === 'manual' && weather.manualClimate === 'cold');
    const sweaterCount = isVeryCold ? 2 : 1;

    let sweaterReason = 'Layer for cooler evenings';
    if (weather.lowestTempC !== undefined) {
      sweaterReason = isVeryCold
        ? `Lows down to ${weather.lowestTempC}°C · 2 warm layers`
        : `Lows down to ${weather.lowestTempC}°C`;
    } else if (weather.avgLowC !== undefined) {
      sweaterReason = isVeryCold
        ? `Avg low ${weather.avgLowC}°C (< 5°C calls for 2 layers)`
        : `Lows down to ${weather.avgLowC}°C`;
    } else if (isManual) {
      sweaterReason = isVeryCold
        ? 'Cold climate · 2 warm layers'
        : 'Mild climate layer';
    }

    addItem(
      'clothing',
      'sweater-midlayer',
      'Sweater or fleece mid-layer',
      scaleClothes(sweaterCount),
      1.6,
      `${sweaterReason}${travelerSuffix}`
    );
  }

  // Rule: trousers = max(1, ceil(clothesDays/3)) (each worn 2–3 times)
  const trousersCount = Math.max(1, Math.ceil(clothesDays / 3));
  if (isWarmOrHot && trousersCount > 1) {
    const shortsCount = Math.max(1, Math.floor(trousersCount / 2));
    const pantsCount = trousersCount - shortsCount;
    addItem(
      'clothing',
      'shorts-skirts',
      'Shorts or airy skirt',
      scaleClothes(shortsCount),
      0.7,
      `Each pair worn 2–3 times${travelerSuffix}`
    );
    addItem(
      'clothing',
      'light-trousers',
      'Lightweight trousers',
      scaleClothes(pantsCount),
      1.1,
      `Each pair worn 2–3 times${travelerSuffix}`
    );
  } else {
    addItem(
      'clothing',
      'trousers-jeans',
      isWarmOrHot ? 'Comfortable lightweight trousers' : 'Comfortable trousers or jeans',
      scaleClothes(trousersCount),
      1.3,
      `Each pair worn 2–3 times${travelerSuffix}`
    );
  }

  // Rule: sleepwear = 1 (2 if days > 7 and no laundry)
  const sleepwearCount = durationDays > 7 && !style.laundry ? 2 : 1;
  addItem(
    'clothing',
    'sleepwear',
    'Sleepwear set',
    scaleClothes(sleepwearCount),
    0.8,
    sleepwearCount > 1
      ? `2 sets (trip over 7 days)${travelerSuffix}`
      : `1 set for the trip${travelerSuffix}`
  );

  if (hasActivity('work')) {
    const workShirts = Math.min(clothesDays, 2);
    addItem(
      'clothing',
      'smart-shirt',
      'Collared shirt or blouse',
      scaleClothes(workShirts),
      0.8,
      `Work & Meetings${travelerSuffix}`
    );
  }

  if (hasActivity('dining')) {
    addItem(
      'clothing',
      'evening-outfit',
      'Smart evening outfit',
      scaleClothes(1),
      1.4,
      `Evening Dining${travelerSuffix}`
    );
  }

  if (hasActivity('fitness')) {
    const workoutSets = Math.min(Math.ceil(clothesDays / 3), 2);
    addItem(
      'clothing',
      'workout-set',
      'Quick-dry workout shirt & shorts/leggings',
      scaleClothes(workoutSets),
      0.85,
      `Running & Gym activewear${travelerSuffix}`
    );
  }

  if (hasActivity('beach')) {
    addItem(
      'clothing',
      'swimwear',
      'Swimsuit',
      scaleClothes(clothesDays >= 3 ? 2 : 1),
      0.4,
      `Beach & Swimming${travelerSuffix}`
    );
  }

  // 2. WEATHER & OUTERWEAR
  if (hasRain) {
    const rainSourceSuffix =
      weather.mode === 'archive'
        ? ' (same dates last year)'
        : weather.mode === 'forecast'
        ? ' (14-day forecast)'
        : '';

    const rainReason = isManual
      ? `Prepared for showers (${manualClimate} climate)`
      : `Rain on ${rainyDays} of ${measuredDays} days${rainSourceSuffix}`;

    addItem(
      'outerwear',
      'rain-jacket',
      'Packable waterproof rain shell',
      scaleClothes(1),
      1.5,
      rainReason
    );

    if (style.luggageType !== 'personal' || rainyDays >= 2 || isManual) {
      addItem(
        'outerwear',
        'umbrella',
        'Compact travel umbrella',
        travelers,
        0.6,
        rainReason
      );
    }
  }

  if (isCold || hasActivity('winter')) {
    addItem(
      'outerwear',
      'insulated-coat',
      'Insulated coat or packable down jacket',
      scaleClothes(1),
      3.2,
      isManual
        ? 'Cold climate warmth'
        : hasActivity('winter') && !isCold
        ? 'Snow & Winter Sports'
        : `Lows down to ${weather.lowestTempC ?? weather.avgLowC}°C`
    );
  } else if (isMild || (weather.lowestTempC !== undefined && weather.lowestTempC <= 16)) {
    addItem(
      'outerwear',
      'light-jacket',
      'Light windbreaker or overshirt',
      scaleClothes(1),
      1.4,
      isManual
        ? 'Mild evenings'
        : `Cooler evenings (avg low ${weather.avgLowC ?? weather.lowestTempC}°C)`
    );
  }

  if (isFreezing || hasActivity('winter')) {
    const freezeReason = isManual
      ? 'Cold climate warmth'
      : (weather.snowyDays ?? 0) > 0
      ? `Snow expected on ${weather.snowyDays} of ${measuredDays} days`
      : `Temperatures near ${weather.lowestTempC ?? weather.avgLowC}°C`;

    addItem(
      'outerwear',
      'beanie-gloves',
      'Warm knit hat & gloves',
      scaleClothes(1),
      0.5,
      freezeReason
    );
    addItem(
      'outerwear',
      'thermal-base',
      'Thermal base layer set',
      scaleClothes(1),
      0.7,
      freezeReason
    );
  }

  if (isWarmOrHot || hasActivity('beach') || hasActivity('hiking')) {
    addItem(
      'outerwear',
      'sunglasses-hat',
      'Sunglasses & sun hat',
      scaleClothes(1),
      0.4,
      hasActivity('beach')
        ? 'Beach sun protection'
        : isWarmOrHot && !isManual
        ? `Sunny daytime wear (highs around ${weather.avgHighC}°C)`
        : 'Daytime sun & glare protection'
    );
  }

  // 3. FOOTWEAR
  addItem(
    'footwear',
    'walking-shoes',
    'Comfortable walking sneakers (wear in transit)',
    scaleClothes(1),
    1.2, // worn on travel day, low bag impact estimate
    `Worn in transit & daily walking${travelerSuffix}`
  );

  if (hasActivity('hiking')) {
    addItem(
      'footwear',
      'hiking-shoes',
      'Trail shoes or hiking boots',
      scaleClothes(1),
      3.4,
      'Hiking & Nature trail terrain'
    );
  }

  if (hasActivity('beach') || isHot) {
    addItem(
      'footwear',
      'sandals',
      'Lightweight sandals or flip-flops',
      scaleClothes(1),
      1.1,
      hasActivity('beach')
        ? 'Beach & Swimming'
        : `Warm weather footwear (${weather.highestTempC ?? 30}°C)`
    );
  }

  if ((hasActivity('dining') || hasActivity('work')) && style.luggageType !== 'personal') {
    addItem(
      'footwear',
      'dress-shoes',
      'Smart loafers or dress flats',
      scaleClothes(1),
      2.4,
      hasActivity('dining') ? 'Evening Dining' : 'Work & Meetings'
    );
  }

  // 4. TOILETRIES & FIRST AID
  addItem(
    'toiletries',
    'toiletry-pouch',
    style.luggageType === 'checked'
      ? 'Toiletry kit (toothbrush, paste, soap, deodorant)'
      : '100 ml liquids bag & basic toiletries',
    travelers,
    1.3,
    style.luggageType === 'checked'
      ? 'Daily grooming essentials'
      : 'Cabin TSA 100 ml compliance'
  );

  addItem(
    'toiletries',
    'medications',
    'Personal medications, pain reliever & bandages',
    1,
    0.5,
    'Daily prescriptions & travel first aid'
  );

  if (isWarmOrHot || hasActivity('beach') || hasActivity('hiking') || hasActivity('winter')) {
    addItem(
      'toiletries',
      'sunscreen',
      'Broad-spectrum sunscreen & lip balm',
      1,
      0.3,
      hasActivity('winter')
        ? 'High-altitude snow glare protection'
        : 'UV skin protection'
    );
  }

  if (style.laundry) {
    addItem(
      'toiletries',
      'laundry-sheets',
      'Travel laundry detergent sheets',
      1,
      0.15,
      'Travel detergent for mid-trip laundry'
    );
  }

  // 5. ELECTRONICS & POWER
  addItem(
    'electronics',
    'phone-charger',
    'Phone charger & charging cable',
    travelers,
    0.25,
    `Daily phone charging${travelerSuffix}`
  );

  addItem(
    'electronics',
    'power-bank',
    'Portable power bank',
    1,
    0.35,
    'Portable backup for full days out'
  );

  addItem(
    'electronics',
    'adapter',
    'Universal travel plug adapter',
    1,
    0.3,
    `Power outlets in ${trip.location?.country || 'destination'}`
  );

  if (hasActivity('work')) {
    addItem(
      'electronics',
      'laptop-kit',
      'Laptop, sleeve & charger',
      1,
      2.2,
      'Work & Meetings setup'
    );
  }

  if (hasActivity('photography')) {
    addItem(
      'electronics',
      'camera-kit',
      'Camera, spare battery & memory cards',
      1,
      2.5,
      'Photography gear & extra storage'
    );
  }

  // 6. DOCUMENTS & ESSENTIALS
  addItem(
    'documents',
    'id-passport',
    'Passport or government ID',
    travelers,
    0.1,
    `Required travel identification${travelerSuffix}`
  );

  addItem(
    'documents',
    'wallet-cards',
    'Payment cards & local emergency cash',
    travelers,
    0.15,
    'Transit & local currency payments'
  );

  addItem(
    'documents',
    'bookings-insurance',
    'Offline copies of tickets, lodging & insurance',
    1,
    0.05,
    'Offline backup without cell signal'
  );

  // 7. ACTIVITY GEAR
  addItem(
    'gear',
    'water-bottle',
    'Reusable water bottle',
    travelers,
    0.8,
    'Daily hydration on the go'
  );

  if (hasActivity('hiking') || hasActivity('sightseeing')) {
    addItem(
      'gear',
      'daypack',
      'Packable daypack or tote bag',
      1,
      0.9,
      hasActivity('hiking')
        ? 'Trail pack for water and layers'
        : 'City day outings'
    );
  }

  if (hasActivity('beach')) {
    addItem(
      'gear',
      'microfiber-towel',
      'Quick-dry travel towel',
      scaleClothes(1),
      0.8,
      'Quick-dry towel for beach & water'
    );
  }

  if (hasActivity('winter')) {
    addItem(
      'gear',
      'goggles-neckwarmer',
      'Snow goggles & fleece neck gaiter',
      scaleClothes(1),
      1.4,
      'Snow & Winter Sports protection'
    );
  }

  // If re-generating after "Edit trip", preserve packed state on matching item names
  // and keep any custom items added previously by the user!
  if (previousItems && previousItems.length > 0) {
    const prevByName = new Map<string, PackingItem>();
    for (const prev of previousItems) {
      prevByName.set(`${prev.categoryId}::${prev.name.toLowerCase()}`, prev);
    }

    const merged = items.map((item) => {
      const match = prevByName.get(`${item.categoryId}::${item.name.toLowerCase()}`);
      if (match) {
        return {
          ...item,
          packed: match.packed,
        };
      }
      return item;
    });

    const customItems = previousItems.filter((p) => p.isCustom);
    return [...merged, ...customItems];
  }

  return items;
}

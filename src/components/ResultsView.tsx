import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Luggage,
  Minus,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Square,
  Trash2,
} from 'lucide-react';
import {
  ACTIVITY_OPTIONS,
  CATEGORY_META,
  CategoryId,
  FilterMode,
  LUGGAGE_OPTIONS,
  PackingItem,
  PackingTrip,
  UndoState,
} from '../types/packing';
import { celsiusToFahrenheit, formatDateRange } from '../utils/dateUtils';
import { formatLocationLabel } from './CitySearchInput';

interface ResultsViewProps {
  packingTrip: PackingTrip;
  onUpdateItems: (nextItems: PackingItem[]) => void;
  onEditTrip: () => void;
}

function copyTextWithFallback(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackExecCopy(text));
  }
  return fallbackExecCopy(text);
}

function fallbackExecCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  packingTrip,
  onUpdateItems,
  onEditTrip,
}) => {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [addingToCategory, setAddingToCategory] = useState<CategoryId | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemError, setNewItemError] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  useEffect(() => {
    if (!undoState) return;
    const timer = window.setTimeout(() => setUndoState(null), 7000);
    return () => window.clearTimeout(timer);
  }, [undoState]);

  const { trip, style, durationDays, weather, items } = packingTrip;

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.packed).length;
  const unpackedItems = totalItems - packedItems;
  const packedRatio = totalItems > 0 ? packedItems / totalItems : 0;

  // Rough litre estimate calculation
  const estimatedLitres = items.reduce(
    (sum, item) => sum + item.volumeLitresPerUnit * item.quantity,
    0
  );
  const bagSpec = LUGGAGE_OPTIONS[style.luggageType];
  const totalBagCapacityLitres = bagSpec.capacityLitres * Math.max(1, trip.travelers);
  const capacityRatio =
    totalBagCapacityLitres > 0 ? estimatedLitres / totalBagCapacityLitres : 0;
  const isOverCapacity = estimatedLitres > totalBagCapacityLitres;
  const isNearCapacity = !isOverCapacity && capacityRatio >= 0.85;

  const destinationHeading = trip.location
    ? formatLocationLabel(trip.location)
    : trip.destinationQuery;

  const formatTemp = (c?: number) => {
    if (c === undefined) return '';
    return tempUnit === 'C' ? `${c}°C` : `${celsiusToFahrenheit(c)}°F`;
  };

  const toggleCategoryCollapse = (catId: CategoryId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleTogglePacked = (itemId: string) => {
    const next = items.map((item) =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );
    onUpdateItems(next);
  };

  const handleStepQuantity = (itemId: string, delta: number) => {
    const next = items.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + delta)) }
        : item
    );
    onUpdateItems(next);
  };

  const handleRemoveItem = (target: PackingItem) => {
    setUndoState({
      message: `Removed "${target.name}"`,
      previousItems: items,
    });
    const next = items.filter((i) => i.id !== target.id);
    onUpdateItems(next);
  };

  const handleUncheckAll = () => {
    if (packedItems === 0) return;
    setUndoState({
      message: `Unchecked ${packedItems} ${packedItems === 1 ? 'item' : 'items'}`,
      previousItems: items,
    });
    const next = items.map((i) => ({ ...i, packed: false }));
    onUpdateItems(next);
  };

  const handleUndo = () => {
    if (!undoState) return;
    onUpdateItems(undoState.previousItems);
    setUndoState(null);
  };

  const handleOpenAddForm = (categoryId: CategoryId) => {
    setAddingToCategory(categoryId);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemError(null);
    if (collapsedCategories[categoryId]) {
      setCollapsedCategories((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleAddCustomItem = (e: React.FormEvent, categoryId: CategoryId) => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) {
      setNewItemError('Enter an item name.');
      return;
    }

    const customItem: PackingItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      categoryId,
      name: trimmed,
      reason: 'Added by you',
      quantity: Math.max(1, newItemQty),
      packed: false,
      volumeLitresPerUnit: 0.5,
      isCustom: true,
    };

    onUpdateItems([...items, customItem]);
    setAddingToCategory(null);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemError(null);
  };

  const buildPlainTextChecklist = (): string => {
    const lines: string[] = [];
    lines.push(`PACKING LIST: ${destinationHeading}`);
    lines.push(
      `${formatDateRange(trip.departureDate, trip.returnDate)} · ${durationDays} ${
        durationDays === 1 ? 'day' : 'days'
      } · ${trip.travelers} ${trip.travelers === 1 ? 'traveler' : 'travelers'}`
    );
    lines.push(`Weather source: ${weather.sourceLabel}`);
    if (weather.mode !== 'manual' && weather.avgHighC !== undefined && weather.avgLowC !== undefined) {
      lines.push(
        `Temperatures: Avg high ${formatTemp(weather.avgHighC)}, avg low ${formatTemp(
          weather.avgLowC
        )} · Rain on ${weather.rainyDays ?? 0} of ${weather.measuredDays ?? durationDays} days`
      );
    }
    lines.push(`Progress: ${packedItems} of ${totalItems} packed`);
    lines.push('');

    for (const cat of CATEGORY_META) {
      const catItems = items.filter((i) => i.categoryId === cat.id);
      if (catItems.length === 0) continue;
      lines.push(cat.title.toUpperCase());
      for (const item of catItems) {
        const box = item.packed ? '[x]' : '[ ]';
        const qtyLabel = item.quantity > 1 ? ` (×${item.quantity})` : '';
        lines.push(`${box} ${item.name}${qtyLabel} — ${item.reason}`);
      }
      lines.push('');
    }

    return lines.join('\n').trim();
  };

  const handleCopyList = async () => {
    try {
      await copyTextWithFallback(buildPlainTextChecklist());
      setCopiedFeedback(true);
      window.setTimeout(() => setCopiedFeedback(false), 2500);
    } catch {
      // Ignore silent failure
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedActivityLabels = style.activities
    .map((id) => ACTIVITY_OPTIONS.find((a) => a.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 md:pb-16">
      {/* Trip & Weather Summary Card */}
      <section className="bg-white border border-[#E2DDD3] rounded-xl p-5 sm:p-7 print-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[#1C2420] tracking-tight">
              {destinationHeading}
            </h1>

            {/* Unboxed clean metadata with middot separators */}
            <p className="text-sm text-[#5A655E] tabular-nums">
              <span>{formatDateRange(trip.departureDate, trip.returnDate)}</span>
              <span aria-hidden="true"> · </span>
              <span>
                {durationDays} {durationDays === 1 ? 'day' : 'days'}
              </span>
              <span aria-hidden="true"> · </span>
              <span>
                {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{style.laundry ? 'Laundry planned (4-day clothes cap)' : 'No laundry planned'}</span>
            </p>

            {selectedActivityLabels && (
              <p className="text-xs text-[#5A655E]">
                Activities: {selectedActivityLabels}
              </p>
            )}
          </div>

          {/* Action Buttons (Desktop / Tablet) */}
          <div className="no-print hidden md:flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onEditTrip}
              className="min-h-11 px-3.5 py-2 text-sm font-medium text-[#1C2420] bg-[#F7F5F0] hover:bg-[#EFECE4] border border-[#E2DDD3] rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Pencil className="w-4 h-4 text-[#1F4D3A]" aria-hidden="true" />
              <span>Edit trip</span>
            </button>

            <button
              type="button"
              onClick={handleCopyList}
              className="min-h-11 px-3.5 py-2 text-sm font-medium text-[#1C2420] bg-[#F7F5F0] hover:bg-[#EFECE4] border border-[#E2DDD3] rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-[#1F4D3A]" aria-hidden="true" />
                  <span className="text-[#1F4D3A]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#5A655E]" aria-hidden="true" />
                  <span>Copy list</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-11 px-3.5 py-2 text-sm font-medium text-[#1C2420] bg-[#F7F5F0] hover:bg-[#EFECE4] border border-[#E2DDD3] rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4 text-[#5A655E]" aria-hidden="true" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Weather Readout Strip */}
        <div className="bg-[#F7F5F0] border border-[#E2DDD3] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-[#5A655E]">{weather.sourceLabel}</p>
            {weather.mode !== 'manual' &&
            weather.avgHighC !== undefined &&
            weather.avgLowC !== undefined ? (
              <p className="text-sm sm:text-base font-medium text-[#1C2420] tabular-nums">
                <span>
                  Avg high {formatTemp(weather.avgHighC)} / low {formatTemp(weather.avgLowC)}
                </span>
                <span aria-hidden="true" className="text-[#5A655E]">
                  {' '}
                  ·{' '}
                </span>
                <span>
                  Range {formatTemp(weather.lowestTempC)} to {formatTemp(weather.highestTempC)}
                </span>
                <span aria-hidden="true" className="text-[#5A655E]">
                  {' '}
                  ·{' '}
                </span>
                <span>
                  Rain on {weather.rainyDays ?? 0} of {weather.measuredDays ?? durationDays}{' '}
                  {(weather.measuredDays ?? durationDays) === 1 ? 'day' : 'days'}
                </span>
              </p>
            ) : (
              <p className="text-sm font-medium text-[#1C2420]">
                Checklist tailored for a {weather.manualClimate} climate without live temperature figures.
              </p>
            )}
          </div>

          {weather.mode !== 'manual' && (
            <div
              role="group"
              aria-label="Temperature unit"
              className="no-print inline-flex items-center bg-white border border-[#E2DDD3] rounded-lg p-0.5 self-start sm:self-center shrink-0"
            >
              <button
                type="button"
                onClick={() => setTempUnit('C')}
                className={`min-h-9 min-w-10 px-2.5 text-xs font-mono font-medium rounded-md transition-colors ${
                  tempUnit === 'C'
                    ? 'bg-[#1F4D3A] text-white'
                    : 'text-[#5A655E] hover:text-[#1C2420]'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setTempUnit('F')}
                className={`min-h-9 min-w-10 px-2.5 text-xs font-mono font-medium rounded-md transition-colors ${
                  tempUnit === 'F'
                    ? 'bg-[#1F4D3A] text-white'
                    : 'text-[#5A655E] hover:text-[#1C2420]'
                }`}
              >
                °F
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar + Bag Capacity Meter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Packing Progress */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-[#1C2420] tabular-nums">
                {packedItems} of {totalItems} packed
              </span>
              <span className="text-xs font-mono text-[#5A655E] tabular-nums">
                {Math.round(packedRatio * 100)}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={packedItems}
              aria-valuemin={0}
              aria-valuemax={totalItems}
              aria-label="Packing progress"
              className="h-2.5 w-full bg-[#EFECE4] rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-[#1F4D3A] transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${packedRatio})` }}
              />
            </div>
            <p className="text-xs text-[#5A655E] tabular-nums">
              {unpackedItems === 0 && totalItems > 0
                ? 'All items packed!'
                : `${unpackedItems} ${unpackedItems === 1 ? 'item' : 'items'} left to pack`}
            </p>
          </div>

          {/* Bag Capacity Meter (labelled as rough estimate) */}
          <div className="space-y-2">
            <div className="flex items-start sm:items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-[#1C2420] inline-flex items-center gap-1.5 min-w-0">
                <Luggage className="w-4 h-4 text-[#1F4D3A] shrink-0" aria-hidden="true" />
                <span className="leading-snug">Bag space (rough estimate)</span>
              </span>
              <span className="text-xs font-mono text-[#1C2420] tabular-nums whitespace-nowrap shrink-0 ml-2">
                ~{estimatedLitres.toFixed(1)} L / ~{totalBagCapacityLitres} L
              </span>
            </div>

            <div className="h-2.5 w-full bg-[#EFECE4] rounded-full overflow-hidden">
              <div
                className={`h-full transition-transform duration-200 origin-left ${
                  isOverCapacity
                    ? 'bg-[#B93829]'
                    : isNearCapacity
                    ? 'bg-[#D9734E]'
                    : 'bg-[#1F4D3A]'
                }`}
                style={{ transform: `scaleX(${Math.min(1, capacityRatio)})` }}
              />
            </div>

            <p
              className={`text-xs flex items-start gap-1.5 tabular-nums ${
                isOverCapacity ? 'text-[#B93829] font-medium' : 'text-[#5A655E]'
              }`}
            >
              {isOverCapacity ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    Over estimated {bagSpec.label.toLowerCase()} space by ~
                    {(estimatedLitres - totalBagCapacityLitres).toFixed(1)} L. Consider a larger bag
                    or enabling laundry.
                  </span>
                </>
              ) : isNearCapacity ? (
                <span>
                  Snug fit for {trip.travelers > 1 ? `${trip.travelers} × ` : ''}
                  {bagSpec.label.toLowerCase()} (rough volume estimate).
                </span>
              ) : (
                <span>
                  Fits comfortably in {trip.travelers > 1 ? `${trip.travelers} × ` : ''}
                  {bagSpec.label.toLowerCase()} (rough volume estimate).
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar & Uncheck All */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter checklist items"
          className="inline-flex items-center bg-[#EFECE4] p-1 rounded-lg border border-[#E2DDD3] max-w-full overflow-x-auto"
        >
          {(
            [
              { id: 'all', label: `All (${totalItems})` },
              { id: 'to-pack', label: `To pack (${unpackedItems})` },
              { id: 'packed', label: `Packed (${packedItems})` },
            ] as { id: FilterMode; label: string }[]
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`min-h-10 px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  active
                    ? 'bg-white text-[#1C2420] shadow-xs'
                    : 'text-[#5A655E] hover:text-[#1C2420]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleUncheckAll}
          disabled={packedItems === 0}
          className="min-h-11 px-3.5 py-2 text-sm font-medium text-[#5A655E] hover:text-[#1C2420] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 rounded-lg hover:bg-[#EFECE4] transition-colors whitespace-nowrap shrink-0"
        >
          <Square className="w-4 h-4" aria-hidden="true" />
          <span>Uncheck all</span>
        </button>
      </div>

      {/*Undo Banner (for Item Removal or Uncheck All)*/}
      {undoState && (
        <div
          role="status"
          aria-live="polite"
          className="no-print flex items-center justify-between gap-3 bg-[#1C2420] text-[#F7F5F0] rounded-lg px-4 py-3 text-sm shadow-md"
        >
          <span>{undoState.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="min-h-9 px-3 py-1 bg-[#D9734E] hover:bg-[#C25E3A] text-white font-medium rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Filter Empty States */}
      {filter === 'packed' && packedItems === 0 ? (
        <div className="bg-white border border-[#E2DDD3] rounded-xl p-10 text-center space-y-3">
          <h2 className="font-display text-xl font-semibold text-[#1C2420]">
            No items packed yet
          </h2>
          <p className="text-sm text-[#5A655E] max-w-md mx-auto">
            Nothing has been checked off yet. Switch back to your full list and check items off as
            they go into your bag.
          </p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="min-h-11 px-4 py-2 bg-[#1F4D3A] hover:bg-[#173B2C] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Show all items
          </button>
        </div>
      ) : filter === 'to-pack' && unpackedItems === 0 && totalItems > 0 ? (
        <div className="bg-white border border-[#E2DDD3] rounded-xl p-10 text-center space-y-3">
          <h2 className="font-display text-xl font-semibold text-[#1F4D3A]">
            Everything is packed!
          </h2>
          <p className="text-sm text-[#5A655E] max-w-md mx-auto">
            All {totalItems} items on your checklist are checked off and ready for {destinationHeading}.
          </p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="min-h-11 px-4 py-2 bg-[#1F4D3A] hover:bg-[#173B2C] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Review full checklist
          </button>
        </div>
      ) : (
        /* Collapsible Category Sections */
        <div className="space-y-4">
          {CATEGORY_META.map((cat) => {
            const allCategoryItems = items.filter((i) => i.categoryId === cat.id);
            const visibleItems = allCategoryItems.filter((item) => {
              if (filter === 'to-pack') return !item.packed;
              if (filter === 'packed') return item.packed;
              return true;
            });

            // In filtered views, hide categories with no matching items
            if (filter !== 'all' && visibleItems.length === 0) {
              return null;
            }

            const catPackedCount = allCategoryItems.filter((i) => i.packed).length;
            const isCollapsed = Boolean(collapsedCategories[cat.id]);
            const isAddingHere = addingToCategory === cat.id;

            return (
              <section
                key={cat.id}
                className="bg-white border border-[#E2DDD3] rounded-xl overflow-hidden print-card"
              >
                {/* Collapsible Header */}
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleCategoryCollapse(cat.id)}
                  className="w-full min-h-13 px-4 sm:px-5 py-3.5 bg-[#F7F5F0]/60 hover:bg-[#EFECE4]/60 flex items-center justify-between gap-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#1F4D3A]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isCollapsed ? (
                      <ChevronRight
                        className="w-4 h-4 text-[#5A655E] shrink-0 no-print"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        className="w-4 h-4 text-[#5A655E] shrink-0 no-print"
                        aria-hidden="true"
                      />
                    )}
                    <h2 className="font-display text-lg font-semibold text-[#1C2420] truncate">
                      {cat.title}
                    </h2>
                  </div>

                  <span className="text-xs font-mono text-[#5A655E] tabular-nums shrink-0">
                    {catPackedCount} / {allCategoryItems.length} packed
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-[#EFECE4] border-t border-[#EFECE4]">
                    {visibleItems.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-[#5A655E]">
                        No items in this category yet.
                      </p>
                    ) : (
                      visibleItems.map((item) => {
                        const checkboxId = `chk-${item.id}`;
                        return (
                          <div
                            key={item.id}
                            className={`px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                              item.packed ? 'bg-[#F7F5F0]/50' : 'bg-white'
                            }`}
                          >
                            {/* Accessible Checkbox + Label + Short Reason */}
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                              <label
                                htmlFor={checkboxId}
                                className="min-w-11 min-h-11 -ml-1.5 flex items-center justify-center cursor-pointer shrink-0"
                              >
                                <input
                                  id={checkboxId}
                                  type="checkbox"
                                  checked={item.packed}
                                  onChange={() => handleTogglePacked(item.id)}
                                  className="w-5 h-5 rounded border-[#9CA69F] text-[#1F4D3A] accent-[#1F4D3A] cursor-pointer focus:ring-2 focus:ring-[#1F4D3A]/30"
                                />
                              </label>

                              <div className="min-w-0 flex-1 py-1">
                                <label
                                  htmlFor={checkboxId}
                                  className={`block text-sm sm:text-base font-medium cursor-pointer leading-snug ${
                                    item.packed
                                      ? 'line-through text-[#5A655E]'
                                      : 'text-[#1C2420]'
                                  }`}
                                >
                                  {item.name}
                                </label>
                                <p className="text-xs text-[#5A655E] mt-0.5 leading-snug">
                                  {item.reason}
                                </p>
                              </div>
                            </div>

                            {/* Quantity Stepper + Remove Button */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <div
                                role="group"
                                aria-label={`Quantity for ${item.name}`}
                                className="inline-flex items-center border border-[#E2DDD3] rounded-lg bg-[#F7F5F0]"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleStepQuantity(item.id, -1)}
                                  disabled={item.quantity <= 1}
                                  aria-label={`Decrease quantity of ${item.name}`}
                                  className="no-print min-w-11 min-h-11 sm:min-w-9 sm:min-h-9 flex items-center justify-center text-[#1C2420] hover:bg-[#EFECE4] disabled:opacity-35 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                                <span className="px-2 min-w-7 text-center font-mono text-sm font-medium text-[#1C2420] tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStepQuantity(item.id, 1)}
                                  aria-label={`Increase quantity of ${item.name}`}
                                  className="no-print min-w-11 min-h-11 sm:min-w-9 sm:min-h-9 flex items-center justify-center text-[#1C2420] hover:bg-[#EFECE4] rounded-r-lg transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item)}
                                aria-label={`Remove ${item.name}`}
                                className="no-print min-w-11 min-h-11 sm:min-w-9 sm:min-h-9 flex items-center justify-center text-[#5A655E] hover:text-[#B93829] hover:bg-[#FBF0EC] rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* "+ Add item" per category */}
                    <div className="no-print px-4 sm:px-5 py-3 bg-[#F7F5F0]/35">
                      {isAddingHere ? (
                        <form
                          onSubmit={(e) => handleAddCustomItem(e, cat.id)}
                          className="space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              placeholder={`Add item to ${cat.title.toLowerCase()}...`}
                              value={newItemName}
                              aria-label={`New item name for ${cat.title}`}
                              aria-invalid={Boolean(newItemError)}
                              onChange={(e) => {
                                setNewItemName(e.target.value);
                                if (newItemError) setNewItemError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setAddingToCategory(null);
                                  setNewItemError(null);
                                }
                              }}
                              className="flex-1 min-h-11 px-3.5 py-2 text-sm bg-white border border-[#E2DDD3] rounded-lg focus:outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/20"
                            />

                            <div className="flex items-center gap-2 justify-between sm:justify-end">
                              <div className="inline-flex items-center border border-[#E2DDD3] rounded-lg bg-white">
                                <button
                                  type="button"
                                  onClick={() => setNewItemQty((q) => Math.max(1, q - 1))}
                                  aria-label="Decrease new item quantity"
                                  className="min-w-11 min-h-11 flex items-center justify-center text-[#1C2420] hover:bg-[#F7F5F0]"
                                >
                                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                                <span className="px-2.5 font-mono text-sm tabular-nums">
                                  {newItemQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setNewItemQty((q) => Math.min(99, q + 1))}
                                  aria-label="Increase new item quantity"
                                  className="min-w-11 min-h-11 flex items-center justify-center text-[#1C2420] hover:bg-[#F7F5F0]"
                                >
                                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="submit"
                                  className="min-h-11 px-4 py-2 text-sm font-medium text-white bg-[#1F4D3A] hover:bg-[#173B2C] rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingToCategory(null);
                                    setNewItemError(null);
                                  }}
                                  className="min-h-11 px-3 py-2 text-sm font-medium text-[#5A655E] hover:text-[#1C2420] rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>

                          {newItemError && (
                            <p role="alert" className="text-xs text-[#B93829]">
                              {newItemError}
                            </p>
                          )}
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAddForm(cat.id)}
                          className="min-h-11 px-2 text-sm font-medium text-[#1F4D3A] hover:text-[#173B2C] inline-flex items-center gap-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <span>+ Add item</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar (44px touch targets, < 15% viewport height) */}
      <div className="no-print fixed bottom-0 inset-x-0 md:hidden z-20 bg-[#F7F5F0]/95 backdrop-blur-sm border-t border-[#E2DDD3] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onEditTrip}
            className="min-h-11 px-3 py-2 text-xs font-medium text-[#1C2420] bg-white border border-[#E2DDD3] rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Pencil className="w-3.5 h-3.5 text-[#1F4D3A]" aria-hidden="true" />
            <span>Edit trip</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyList}
              className="min-h-11 px-3 py-2 text-xs font-medium text-[#1C2420] bg-white border border-[#E2DDD3] rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#1F4D3A]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy list</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print packing list"
              className="min-h-11 min-w-11 px-3 py-2 text-xs font-medium text-white bg-[#1F4D3A] rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

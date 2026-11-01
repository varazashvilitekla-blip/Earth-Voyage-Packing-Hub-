/**
 * Local-timezone safe YYYY-MM-DD helpers without UTC shift issues.
 */

export function getLocalTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODateLocalNoon(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function addDaysISO(iso: string, days: number): string {
  const base = parseISODateLocalNoon(iso);
  if (!base) return iso;
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Difference in calendar days (end - start).
 * Same date => 0. End before start => negative.
 */
export function diffCalendarDays(startISO: string, endISO: string): number | null {
  const start = parseISODateLocalNoon(startISO);
  const end = parseISODateLocalNoon(endISO);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Inclusive trip duration in days.
 * Same-day trip => 1 day. Nov 10 to Nov 16 => 7 days.
 */
export function calculateTripDays(departureISO: string, returnISO: string): number | null {
  const diff = diffCalendarDays(departureISO, returnISO);
  if (diff === null) return null;
  return diff + 1;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Shifts an ISO date back by `yearsBack` years, clamping Feb 29 -> Feb 28 on non-leap years.
 */
export function shiftISOYearsBack(iso: string, yearsBack: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const targetYear = y - yearsBack;
  let targetDay = d;
  if (m === 2 && d === 29 && !isLeapYear(targetYear)) {
    targetDay = 28;
  }
  return `${targetYear}-${String(m).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

export function formatReadableDate(iso: string): string {
  const date = parseISODateLocalNoon(iso);
  if (!date) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(startISO: string, endISO: string): string {
  const start = parseISODateLocalNoon(startISO);
  const end = parseISODateLocalNoon(endISO);
  if (!start || !end) return `${startISO} – ${endISO}`;

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (startISO === endISO) {
    return formatReadableDate(startISO);
  }

  if (sameMonth) {
    const month = start.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${s} – ${e}, ${start.getFullYear()}`;
  }

  return `${formatReadableDate(startISO)} – ${formatReadableDate(endISO)}`;
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

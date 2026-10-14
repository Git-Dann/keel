import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import { enGB } from 'date-fns/locale';

export const today = (): Date => startOfDay(new Date());

/** ISO date (yyyy-MM-dd) for a day offset from a base date. */
export const isoInDays = (n: number, base: Date = today()): string => format(addDays(base, n), 'yyyy-MM-dd');

export const parseDate = (iso: string): Date => startOfDay(parseISO(iso));

/** Whole calendar days from `base` to `iso`. Negative when in the past. */
export const daysUntil = (iso: string, base: Date = today()): number => differenceInCalendarDays(parseDate(iso), base);

/** 14 Oct 2026 */
export const fmtDate = (iso: string | null | undefined): string =>
  iso ? format(parseDate(iso), 'd MMM yyyy', { locale: enGB }) : 'Not found';

/** 14 Oct */
export const fmtShort = (d: Date | string): string =>
  format(typeof d === 'string' ? parseDate(d) : d, 'd MMM', { locale: enGB });

export const fmtDay = (n: number, base: Date = today()): string => fmtShort(addDays(base, n));

export const fmtMonthYear = (d: Date): string => format(d, 'MMMM yyyy', { locale: enGB });

export const clock = (d: Date = new Date()): string => format(d, 'HH:mm', { locale: enGB });

/** today, tomorrow, yesterday, in 5 days, 3 days ago */
export const rel = (n: number): string => {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
};

export const money = (n: number | null | undefined): string =>
  n == null ? 'Not stated' : '£' + n.toLocaleString('en-GB', { maximumFractionDigits: 0 });

export const plural = (n: number, one: string, many = one + 's'): string => `${n} ${n === 1 ? one : many}`;

export const sentenceCase = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

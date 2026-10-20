// Pure Intl helpers over the format locale (`pt-CV`, `en-GB`, …). Never a bare
// `pt`: Intl resolves it to Brazilian conventions.
export type IGRPDateInput = Date | string | number | null | undefined;

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};
const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
};

function toDate(value: IGRPDateInput): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * `dd/mm/yyyy` in every platform region; `''` for missing or invalid input.
 * `timeZone` is the platform zone (`i18n.timeZone`): without it the server
 * formats in its own zone and the browser in the user's, and the two markups
 * differ (hydration mismatch). `options.timeZone` wins when both are given.
 */
export function igrpFormatDate(
  value: IGRPDateInput,
  formatLocale: string,
  options: Intl.DateTimeFormatOptions = DATE_OPTIONS,
  timeZone?: string,
): string {
  const date = toDate(value);
  if (!date) return '';
  const resolved = timeZone && !options.timeZone ? { ...options, timeZone } : options;
  return new Intl.DateTimeFormat(formatLocale, resolved).format(date);
}

/** Date plus `HH:mm`; `timeZone` as in `igrpFormatDate`. */
export function igrpFormatDateTime(
  value: IGRPDateInput,
  formatLocale: string,
  options: Intl.DateTimeFormatOptions = DATE_TIME_OPTIONS,
  timeZone?: string,
): string {
  return igrpFormatDate(value, formatLocale, { ...DATE_TIME_OPTIONS, ...options }, timeZone);
}

const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 1_000],
  ['minute', 60_000],
  ['hour', 3_600_000],
  ['day', 86_400_000],
  ['week', 7 * 86_400_000],
  ['month', 30.4375 * 86_400_000],
  ['year', 365.25 * 86_400_000],
];

/**
 * "há 5 minutos", "in 3 hours", "last month": the distance from `now` in the
 * largest unit it fills, rounded. The replacement for next-intl's
 * `useFormatter().relativeTime`, which `igrp-i18n check-literals` bans.
 * `''` for missing or invalid input.
 */
export function igrpFormatRelativeTime(
  value: IGRPDateInput,
  now: IGRPDateInput,
  formatLocale: string,
  options: Intl.RelativeTimeFormatOptions = { numeric: 'auto' },
): string {
  const date = toDate(value);
  const reference = toDate(now);
  if (!date || !reference) return '';
  const diff = date.getTime() - reference.getTime();
  const abs = Math.abs(diff);
  let [unit, size] = RELATIVE_UNITS[0]!;
  for (let i = 1; i < RELATIVE_UNITS.length; i += 1) {
    if (abs < RELATIVE_UNITS[i]![1]) break;
    [unit, size] = RELATIVE_UNITS[i]!;
  }
  return new Intl.RelativeTimeFormat(formatLocale, options).format(Math.round(diff / size), unit);
}

export function igrpFormatNumber(
  value: number | bigint,
  formatLocale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(formatLocale, options).format(value);
}

const collators = new Map<string, Intl.Collator>();

/** Case- and accent-insensitive, numeric-aware comparison for `Array#sort`. */
export function igrpCompare(
  a: string | null | undefined,
  b: string | null | undefined,
  formatLocale: string,
): number {
  let collator = collators.get(formatLocale);
  if (!collator) {
    collator = new Intl.Collator(formatLocale, { sensitivity: 'base', numeric: true });
    collators.set(formatLocale, collator);
  }
  return collator.compare(a ?? '', b ?? '');
}

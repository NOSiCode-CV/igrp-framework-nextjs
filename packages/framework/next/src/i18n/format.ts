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

function isDateOnly(value: IGRPDateInput): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
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
  // `new Date('YYYY-MM-DD')` is UTC midnight: format in UTC to keep that calendar day.
  const resolved = isDateOnly(value)
    ? { ...options, timeZone: 'UTC' }
    : timeZone && !options.timeZone
      ? { ...options, timeZone }
      : options;
  return new Intl.DateTimeFormat(formatLocale, resolved).format(date);
}

/** Date plus `HH:mm`; `timeZone` as in `igrpFormatDate`. */
export function igrpFormatDateTime(
  value: IGRPDateInput,
  formatLocale: string,
  options: Intl.DateTimeFormatOptions = DATE_TIME_OPTIONS,
  timeZone?: string,
): string {
  // dateStyle/timeStyle throw when mixed with the field options.
  const resolved =
    options.dateStyle || options.timeStyle ? options : { ...DATE_TIME_OPTIONS, ...options };
  return igrpFormatDate(value, formatLocale, resolved, timeZone);
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
  let i = 0;
  while (i + 1 < RELATIVE_UNITS.length && abs >= RELATIVE_UNITS[i + 1]![1]) i += 1;
  // 59.6 s rounds to 60 s: say "1 minute" instead.
  if (
    i + 1 < RELATIVE_UNITS.length &&
    Math.abs(Math.round(diff / RELATIVE_UNITS[i]![1])) * RELATIVE_UNITS[i]![1] >=
      RELATIVE_UNITS[i + 1]![1]
  ) {
    i += 1;
  }
  const [unit, size] = RELATIVE_UNITS[i]!;
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

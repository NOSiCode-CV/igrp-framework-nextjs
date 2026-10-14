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

/** `dd/mm/yyyy` in every platform region; `''` for missing or invalid input. */
export function igrpFormatDate(
  value: IGRPDateInput,
  formatLocale: string,
  options: Intl.DateTimeFormatOptions = DATE_OPTIONS,
): string {
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat(formatLocale, options).format(date) : '';
}

/** Date plus `HH:mm`. */
export function igrpFormatDateTime(
  value: IGRPDateInput,
  formatLocale: string,
  options: Intl.DateTimeFormatOptions = DATE_TIME_OPTIONS,
): string {
  return igrpFormatDate(value, formatLocale, { ...DATE_TIME_OPTIONS, ...options });
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

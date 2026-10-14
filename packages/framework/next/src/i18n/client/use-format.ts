'use client';

import {
  type IGRPDateInput,
  igrpCompare,
  igrpFormatDate,
  igrpFormatDateTime,
  igrpFormatNumber,
  igrpFormatRelativeTime,
} from '../format.js';
import { useIGRPLocaleInfo } from './locale-info.js';

/** The format helpers bound to the current format locale and platform time zone. */
export function useIGRPFormat() {
  const { locale, formatLocale, timeZone } = useIGRPLocaleInfo();
  return {
    locale,
    formatLocale,
    timeZone,
    formatDate: (value: IGRPDateInput, options?: Intl.DateTimeFormatOptions) =>
      igrpFormatDate(value, formatLocale, options, timeZone),
    formatDateTime: (value: IGRPDateInput, options?: Intl.DateTimeFormatOptions) =>
      igrpFormatDateTime(value, formatLocale, options, timeZone),
    formatRelativeTime: (
      value: IGRPDateInput,
      now: IGRPDateInput = new Date(),
      options?: Intl.RelativeTimeFormatOptions,
    ) => igrpFormatRelativeTime(value, now, formatLocale, options),
    formatNumber: (value: number | bigint, options?: Intl.NumberFormatOptions) =>
      igrpFormatNumber(value, formatLocale, options),
    compare: (a: string | null | undefined, b: string | null | undefined) =>
      igrpCompare(a, b, formatLocale),
  };
}

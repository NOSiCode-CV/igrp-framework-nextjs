'use client';

import {
  type IGRPDateInput,
  igrpCompare,
  igrpFormatDate,
  igrpFormatDateTime,
  igrpFormatNumber,
} from '../format.js';
import { useIGRPLocaleInfo } from './locale-info.js';

/** The format helpers bound to the current format locale. */
export function useIGRPFormat() {
  const { locale, formatLocale } = useIGRPLocaleInfo();
  return {
    locale,
    formatLocale,
    formatDate: (value: IGRPDateInput, options?: Intl.DateTimeFormatOptions) =>
      igrpFormatDate(value, formatLocale, options),
    formatDateTime: (value: IGRPDateInput, options?: Intl.DateTimeFormatOptions) =>
      igrpFormatDateTime(value, formatLocale, options),
    formatNumber: (value: number | bigint, options?: Intl.NumberFormatOptions) =>
      igrpFormatNumber(value, formatLocale, options),
    compare: (a: string | null | undefined, b: string | null | undefined) =>
      igrpCompare(a, b, formatLocale),
  };
}

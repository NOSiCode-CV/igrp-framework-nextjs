import { format } from "date-fns";
import type { DateAfter, DateBefore, DateRange, DayOfWeek } from "react-day-picker";
import type { IGRPCalendarProps } from "../types";

export function getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek }: IGRPCalendarProps) {
  const disabled: (DateBefore | DateAfter | DayOfWeek)[] = [];

  if (disableBefore) {
    disabled.push({ before: disableBefore });
  }
  if (disableAfter) {
    disabled.push({ after: disableAfter });
  }
  if (disableDayOfWeek !== undefined) {
    const days = Array.isArray(disableDayOfWeek)
      ? disableDayOfWeek
      : [disableDayOfWeek];
    disabled.push({ dayOfWeek: days });
  }

  return disabled;
}

export function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export function formatDateRange(range: DateRange | undefined, dateFormat: string) {
  if (!range?.from) {
    return ""
  }

  const fromDate = formatDate(range.from, dateFormat)

  if (!range.to) {
    return fromDate
  }

  const toDate = formatDate(range.from, dateFormat)

  return `${fromDate} - ${toDate}`
}

export function formatDate(date: Date | undefined, dateFormat: string) {
  return date ? format(date, dateFormat) : dateFormat;
};
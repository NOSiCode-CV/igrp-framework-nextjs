import { addYears, lightFormat, parse, subYears } from "date-fns"
import type { DateAfter, DateBefore, DateRange, DayOfWeek } from "react-day-picker"
import type { IGRPCalendarProps } from "../types"

/** Default navigation window around today for month/year dropdowns. */
export const IGRP_CALENDAR_DEFAULT_YEAR_SPAN = 5

/** Returns DayPicker `startMonth` / `endMonth` bounds around `from` (defaults to today). */
export function getDefaultCalendarMonthBounds(from: Date = new Date()) {
  return {
    startMonth: subYears(from, IGRP_CALENDAR_DEFAULT_YEAR_SPAN),
    endMonth: addYears(from, IGRP_CALENDAR_DEFAULT_YEAR_SPAN),
  }
}

/** Formats a date range to string using date-fns lightFormat. */
export function formatDateRange(range: DateRange | undefined, dateFormat: string) {
  if (!range?.from) {
    return ""
  }

  const fromDate = formatDateToString(range.from, dateFormat)

  if (!range.to) {
    return fromDate
  }

  const toDate = formatDateToString(range.from, dateFormat)

  return `${fromDate} / ${toDate}`
}

/** Formats a date to string using date-fns lightFormat. */
export function formatDateToString(date: Date | undefined, dateFormat: string) {
  return date ? lightFormat(date, dateFormat) : ""
}

/**
 * Builds disabled days config for react-day-picker from calendar props.
 */
export function getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek }: IGRPCalendarProps) {
  const disabled: (DateBefore | DateAfter | DayOfWeek)[] = []

  if (disableBefore) {
    disabled.push({ before: disableBefore })
  }
  if (disableAfter) {
    disabled.push({ after: disableAfter })
  }
  if (disableDayOfWeek !== undefined) {
    const days = Array.isArray(disableDayOfWeek) ? disableDayOfWeek : [disableDayOfWeek]
    disabled.push({ dayOfWeek: days })
  }

  return disabled
}

/** Returns true if the date is valid and not NaN. */
export function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

/** Parses a date string to Date using date-fns parse. Returns undefined if invalid. */
export function parseStringToDate(dateString: string, dateFormat: string) {
  if (dateString.length !== dateFormat.length) return

  const parsedDate = parse(dateString, dateFormat, new Date())

  if (isValidDate(parsedDate)) {
    return parsedDate
  }
}

/** Parses "from / to" range string to DateRange. Returns undefined if invalid. */
export function parseStringToRange(rangeString: string, dateFormat: string) {
  const [from, to] = rangeString.trim().split("/")

  if (!from || from.length !== dateFormat.length) return { from: undefined, to: undefined }

  const parsedFrom = parse(from, dateFormat, new Date())

  if (!to || to.length !== dateFormat.length) return { from: parsedFrom, to: undefined }

  const parsedDate = {
    from: parsedFrom,
    to: parse(to, dateFormat, new Date()),
  }

  return parsedDate
}

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

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Coerces a form value into a Date anchored at **local** midnight.
 *
 * Date pickers declare their value as `Date | undefined`, but react-hook-form hands over
 * whatever the API put in the form — typically a date-only ISO string such as `"2026-08-26"`.
 * ECMAScript reads a date-only string as **UTC** midnight, so `new Date("2026-08-26")` is
 * 23:00 on the 25th in any UTC-N zone (Atlantic/Cape_Verde included). Formatting that value
 * renders the previous day, and the calendar highlights it — so clicking the highlighted day
 * writes the wrong date back to the form.
 *
 * Date-only strings are therefore rebuilt from their components at local midnight. Everything
 * else is passed through untouched: `Date` instances are already absolute, and strings that
 * carry a time (with or without an offset) mean a specific instant that must not be shifted.
 */
export function toLocalDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  if (typeof value === "number") return new Date(value)
  if (typeof value !== "string" || value === "") return undefined

  const match = DATE_ONLY_RE.exec(value)
  if (!match) {
    const parsed = new Date(value)
    return isValidDate(parsed) ? parsed : undefined
  }

  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return isValidDate(parsed) ? parsed : undefined
}

/** Applies {@link toLocalDate} to both ends of a range value. */
export function toLocalDateRange(value: unknown): DateRange | undefined {
  if (!value || typeof value !== "object") return undefined
  const { from, to } = value as { from?: unknown; to?: unknown }
  const localFrom = toLocalDate(from)
  if (!localFrom) return undefined
  return { from: localFrom, to: toLocalDate(to) }
}

/** Applies {@link toLocalDate} to every entry of a multi-date value. */
export function toLocalDates(value: unknown): Date[] | undefined {
  if (!Array.isArray(value)) return undefined
  const dates = value.map(toLocalDate).filter((date): date is Date => date !== undefined)
  return dates.length > 0 ? dates : undefined
}

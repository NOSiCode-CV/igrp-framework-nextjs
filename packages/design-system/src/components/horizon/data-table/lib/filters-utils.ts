/* eslint-disable @typescript-eslint/no-explicit-any */

import type { FilterFn } from "@tanstack/react-table"
import { addDays, startOfDay } from "date-fns"

import { isValidDate, toLocalDate } from "../../../../lib/calendar-utils.js"

/**
 * Filter function for date range filtering in IGRP data tables.
 * Filters rows based on whether the cell value falls within the specified date range.
 * The range covers whole local days: a datetime anywhere on the `to` day is included.
 *
 * @param row - The table row to filter
 * @param columnId - The ID of the column to filter
 * @param filterValue - An object containing `from` (start date) and optionally `to` (end date)
 * @returns `true` if the row should be included (no filter or date in range), `false` otherwise
 */
export const IGRPDataTableDateRangeFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || !filterValue.from) return true
  // Date-only strings are read at local midnight: `new Date("2026-08-26")` is UTC midnight,
  // the previous evening in any UTC-N zone, which dropped the row from a range ending that day.
  const date = toLocalDate(row.getValue(columnId))
  const start = toLocalDate(filterValue.from)
  const end = toLocalDate(filterValue.to)

  // Invalid filter bound → do not filter (show all). Invalid cell date → cannot
  // be "in range", so exclude. Prevents a misformatted column silently vanishing
  // with no error.
  if (!start || !isValidDate(start)) return true
  if (!date || !isValidDate(date)) return false
  if (end && isValidDate(end)) {
    return date >= startOfDay(start) && date < addDays(startOfDay(end), 1)
  }
  return date >= startOfDay(start)
}

/**
 * Filter function for faceted filtering in IGRP data tables.
 * Filters rows based on whether the cell value matches any value in the provided array.
 *
 * @param row - The table row to filter
 * @param columnId - The ID of the column to filter
 * @param filterValue - An array of string values to match against
 * @returns `true` if the row should be included (no filter or value matches), `false` otherwise
 */
export const IGRPDataTableFacetedFilterFn: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const cellValue = row.getValue(columnId)
  return filterValue.some((v) => String(v) === String(cellValue))
}

/**
 * Filter function for text filtering in IGRP data tables.
 * Filters rows based on case-insensitive text search within a single column.
 *
 * @param row - The table row to filter
 * @param columnId - The ID of the column to filter
 * @param filterValue - The text string to search for
 * @returns `true` if the row should be included (no filter or text found in column), `false` otherwise
 */
export const IGRPDataTableTextFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const term = String(filterValue ?? "")
    .toLowerCase()
    .trim()
  if (!term) return true
  const cellValue = String(row.getValue(columnId) ?? "").toLowerCase()
  return cellValue.includes(term)
}

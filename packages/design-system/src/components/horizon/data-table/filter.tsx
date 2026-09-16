"use client"

import { useCallback, useId, useMemo, useRef, useState } from "react"
import { type Column, type Table } from "@tanstack/react-table"
import { cn } from "../cn"
import type { IGRPOptionsProps } from "../../../types"
import { Button } from "../../primitives/button"
import { Checkbox } from "../../primitives/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../primitives/command"
import { Input } from "../../primitives/input"
import { Calendar } from "../../primitives/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../primitives/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../primitives/select"
import { Separator } from "../../primitives/separator"
import { IGRPBadge } from "../badge"
import { IGRPButton } from "../button"
import { IGRPIcon, type IGRPIconName } from "../icon"
import { useIGRPi18n, useIGRPLocale } from "../../../i18n"

/**
 * Base props for data table filter components.
 * @see IGRPDataTableFilterDropdown
 * @see IGRPDataTableFilterFaceted
 * @see IGRPDataTableFilterInput
 */
interface IGRPDataTableFilterProps<TData> {
  /** Column to filter. */
  column?: Column<TData, unknown>
  /** Placeholder text. */
  placeholder?: string
  /** Clear date filter. */
  clearDates?: boolean
  /** Options for select/dropdown filters. */
  options?: IGRPOptionsProps[]
  /** Additional CSS classes. */
  className?: string
  /** Max placeholder (e.g. for min/max). */
  placeholderMax?: string
  /** Disable the filter. */
  disabled?: boolean
  /** Icon name. */
  iconName?: IGRPIconName | string
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

/** Date range filter. Opens a popover with a range calendar. */
function IGRPDataTableFilterDate<TData>({
  column,
  clearDates,
  placeholder,
}: Omit<IGRPDataTableFilterProps<TData>, "options" | "placeholderMax">) {
  const i18n = useIGRPi18n()
  const locale = useIGRPLocale()
  const resolvedPlaceholder = placeholder ?? i18n.dataTable.filterDatePlaceholder
  const value = column?.getFilterValue() as { from?: Date; to?: Date } | undefined

  // Controlled rather than remounted. `key={clearDates ? … : …}` tore down the
  // whole popover (and its portal, focus trap and animation state) just to close
  // it; closing it is all that was ever wanted.
  const [open, setOpen] = useState(false)
  const [lastClearDates, setLastClearDates] = useState(clearDates)
  if (lastClearDates !== clearDates) {
    setLastClearDates(clearDates)
    if (clearDates) setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IGRPButton variant="outline" size="sm" className="justify-start">
          <IGRPIcon iconName="CalendarDays" />
          {value?.from
            ? value.to
              ? `${formatDate(value.from, locale)} – ${formatDate(value.to, locale)}`
              : formatDate(value.from, locale)
            : resolvedPlaceholder}
        </IGRPButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={{ from: value?.from, to: value?.to }}
          onSelect={(range) => column?.setFilterValue(range?.from ? range : undefined)}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Props for the IGRPDataTableFilterDropdown component.
 * @see IGRPDataTableFilterDropdown
 */
interface IGRPDataTableFilterDropdownProps<TData> extends Omit<
  IGRPDataTableFilterProps<TData>,
  "clearDates" | "placeholderMax" | "target"
> {
  showFilter?: boolean
  notFoundText?: string
}

function IGRPDataTableFilterDropdown<TData>({
  column,
  placeholder = "Filtrar...",
  options,
  className,
  disabled,
  showFilter = false,
  notFoundText,
}: IGRPDataTableFilterDropdownProps<TData>) {
  const i18n = useIGRPi18n()
  const id = useId()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const selectedValue = column?.getFilterValue() as string | undefined
  const selectedLabel = useMemo(
    () => options?.find((opt) => opt.value === selectedValue)?.label || placeholder,
    [selectedValue, options, placeholder]
  )

  const handleSelect = useCallback(
    (value: string) => {
      column?.setFilterValue(value)
      setOpen(false)
    },
    [column]
  )

  return (
    <div id={`dropdown-${id}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <IGRPButton
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            size="sm"
            disabled={disabled}
            className={cn("w-full justify-between", className)}
          >
            <span>{selectedLabel}</span>
            <IGRPIcon iconName="ChevronsUpDown" />
          </IGRPButton>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn("p-0", className)}>
          <Command>
            {showFilter && <CommandInput placeholder={placeholder} className={cn("h-8")} />}
            <CommandList id={listId}>
              <CommandEmpty>{notFoundText ?? i18n.combobox.notFound}</CommandEmpty>
              <CommandGroup>
                {options?.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value.toString()}
                    onSelect={(currentValue) => handleSelect(currentValue)}
                  >
                    <span className={opt.color}>{opt.label}</span>
                    <IGRPIcon
                      iconName="Check"
                      className={cn("ml-auto size-4", selectedValue === opt.value ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface IGRPDataTableFilterFacetedProps<TData> extends Omit<
  IGRPDataTableFilterProps<TData>,
  "clearDates" | "placeholderMax" | "target"
> {
  labelFilter?: string
  labelSearchField?: string
  table?: Table<TData>
  showFilter?: boolean
}

/** Multi-select faceted filter with search. */
function IGRPDataTableFilterFaceted<TData>({
  column,
  placeholder,
  options,
  className,
  labelFilter,
  labelSearchField,
  showFilter = false,
  iconName = "BadgePlus",
}: IGRPDataTableFilterFacetedProps<TData>) {
  const i18n = useIGRPi18n()
  const resolvedPlaceholder = placeholder ?? i18n.dataTable.filterSelectPlaceholder
  const resolvedLabelFilter = labelFilter ?? i18n.dataTable.clearFilter
  const resolvedLabelSearchField = labelSearchField ?? i18n.dataTable.filterNoResults
  const id = useId()

  const facets = column?.getFacetedUniqueValues()
  const filterValue = column?.getFilterValue() as (string | number)[] | undefined
  const selectedValues = useMemo(() => new Set<string | number>(filterValue ?? []), [filterValue])

  const handleSelect = useCallback(
    (value: string | number) => {
      const next = new Set(selectedValues)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      const filterValues = Array.from(next)
      column?.setFilterValue(filterValues.length ? filterValues : undefined)
    },
    [column, selectedValues]
  )

  const handleClear = useCallback(() => {
    column?.setFilterValue(undefined)
  }, [column])

  return (
    <div id={`faceted-${id}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <IGRPIcon iconName={iconName} />
            {resolvedPlaceholder}
            {selectedValues?.size > 0 && (
              <>
                <Separator orientation="vertical" className={cn("h-2")} />
                <IGRPBadge variant="soft" color="primary" badgeClassName="rounded-sm px-1 font-normal">
                  {selectedValues.size}
                </IGRPBadge>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto min-w-36 p-1")} align="start">
          <Command>
            {showFilter && <CommandInput placeholder={resolvedPlaceholder} className={cn("h-8")} />}
            <CommandEmpty>{resolvedLabelSearchField}</CommandEmpty>
            <CommandGroup>
              {options?.map((option, i) => (
                <CommandItem
                  key={String(option.value)}
                  value={String(option.value)}
                  onSelect={() => handleSelect(option.value)}
                  className={cn("gap-2", className)}
                >
                  <Checkbox
                    id={`${id}-${i}`}
                    checked={selectedValues.has(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                    aria-label={option.label}
                    className={cn("border-foreground")}
                  />
                  <label htmlFor={`${id}-${i}`} className="flex-1 cursor-pointer">
                    {option.label}
                  </label>
                  <span className="ml-auto font-mono text-xs">{facets?.get(option.value) ?? 0}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={handleClear}>
                    <IGRPIcon iconName="X" />
                    {resolvedLabelFilter}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

type IGRPDataTableFilterInputProps<TData> = Pick<
  IGRPDataTableFilterProps<TData>,
  "column" | "placeholder" | "className" | "iconName"
> & {
  /** Accessible label for the filter input. */
  ariaLabel?: string
}

/** Text input filter. */
function IGRPDataTableFilterInput<TData>({
  column,
  placeholder,
  className,
  iconName = "ListFilter",
  ariaLabel,
}: IGRPDataTableFilterInputProps<TData>) {
  const i18n = useIGRPi18n()
  const resolvedPlaceholder = placeholder ?? i18n.dataTable.filterSearchPlaceholder
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const resolvedAriaLabel = ariaLabel ?? i18n.dataTable.filterLabel

  return (
    <div className={cn("relative")}>
      <Input
        placeholder={resolvedPlaceholder}
        value={(column?.getFilterValue() ?? "") as string}
        onChange={(e) => column?.setFilterValue(e.target.value)}
        className={cn("peer min-w-60 ps-9", Boolean(column?.getFilterValue()) && "pe-9", className)}
        name={`text-${id}`}
        ref={inputRef}
        type="text"
        aria-label={resolvedAriaLabel}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50"
        )}
      >
        <IGRPIcon iconName={iconName} className={cn("size-3")} />
      </div>
      {Boolean(column?.getFilterValue()) && (
        <button
          className={cn(
            "absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          )}
          aria-label={i18n.dataTable.clearFilter}
          onClick={() => {
            column?.setFilterValue("")
            if (inputRef.current) {
              inputRef.current.focus()
            }
          }}
        >
          <IGRPIcon iconName="CircleX" />
        </button>
      )}
    </div>
  )
}

/** Min/max number range filter. */
function IGRPDataTableFilterMinMax<TData>({
  column,
  placeholder: placeholderMin = "Min",
  placeholderMax = "Max",
}: Omit<IGRPDataTableFilterProps<TData>, "options" | "clearDates" | "target">) {
  const id = useId()
  const columnFilterValue = column?.getFilterValue() as [number, number]
  const columnHeader = typeof column?.columnDef.header === "string" ? column.columnDef.header : ""

  return (
    <div className={cn("flex gap-2")}>
      <Input
        id={`${id}-min`}
        className={cn(
          "flex-1 rounded-e-none [-moz-appearance:textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        )}
        value={columnFilterValue?.[0] ?? ""}
        onChange={(e) =>
          column?.setFilterValue((old: [number, number]) => [
            e.target.value ? Number(e.target.value) : undefined,
            old?.[1],
          ])
        }
        placeholder={placeholderMin}
        type="number"
        aria-label={`${columnHeader} min`}
      />
      <Input
        id={`${id}-range-2`}
        className={cn(
          "-ms-px flex-1 rounded-s-none [-moz-appearance:textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        )}
        value={(columnFilterValue as [number, number])?.[1] ?? ""}
        onChange={(e) =>
          column?.setFilterValue((old: [number, number]) => [
            old?.[0],
            e.target.value ? Number(e.target.value) : undefined,
          ])
        }
        placeholder={placeholderMax}
        type="number"
        aria-label={`${columnHeader} max`}
      />
    </div>
  )
}

function IGRPDataTableFilterSelect<TData>({
  column,
  options,
  placeholder,
  className,
}: Omit<IGRPDataTableFilterProps<TData>, "clearDates" | "placeholderMax" | "target">) {
  const i18n = useIGRPi18n()
  const resolvedPlaceholder = placeholder ?? i18n.dataTable.filterSelectPlaceholder
  const id = useId()
  const columnFilterValue = column?.getFilterValue()

  return (
    <Select
      value={columnFilterValue?.toString() ?? resolvedPlaceholder}
      onValueChange={(value) => {
        column?.setFilterValue(value === "all" ? undefined : value)
      }}
    >
      <SelectTrigger id={`${id}-select`} className={cn(className)}>
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent className={cn(className)}>
        <SelectGroup>
          <SelectItem value="all">{resolvedPlaceholder}</SelectItem>
          {options?.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export {
  IGRPDataTableFilterDate,
  IGRPDataTableFilterDropdown,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableFilterMinMax,
  IGRPDataTableFilterSelect,
}

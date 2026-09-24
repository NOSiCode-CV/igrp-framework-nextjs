"use client"

import * as React from "react"
import { format } from "date-fns"
import { useFormContext } from "react-hook-form"
import { type DateRange } from "react-day-picker"
import { CalendarIcon } from "lucide-react"

import { toLocalDateRange } from "../../../../lib/calendar-utils.js"
import { cn } from "../../cn.js"
import type { IGRPDatePickerBaseProps } from "../../../../types.js"
import { Button } from "../../../primitives/button.js"
import { Calendar } from "../../../primitives/calendar.js"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../../primitives/form.js"
import { Popover, PopoverContent, PopoverTrigger } from "../../../primitives/popover.js"
import { IGRPLabel } from "../../label.js"
import { type IGRPCalendarRangeProps } from "../../calendar/range.js"
import { DD_MM_YYYY } from "../../../../lib/utilities.js"
import { Field } from "../../../primitives/field.js"

/** @internal Popover + calendar + clear button for date range. */
function DatePickerRangeField({
  value,
  onChange,
  fieldName,
  calendarProps,
  placeholder,
  dateFormat,
  disabled,
  disabledPicker,
}: {
  value: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  fieldName: string
  calendarProps: React.ComponentProps<typeof Calendar>
  placeholder: string
  dateFormat: string
  disabled?: IGRPCalendarRangeProps["disabled"]
  disabledPicker?: boolean
}) {
  const selectionCompleteRef = React.useRef(false)
  const displayText = value?.from
    ? value.to
      ? `${format(value.from, dateFormat)} - ${format(value.to, dateFormat)}`
      : format(value.from, dateFormat)
    : placeholder

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={fieldName}
          variant="outline"
          disabled={disabledPicker}
          className={cn("group w-full justify-start shadow-xs", !value?.from && "text-muted-foreground")}
        >
          <CalendarIcon
            className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
            aria-hidden="true"
          />

          <span className={cn("truncate", !value?.from && "text-muted-foreground")}>{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          {...calendarProps}
          id={fieldName}
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={(val) => {
            onChange(val)
            if (val?.from && val?.to) {
              selectionCompleteRef.current = true
            }
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Props for the IGRPDatePickerRange component.
 * @see IGRPDatePickerRange
 */
type IGRPDatePickerRangeProps = IGRPCalendarRangeProps & IGRPDatePickerBaseProps

/**
 * Date range picker with popover calendar. Integrates with react-hook-form.
 */
function IGRPDatePickerRange({
  name,
  id,
  date,
  onDateChange,
  label,
  labelClassName,
  helperText,
  className,
  required = false,
  disabledPicker = false,
  disabled,
  dateFormat = DD_MM_YYYY,
  placeholder = "Pick a date",
  ...props
}: IGRPDatePickerRangeProps) {
  const _id = React.useId()
  const fieldName = name ?? id ?? _id

  const [localDate, setLocalDate] = React.useState<DateRange | undefined>(undefined)
  const displayDate = date ?? localDate
  const formContext = useFormContext()

  React.useEffect(() => {
    if (!formContext && typeof onDateChange !== "function") {
      console.warn("DatePickerRange in standalone mode requires `onDateChange`")
    }
  }, [formContext, onDateChange])

  const fieldProps = {
    fieldName,
    calendarProps: props,
    placeholder,
    dateFormat,
    disabled,
    disabledPicker,
  }

  if (formContext) {
    return (
      <FormField
        control={formContext.control}
        name={fieldName}
        render={({ field, fieldState }) => (
          <FormItem className={className}>
            {label && (
              <FormLabel className={cn(labelClassName, required && 'after:text-destructive after:content-["*"]')}>
                {label}
              </FormLabel>
            )}
            <FormControl>
              <DatePickerRangeField
                {...fieldProps}
                value={toLocalDateRange(field.value)}
                onChange={(val) => {
                  field.onChange(val)
                  onDateChange?.(val)
                }}
              />
            </FormControl>

            {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Field className={className}>
      {label && <IGRPLabel label={label} required={required} id={name} className={labelClassName} />}

      <DatePickerRangeField
        {...fieldProps}
        value={displayDate}
        onChange={(val) => {
          setLocalDate(val)
          onDateChange?.(val)
        }}
      />

      {helperText && <p className={cn("mt-1 text-sm text-muted-foreground")}>{helperText}</p>}
    </Field>
  )
}

export { IGRPDatePickerRange, type IGRPDatePickerRangeProps }

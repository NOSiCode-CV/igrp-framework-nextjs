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
import { IGRPLabel, IGRPRequiredMark } from "../../label.js"
import { type IGRPCalendarRangeProps } from "../../calendar/range.js"
import { DD_MM_YYYY } from "../../../../lib/utilities.js"
import { Field } from "../../../primitives/field.js"
import { useIGRPi18n, useIGRPLocale } from "../../../../i18n/index.js"
import { igrpDateFnsLocale } from "../../../../i18n/date-fns-locale.js"

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
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  labelId,
  triggerRef,
  onClose,
}: {
  value: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  fieldName: string
  calendarProps: React.ComponentProps<typeof Calendar>
  placeholder: string
  dateFormat: string
  disabled?: IGRPCalendarRangeProps["disabled"]
  disabledPicker?: boolean
  /** `id` and the aria props below come from `FormControl` (via Slot) in form mode; they go on the trigger. */
  id?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  /** Id of the visible label: the trigger is named by it plus the displayed value. */
  labelId?: string
  /** react-hook-form's `field.ref`, so the trigger is focused when the field is invalid. */
  triggerRef?: React.Ref<HTMLButtonElement>
  /** Called when the popover closes — form-bound fields mark themselves touched here. */
  onClose?: () => void
}) {
  const locale = igrpDateFnsLocale(useIGRPLocale())
  const displayText = value?.from
    ? value.to
      ? `${format(value.from, dateFormat, { locale })} - ${format(value.to, dateFormat, { locale })}`
      : format(value.from, dateFormat, { locale })
    : placeholder
  const triggerId = id ?? fieldName

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) onClose?.()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={triggerId}
          variant="outline"
          disabled={disabledPicker}
          // <label for> would replace the button text as its name; this keeps the dates read too.
          aria-labelledby={labelId ? `${labelId} ${triggerId}-value` : undefined}
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          className={cn("group w-full justify-start border-input shadow-xs", !value?.from && "text-muted-foreground")}
        >
          <CalendarIcon
            className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
            aria-hidden="true"
          />

          <span id={`${triggerId}-value`} className={cn("truncate", !value?.from && "text-muted-foreground")}>
            {displayText}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          {...calendarProps}
          id={`${triggerId}-calendar`}
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
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
function IGRPDatePickerRange(allProps: IGRPDatePickerRangeProps) {
  // See IGRPDatePickerSingle: `date ?? localDate` cannot express "cleared" by the parent.
  const isControlled = "date" in allProps

  const {
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
    placeholder: placeholderProp,
    ...props
  } = allProps

  const i18n = useIGRPi18n()
  const placeholder = placeholderProp ?? i18n.datePicker.placeholder
  const _id = React.useId()
  const fieldName = name ?? id ?? _id

  const [localDate, setLocalDate] = React.useState<DateRange | undefined>(undefined)
  const displayDate = isControlled ? date : localDate
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
    labelId: label ? `${fieldName}-label` : undefined,
  }

  if (formContext) {
    return (
      <FormField
        control={formContext.control}
        name={fieldName}
        render={({ field, fieldState }) => (
          <FormItem className={className}>
            {label && (
              <FormLabel id={`${fieldName}-label`} className={cn(labelClassName)}>
                {label}
                {required && <IGRPRequiredMark />}
              </FormLabel>
            )}
            <FormControl>
              <DatePickerRangeField
                {...fieldProps}
                value={toLocalDateRange(field.value)}
                onChange={(val) => {
                  // null on clear: see IGRPDatePickerSingle.
                  field.onChange(val ?? null)
                  onDateChange?.(val)
                }}
                triggerRef={field.ref}
                onClose={field.onBlur}
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
      {label && (
        <IGRPLabel
          label={label}
          required={required}
          id={fieldName}
          labelId={`${fieldName}-label`}
          className={labelClassName}
        />
      )}

      <DatePickerRangeField
        {...fieldProps}
        aria-describedby={helperText ? `${fieldName}-helper` : undefined}
        value={displayDate}
        onChange={(val) => {
          setLocalDate(val)
          onDateChange?.(val)
        }}
      />

      {helperText && (
        <p id={`${fieldName}-helper`} className={cn("mt-1 text-sm text-muted-foreground")}>
          {helperText}
        </p>
      )}
    </Field>
  )
}

export { IGRPDatePickerRange, type IGRPDatePickerRangeProps }

"use client"

import { useCallback, useEffect, useId, useState } from "react"
import { useFormContext } from "react-hook-form"
import { CalendarIcon, XIcon } from "lucide-react"

import { formatDateToString, getDisabledDays, toLocalDate } from "../../../../lib/calendar-utils.js"
import { getDateFormatMaxLength, maskDateInput, parseDateInput } from "../../../../lib/date-input-format.js"
import { DD_MM_YYYY } from "../../../../lib/utilities.js"
import { cn } from "../../cn.js"
import { type IGRPDatePickerBaseProps } from "../../../../types.js"
import { Button } from "../../../primitives/button.js"
import { Calendar } from "../../../primitives/calendar.js"
import {
  useFormField,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../primitives/form.js"
import { Input } from "../../../primitives/input.js"
import { Popover, PopoverContent, PopoverTrigger } from "../../../primitives/popover.js"
import { type IGRPCalendarSingleProps } from "../../calendar/single.js"
import { IGRPLabel } from "../../label.js"
import { Field, FieldDescription } from "../../../primitives/field.js"
import { useIGRPi18n } from "../../../../i18n/index.js"

/**
 * Props for the IGRPDatePickerInputSingle component.
 * @see IGRPDatePickerInputSingle
 */
type IGRPDatePickerInputSingleProps = IGRPCalendarSingleProps &
  IGRPDatePickerBaseProps & {
    /** CSS classes for the input group wrapper. */
    inputGroupClassName?: string
  }

/** @internal The handlers a field needs, built once per commit target. */
type DatePickerInputHandlers = {
  onInputChange: (rawValue: string) => void
  onInputBlur: () => void
  onClear: () => void
  onSelect: (date: Date | undefined) => void
}

/** @internal Input + calendar popover field. */
function DatePickerInputSingleField({
  inputId,
  calendarId,
  value,
  displayValue,
  placeholder,
  disabledPicker,
  disabledDays,
  calendarProps,
  className,
  maxLength,
  inputMode,
  ariaInvalid,
  ariaDescribedBy,
  onInputChange,
  onInputBlur,
  onClear,
  onSelect,
}: DatePickerInputHandlers & {
  inputId: string
  calendarId: string
  value: Date | undefined
  displayValue: string
  placeholder: string
  disabledPicker: boolean
  disabledDays: ReturnType<typeof getDisabledDays>
  calendarProps: Omit<IGRPCalendarSingleProps, "date" | "onDateChange">
  className?: string
  maxLength?: number
  inputMode?: "numeric"
  ariaInvalid?: boolean
  ariaDescribedBy?: string
}) {
  const i18n = useIGRPi18n()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date | undefined>(value)
  const [syncedValueTime, setSyncedValueTime] = useState<number | undefined>(value?.getTime())

  // Follow the field: typing a date scrolls the calendar to it, while a month the user
  // navigated to by hand survives until the value itself changes. Adjusted during render
  // rather than in an effect — https://react.dev/learn/you-might-not-need-an-effect
  const valueTime = value?.getTime()
  if (valueTime !== syncedValueTime) {
    setSyncedValueTime(valueTime)
    if (valueTime !== undefined) setMonth(new Date(valueTime))
  }

  const hasText = displayValue.length > 0

  return (
    <div className={cn("relative flex gap-2")}>
      <Input
        id={inputId}
        name={inputId}
        value={displayValue}
        placeholder={placeholder}
        // Browser form-history suggestions arrive as plain text that rarely matches
        // `dateFormat`, and the dropdown covers the calendar. The calendar is the picker.
        autoComplete="off"
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={cn("bg-background", hasText ? "pr-14" : "pr-10")}
        disabled={disabledPicker}
        onChange={(e) => onInputChange(e.target.value)}
        onBlur={onInputBlur}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !disabledPicker) {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />

      {hasText && (
        <Button
          type="button"
          id={`${inputId}-clean`}
          variant="ghost"
          className={cn("absolute top-1/2 right-8 size-6 -translate-y-1/2")}
          disabled={disabledPicker}
          aria-label={i18n.datePicker.clear}
          onClick={onClear}
        >
          <XIcon className={cn("size-3.5")} />
        </Button>
      )}

      <Popover
        open={disabledPicker ? false : open}
        onOpenChange={(v) => {
          if (!disabledPicker) setOpen(v)
        }}
      >
        {/* Rendered unconditionally: hiding the trigger once a date was picked left the
            popover with no anchor, and no way back into the calendar but an undiscoverable
            ArrowDown. */}
        <PopoverTrigger asChild>
          <Button
            type="button"
            id={`date-picker-btn-${inputId}`}
            variant="ghost"
            className={cn("absolute top-1/2 right-2 size-6 -translate-y-1/2")}
            disabled={disabledPicker}
          >
            <CalendarIcon className={cn("size-3.5")} />
            <span className={cn("sr-only")}>{i18n.datePicker.open}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0 shadow-none")} align="start" alignOffset={-8} sideOffset={10}>
          <Calendar
            mode="single"
            id={calendarId}
            selected={value}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={(next) => {
              onSelect(next)
              setOpen(false)
            }}
            disabled={disabledDays}
            className={cn("rounded-lg border shadow-sm", className)}
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * @internal Wrapper rendered inside FormItem that reads the form context, so the generated id
 * and the error wiring land on the real `input` element rather than on the wrapper.
 */
function DatePickerInputSingleFieldWithA11y(
  props: Omit<React.ComponentProps<typeof DatePickerInputSingleField>, "inputId" | "ariaInvalid" | "ariaDescribedBy">
) {
  const { error, formItemId, formMessageId, formDescriptionId } = useFormField()
  return (
    <DatePickerInputSingleField
      {...props}
      inputId={formItemId}
      ariaInvalid={!!error}
      ariaDescribedBy={error ? formMessageId : formDescriptionId}
    />
  )
}

/**
 * Single-date picker with text input and calendar popover.
 * Supports typing dates and picking from calendar. Integrates with react-hook-form.
 */
function IGRPDatePickerInputSingle(allProps: IGRPDatePickerInputSingleProps) {
  // See IGRPCalendarSingle: `date ?? localDate` cannot express "cleared".
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
    dateFormat = DD_MM_YYYY,
    placeholder: placeholderProp,
    disableBefore,
    disableAfter,
    disableDayOfWeek,
    inputGroupClassName,
    ...calendarProps
  } = allProps

  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()

  /**
   * Raw text while the field is being edited; `null` once it settles, so the display falls
   * back to the committed date formatted with `dateFormat`.
   *
   * The draft is what keeps a half-typed date alive. The previous implementation pushed every
   * keystroke into the form and re-read the answer, so the first backspace on `26-08-2026`
   * parsed as invalid, wrote `undefined`, and the sync effect wiped the input.
   */
  const [draft, setDraft] = useState<string | null>(null)
  const [localDate, setLocalDate] = useState<Date | undefined>(undefined)

  const placeholder = placeholderProp ?? dateFormat
  const disabledDays = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek })
  const maxLength = getDateFormatMaxLength(dateFormat)

  useEffect(() => {
    if (!formContext && typeof onDateChange !== "function") {
      console.warn("DatePicker in standalone mode requires `onDateChange`")
    }
  }, [formContext, onDateChange])

  /**
   * Builds the field handlers around a single commit path, so `onDateChange` fires exactly
   * once per change — it used to be invoked by both the handler and its own callback.
   */
  const buildHandlers = useCallback(
    (commit: (next: Date | null) => void): DatePickerInputHandlers => ({
      onInputChange: (rawValue) => {
        const masked = maskDateInput(rawValue, dateFormat)
        setDraft(masked)

        if (!masked.trim()) {
          commit(null)
          return
        }

        // Half-typed text is not a new value. Committing `undefined` on every keystroke
        // dropped the stored date and fired validation for something nobody finished typing.
        const parsed = parseDateInput(masked, dateFormat)
        if (parsed) commit(parsed)
      },
      onInputBlur: () => setDraft(null),
      onClear: () => {
        setDraft(null)
        commit(null)
      },
      onSelect: (next) => {
        setDraft(null)
        commit(next ?? null)
      },
    }),
    [dateFormat]
  )

  const sharedProps = {
    calendarId: `${fieldName}-calendar`,
    placeholder,
    disabledPicker,
    disabledDays,
    calendarProps,
    className,
    maxLength,
    inputMode: maxLength === undefined ? undefined : ("numeric" as const),
  }

  if (formContext) {
    return (
      <Field className={className}>
        <FormField
          control={formContext.control}
          name={fieldName}
          render={({ field, fieldState }) => {
            const selected = toLocalDate(field.value)
            return (
              <FormItem className={inputGroupClassName}>
                {label && (
                  <FormLabel className={cn(labelClassName, required && 'after:text-destructive after:content-["*"]')}>
                    {label}
                  </FormLabel>
                )}
                <FormControl>
                  <DatePickerInputSingleFieldWithA11y
                    {...sharedProps}
                    value={selected}
                    displayValue={draft ?? formatDateToString(selected, dateFormat)}
                    {...buildHandlers((next) => {
                      // `null`, not `undefined`: react-hook-form reads an `undefined` field as
                      // "no value set" and `useWatch` hands back the *default*, so a cleared
                      // picker re-rendered the date it had just dropped.
                      field.onChange(next)
                      onDateChange?.(next ?? undefined)
                    })}
                  />
                </FormControl>

                {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
                <FormMessage className={cn("text-xs")} />
              </FormItem>
            )
          }}
        />
      </Field>
    )
  }

  const selected = isControlled ? date : localDate

  return (
    <Field className={className}>
      {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

      <DatePickerInputSingleField
        {...sharedProps}
        inputId={fieldName}
        value={selected}
        displayValue={draft ?? formatDateToString(selected, dateFormat)}
        ariaDescribedBy={helperText ? `${fieldName}-helper` : undefined}
        {...buildHandlers((next) => {
          setLocalDate(next ?? undefined)
          onDateChange?.(next ?? undefined)
        })}
      />

      {helperText && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}
    </Field>
  )
}

export { IGRPDatePickerInputSingle, type IGRPDatePickerInputSingleProps }

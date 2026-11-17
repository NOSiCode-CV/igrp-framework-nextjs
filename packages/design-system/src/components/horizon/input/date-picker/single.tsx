"use client"

import { useId, useState, useEffect } from "react"
import { format } from "date-fns"
import { useFormContext } from "react-hook-form"
import { CalendarIcon } from "lucide-react"

import { toLocalDate } from "../../../../lib/calendar-utils.js"
import { DD_MM_YYYY } from "../../../../lib/utilities.js"
import { cn } from "../../cn.js"
import { type IGRPDatePickerBaseProps } from "../../../../types.js"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../../primitives/form.js"
import { Button } from "../../../primitives/button.js"
import { Popover, PopoverContent, PopoverTrigger } from "../../../primitives/popover.js"
import { IGRPButton } from "../../button.js"
import { IGRPCalendarSingle, type IGRPCalendarSingleProps } from "../../calendar/single.js"
import { IGRPLabel, IGRPRequiredMark } from "../../label.js"
import { Field, FieldDescription, FieldError } from "../../../primitives/field.js"
import { useIGRPi18n, useIGRPLocale } from "../../../../i18n/index.js"
import { igrpDateFnsLocale } from "../../../../i18n/date-fns-locale.js"

/** @internal Popover + calendar + clear button. */
function DatePickerSingleField({
  value,
  onChange,
  onClear,
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
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  onClear: () => void
  fieldName: string
  calendarProps: Omit<IGRPCalendarSingleProps, "date" | "onDateChange" | "id">
  placeholder: string
  dateFormat: string
  disabled?: boolean
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
  const i18n = useIGRPi18n()
  const locale = igrpDateFnsLocale(useIGRPLocale())
  const [open, setOpen] = useState(false)
  const isDisabled = disabledPicker || disabled
  const displayText = value ? format(value, dateFormat, { locale }) : placeholder
  const triggerId = id ?? fieldName

  return (
    <div className={cn("relative")}>
      <Popover
        open={isDisabled ? false : open}
        onOpenChange={(next) => {
          if (isDisabled) return
          setOpen(next)
          if (!next) onClose?.()
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            id={triggerId}
            variant="outline"
            disabled={isDisabled}
            // <label for> would replace the button text as its name; this keeps the date read too.
            aria-labelledby={labelId ? `${labelId} ${triggerId}-value` : undefined}
            aria-invalid={ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "group w-full justify-between border-input font-normal shadow-xs",
              !value && "text-muted-foreground"
            )}
          >
            <span id={`${triggerId}-value`} className={cn("truncate", !value && "text-muted-foreground")}>
              {displayText}
            </span>
            {!value && (
              <CalendarIcon
                className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0 shadow-none")} align="start">
          <IGRPCalendarSingle
            id={`${triggerId}-calendar`}
            date={value}
            onDateChange={(next) => {
              onChange(next)
              setOpen(false)
            }}
            captionLayout="dropdown"
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <IGRPButton
          onClick={onClear}
          variant="link"
          className={cn("absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground")}
          size="icon"
          iconName="X"
          aria-label={i18n.datePicker.clear}
          disabled={isDisabled}
          showIcon
        />
      )}
    </div>
  )
}

/**
 * Props for the IGRPDatePickerSingle component.
 * @see IGRPDatePickerSingle
 */
type IGRPDatePickerSingleProps = IGRPCalendarSingleProps & IGRPDatePickerBaseProps

/**
 * Single-date picker with popover calendar. Integrates with react-hook-form.
 */
function IGRPDatePickerSingle(allProps: IGRPDatePickerSingleProps) {
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
    error,
    className,
    required = false,
    disabledPicker = false,
    disabled,
    dateFormat = DD_MM_YYYY,
    placeholder,
    ...calendarProps
  } = allProps

  const i18n = useIGRPi18n()
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const [localDate, setLocalDate] = useState<Date | undefined>(undefined)
  const displayDate = isControlled ? date : localDate
  const formContext = useFormContext()

  useEffect(() => {
    if (!formContext && typeof onDateChange !== "function") {
      console.warn("DatePicker in standalone mode requires `onDateChange`")
    }
  }, [formContext, onDateChange])

  const fieldProps = {
    fieldName,
    calendarProps,
    placeholder: placeholder ?? i18n.datePicker.placeholder,
    dateFormat,
    disabled: !!disabled,
    disabledPicker,
    labelId: label ? `${fieldName}-label` : undefined,
  }

  if (formContext) {
    return (
      <Field className={className}>
        <FormField
          control={formContext.control}
          name={fieldName}
          render={({ field, fieldState }) => (
            <FormItem>
              {label && (
                <FormLabel id={`${fieldName}-label`} className={cn(labelClassName)}>
                  {label}
                  {required && <IGRPRequiredMark />}
                </FormLabel>
              )}
              <FormControl>
                <DatePickerSingleField
                  {...fieldProps}
                  value={toLocalDate(field.value)}
                  onChange={(val) => {
                    field.onChange(val ?? null)
                    onDateChange?.(val)
                  }}
                  // `null`, not `undefined`: react-hook-form reads an `undefined` field as
                  // "no value set" and `useWatch` hands back the *default* instead, so a
                  // cleared picker immediately re-rendered the date it had just dropped.
                  onClear={() => {
                    field.onChange(null)
                    onDateChange?.(undefined)
                  }}
                  triggerRef={field.ref}
                  onClose={field.onBlur}
                />
              </FormControl>

              {helperText && !fieldState.error && !error && <FormDescription>{helperText}</FormDescription>}
              <FormMessage className={cn("text-xs")} message={error} />
            </FormItem>
          )}
        />
      </Field>
    )
  }

  return (
    <Field className={className}>
      {label && (
        <IGRPLabel
          label={label}
          className={labelClassName}
          required={required}
          id={fieldName}
          labelId={`${fieldName}-label`}
        />
      )}
      <DatePickerSingleField
        {...fieldProps}
        aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
        value={displayDate}
        onChange={(val) => {
          setLocalDate(val)
          onDateChange?.(val)
        }}
        onClear={() => {
          setLocalDate(undefined)
          onDateChange?.(undefined)
        }}
      />

      {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}
      {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
    </Field>
  )
}

export { IGRPDatePickerSingle, type IGRPDatePickerSingleProps }

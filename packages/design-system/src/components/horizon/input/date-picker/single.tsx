"use client"

import { useId, useState, useEffect } from "react"
import { format } from "date-fns"
import { useFormContext } from "react-hook-form"
import { CalendarIcon } from "lucide-react"

import { toLocalDate } from "../../../../lib/calendar-utils.js"
import { DD_MM_YYYY } from "../../../../lib/utilities.js"
import { cn } from "../../cn.js"
import { type IGRPDatePickerBaseProps } from "../../../../types.js"
import {
  useFormField,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../primitives/form.js"
import { Button } from "../../../primitives/button.js"
import { Popover, PopoverContent, PopoverTrigger } from "../../../primitives/popover.js"
import { IGRPButton } from "../../button.js"
import { IGRPCalendarSingle, type IGRPCalendarSingleProps } from "../../calendar/single.js"
import { IGRPLabel } from "../../label.js"
import { Field, FieldDescription } from "../../../primitives/field.js"
import { useIGRPi18n } from "../../../../i18n/index.js"

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
  ariaInvalid,
  ariaDescribedBy,
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
  ariaInvalid?: boolean
  ariaDescribedBy?: string
}) {
  const i18n = useIGRPi18n()
  const [open, setOpen] = useState(false)
  const isDisabled = disabledPicker || disabled
  const displayText = value ? format(value, dateFormat) : placeholder

  return (
    <div className={cn("relative")}>
      <Popover
        open={isDisabled ? false : open}
        onOpenChange={(next) => {
          if (!isDisabled) setOpen(next)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={fieldName}
            variant="outline"
            disabled={isDisabled}
            aria-invalid={ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            className={cn("group w-full justify-between font-normal shadow-xs", !value && "text-muted-foreground")}
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>{displayText}</span>
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
            id={fieldName}
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
          className={cn("absolute top-1/2 right-2 z-[100] size-3 -translate-y-1/2 text-muted-foreground")}
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
 * @internal Wrapper rendered inside FormItem that reads the form context to wire
 * aria-invalid / aria-describedby onto the actual date Button element.
 */
function DatePickerSingleFieldWithA11y(props: React.ComponentProps<typeof DatePickerSingleField>) {
  const { error, formItemId, formMessageId } = useFormField()
  return (
    <DatePickerSingleField
      {...props}
      fieldName={formItemId}
      ariaInvalid={!!error}
      ariaDescribedBy={error ? formMessageId : undefined}
    />
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
                <FormLabel className={cn(labelClassName, required && "after:text-destructive after:content-['*']")}>
                  {label}
                </FormLabel>
              )}
              <FormControl>
                <DatePickerSingleFieldWithA11y
                  {...fieldProps}
                  value={toLocalDate(field.value)}
                  onChange={(val) => {
                    field.onChange(val)
                    onDateChange?.(val)
                  }}
                  // `null`, not `undefined`: react-hook-form reads an `undefined` field as
                  // "no value set" and `useWatch` hands back the *default* instead, so a
                  // cleared picker immediately re-rendered the date it had just dropped.
                  onClear={() => {
                    field.onChange(null)
                    onDateChange?.(undefined)
                  }}
                />
              </FormControl>

              {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
              <FormMessage className={cn("text-xs")} />
            </FormItem>
          )}
        />
      </Field>
    )
  }

  return (
    <Field className={className}>
      {label && <IGRPLabel label={label} className={labelClassName} required={required} id={name} />}
      <DatePickerSingleField
        {...fieldProps}
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

      {helperText && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}
    </Field>
  )
}

export { IGRPDatePickerSingle, type IGRPDatePickerSingleProps }

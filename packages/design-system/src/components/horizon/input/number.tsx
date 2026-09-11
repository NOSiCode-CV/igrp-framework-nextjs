"use client"

import { useState, useEffect, useId, useRef } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { cn } from "../../../lib/utils"
import { useIGRPi18n } from "../../../i18n"
import type { IGRPInputProps } from "../../../types"
import { Input } from "../../primitives/input"
import { IGRPLabel } from "../label"
import { Button } from "../../primitives/button"
import { ChevronDown, ChevronUp } from "lucide-react"

/**
 * Props for the IGRPInputNumber component.
 * @see IGRPInputNumber
 */
interface IGRPInputNumberProps extends Omit<IGRPInputProps, "onChange"> {
  /** Field label. */
  label?: string
  /** Helper text below the input. */
  helperText?: string
  /** Description text. */
  description?: string
  /** Default numeric value. */
  defaultValue?: number
  /** Controlled numeric value. */
  value?: number
  /** Intl.NumberFormat options for display. */
  formatOptions?: Intl.NumberFormatOptions
  /** Minimum value. */
  min?: number
  /** Maximum value. */
  max?: number
  /** Step for increment/decrement. @deprecated This props will be deprecated in the next maojor release. */
  step?: number
  /** Called when value changes. */
  onChange?: (value: number) => void
  /** Validation error message. */
  error?: string
  /** Message shown when validation fails. */
  errorMessage?: string
}

type NumberValue = number | ""

/** @internal Group/decimal separators of the runtime's default locale. */
function getLocaleSeparators(): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1 }).formatToParts(12345.6)
  return {
    group: parts.find((part) => part.type === "group")?.value ?? ",",
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
  }
}

/**
 * @internal Parses what the user typed into a number.
 * Unformatted fields are parsed with "." as the decimal separator; formatted
 * fields are parsed with the locale separators used to display them, so a
 * value such as "1 234,56" can be edited in place instead of collapsing into
 * 123456.
 */
function parseInputToNumber(inputValue: string, formatOptions?: Intl.NumberFormatOptions): number {
  if (!formatOptions) {
    return parseFloat(inputValue.replace(/[^\d.-]/g, ""))
  }

  const { group, decimal } = getLocaleSeparators()
  let cleaned = inputValue.split(group).join("")
  cleaned = cleaned.replace(/[\s\u00a0\u202f]/g, "")
  if (decimal !== ".") cleaned = cleaned.split(decimal).join(".")
  cleaned = cleaned.replace(/[^\d.-]/g, "")

  const parsed = parseFloat(cleaned)
  return formatOptions.style === "percent" ? parsed / 100 : parsed
}

/** @internal Decimal places held by a value, capped at a sane precision. */
function countDecimals(value: number): number {
  if (!Number.isFinite(value)) return 0

  const text = String(value)
  if (text.includes("e-")) {
    const [mantissa, exponent] = text.split("e-")
    return Math.min(10, countDecimals(Number(mantissa)) + Number(exponent))
  }

  const separator = text.indexOf(".")
  return separator === -1 ? 0 : Math.min(10, text.length - separator - 1)
}

/** @internal Rounds away binary floating point noise (12.549999999999999 -> 12.55). */
function roundToPrecision(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** Math.min(10, Math.max(0, decimals))
  return Math.round(value * factor) / factor
}

/**
 * @internal Turns the stored value into the string the user edits while the
 * field is focused — unformatted, and in the same unit they type in (percent
 * fields are edited as 25, not 0.25).
 */
function toEditableString(value: NumberValue, formatOptions?: Intl.NumberFormatOptions): string {
  if (value === "") return ""
  if (formatOptions?.style === "percent") {
    return String(roundToPrecision(value * 100, countDecimals(value) + 2))
  }
  return String(value)
}

/** @internal Props for the number input field UI. */
type NumberInputFieldProps = {
  value: NumberValue
  onValueChange?: (newValue: NumberValue) => void
  fieldError?: boolean
  label?: string
  fieldName: string
  labelClassName?: string
  isFocused: boolean
  /** Raw text being typed; `null` when the field is not being edited. */
  draft: string | null
  onFieldFocus: (val: NumberValue) => void
  onFieldBlur: (updateFn?: (v: NumberValue) => void) => void
  onInputChange: (raw: string, updateFn?: (v: NumberValue) => void) => void
  error?: string
  validationError: boolean
  formatOptions?: Intl.NumberFormatOptions
  min?: number
  max?: number
  disabled: boolean
  readOnly: boolean
  required?: boolean
  onIncrement: (val: NumberValue, updateFn?: (v: NumberValue) => void) => void
  onDecrement: (val: NumberValue, updateFn?: (v: NumberValue) => void) => void
  getDisplayValue: (v: NumberValue) => string
} & Omit<IGRPInputNumberProps, "value" | "onChange" | "label" | "helperText" | "description" | "error" | "errorMessage">

/** @internal Renders the number input field with stepper buttons. */
function NumberInputField({
  value,
  onValueChange,
  fieldError,
  label,
  fieldName,
  labelClassName,
  isFocused,
  draft,
  onFieldFocus,
  onFieldBlur,
  onInputChange,
  error,
  validationError,
  // Destructured only to keep it out of `inputProps` — formatting happens in
  // `getDisplayValue`, and the option object must never reach the DOM.
  formatOptions: _formatOptions,
  min,
  max,
  disabled,
  readOnly,
  required,
  onIncrement,
  onDecrement,
  getDisplayValue,
  ...inputProps
}: NumberInputFieldProps) {
  const i18n = useIGRPi18n()
  void _formatOptions
  // While editing, show exactly what was typed — reformatting per keystroke
  // would swallow a half-typed decimal such as "3.".
  const displayValue = draft ?? getDisplayValue(value)

  return (
    <div className={cn("*:not-first:mt-2")}>
      {label ? (
        <IGRPLabel 
          label={label}
          className={labelClassName} 
          required={required} 
          id={fieldName} 
        />) : null
      }
      <div
        className={cn(
          "border-input outline-none relative inline-flex h-10 w-full items-center overflow-hidden rounded-md border text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow]",
          isFocused && "border-ring ring-2 ring-ring/50",
          (error || validationError || fieldError) && "ring-destructive/20 dark:ring-destructive/40 border-destructive",
          disabled && "opacity-50",
        )}
      >
        <Input
          id={fieldName}
          name={fieldName}
          type="text"
          value={displayValue}
          onChange={(e) => onInputChange(e.target.value, onValueChange)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault()
              onIncrement(value, onValueChange)
            } else if (e.key === "ArrowDown") {
              e.preventDefault()
              onDecrement(value, onValueChange)
            }
          }}
          onFocus={() => onFieldFocus(value)}
          onBlur={() => onFieldBlur(onValueChange)}
          className={cn(
            "bg-background text-foreground flex-1 px-3 py-2 tabular-nums outline-none border-none focus-visible:outline-none focus-visible:ring-ring/0 focus-visible:ring-0 rounded-none",
          )}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!!(error || validationError || fieldError)}
          aria-valuenow={typeof value === "number" ? value : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          role="spinbutton"
          {...inputProps}
        />
        {!readOnly && (
          <div className={cn("flex h-full flex-col border-l")}>
            <Button
              type="button"
              onClick={() => onIncrement(value, onValueChange)}
              disabled={disabled || (max !== undefined && typeof value === "number" && value >= max)}
              className={cn(
                "bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex h-1/2 w-8 items-center justify-center border-b transition-colors rounded-none",
              )}
              aria-label={i18n.inputNumber.incrementLabel}
              size="icon-xs"
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              onClick={() => onDecrement(value, onValueChange)}
              disabled={disabled || (min !== undefined && typeof value === "number" && value <= min)}
              className={cn(
                "bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground flex h-1/2 w-8 items-center justify-center text-xs transition-colors rounded-none",
              )}
              aria-label={i18n.inputNumber.decrementLabel}
              size="icon-xs"
            >
              <ChevronDown />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/** @internal Props for form-connected number input. */
type FormNumberInputProps = {
  field: { value: unknown; onChange: (v: unknown) => void }
  fieldState: { error?: { message?: string } }
  controlledValue: number | undefined
  prevControlledValueRef: React.MutableRefObject<number | undefined>
  numberInputFieldProps: Omit<NumberInputFieldProps, "value" | "onValueChange" | "fieldError">
  helperOrDescription: string | undefined
  error: string | undefined
  errorMessage: string
  validationError: boolean
  setValidationError: (v: boolean) => void
  onValueChange?: (value: number) => void
  className?: string
}

/** @internal Syncs controlledValue prop with form field and renders the input. */
function FormNumberInput({
  field,
  fieldState,
  controlledValue,
  prevControlledValueRef,
  numberInputFieldProps,
  helperOrDescription,
  error,
  errorMessage,
  validationError,
  setValidationError,
  onValueChange,
  className,
}: FormNumberInputProps) {
  useEffect(() => {
    const controlledValueChanged = prevControlledValueRef.current !== controlledValue
    if (controlledValueChanged) {
      prevControlledValueRef.current = controlledValue
    }
    if (controlledValueChanged && field.value !== controlledValue) {
      field.onChange(controlledValue === undefined ? undefined : controlledValue)
    }
  }, [field.value, controlledValue, field, prevControlledValueRef])

  const displayValue = (() => {
    if (controlledValue !== undefined) return controlledValue
    const raw = field.value
    if (raw === "" || raw === undefined || raw === null) return ""
    const parsed = typeof raw === "number" ? raw : parseFloat(String(raw))
    return Number.isFinite(parsed) ? parsed : ""
  })() as NumberValue

  const formOnValueChange = (newValue: NumberValue) => {
    if (newValue === "") {
      field.onChange(undefined)
      setValidationError(false)
      return
    }
    field.onChange(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className={cn("w-full", className)}>
      <NumberInputField
        {...numberInputFieldProps}
        value={displayValue}
        onValueChange={formOnValueChange}
        fieldError={!!fieldState.error}
      />
      {helperOrDescription && !error && !fieldState.error && !validationError && (
        <p className={cn("text-muted-foreground mt-2 text-xs")} role="region" aria-live="polite">
          {helperOrDescription}
        </p>
      )}
      {(error || fieldState.error || validationError) && (
        <p className={cn("text-destructive mt-2 text-xs")} role="alert">
          {error || fieldState.error?.message || errorMessage}
        </p>
      )}
    </div>
  )
}

/**
 * Numeric input with stepper, formatting, and min/max. Integrates with react-hook-form.
 */
function IGRPInputNumber({
  name,
  id,
  label,
  helperText,
  description,
  className,
  defaultValue,
  value: controlledValue,
  formatOptions,
  min,
  max,
  disabled = false,
  readOnly = false,
  step = 1,
  onChange,
  error,
  errorMessage,
  required,
  ...props
}: IGRPInputNumberProps) {
  const i18n = useIGRPi18n()
  const resolvedErrorMessage = errorMessage ?? i18n.inputNumber.invalidValueMessage
  const { onFocus: _onFocus, onBlur: _onBlur, ...inputProps } = props
  void _onFocus
  void _onBlur
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const [localValue, setLocalValue] = useState<NumberValue>(controlledValue ?? defaultValue ?? "")
  const [isFocused, setIsFocused] = useState(false)
  const [validationError, setValidationError] = useState(false)
  // Raw text while the field is being edited. Kept verbatim so half-typed
  // decimals ("3.", "-", "1,2") survive until the field is left.
  const [draft, setDraft] = useState<string | null>(null)
  const formContext = useFormContext()
  const prevControlledValueRef = useRef<number | undefined>(controlledValue)

  const formatter = new Intl.NumberFormat(undefined, formatOptions)

  const displayValue = !formContext && controlledValue !== undefined ? controlledValue : localValue

  const constrainValue = (newValue: number): number => {
    if (min !== undefined && newValue < min) {
      return min
    }
    if (max !== undefined && newValue > max) {
      return max
    }
    return newValue
  }

  const updateStandaloneValue = (newValue: number) => {
    const constrainedValue = constrainValue(newValue)
    setLocalValue(constrainedValue)
    onChange?.(constrainedValue)
  }

  /** Writes a value through the form field when there is one, local state otherwise. */
  const writeValue = (newValue: NumberValue, updateFn?: (value: NumberValue) => void) => {
    if (updateFn) {
      updateFn(newValue)
      return
    }
    setLocalValue(newValue)
    if (newValue !== "") onChange?.(newValue)
  }

  const stepBy = (currentValue: NumberValue, direction: 1 | -1, updateFn?: (value: NumberValue) => void) => {
    if (disabled || readOnly) return

    const base = typeof currentValue === "number" ? currentValue : 0
    const decimals = Math.max(countDecimals(base), countDecimals(step))
    const newValue = constrainValue(roundToPrecision(base + direction * step, decimals))

    if (updateFn) {
      updateFn(newValue)
    } else {
      updateStandaloneValue(newValue)
    }
    // Keep the edited text in sync when stepping with the arrow keys.
    if (draft !== null) setDraft(toEditableString(newValue, formatOptions))
  }

  const increment = (currentValue: NumberValue, updateFn?: (value: NumberValue) => void) => {
    stepBy(currentValue, 1, updateFn)
  }

  const decrement = (currentValue: NumberValue, updateFn?: (value: NumberValue) => void) => {
    stepBy(currentValue, -1, updateFn)
  }

  /**
   * Records the typed text and publishes the parsed value. Min/max are NOT
   * applied here — clamping mid-typing makes values such as "15" unreachable
   * when `min` is 10. Clamping happens on blur.
   */
  const handleInputChange = (raw: string, updateFn?: (value: NumberValue) => void) => {
    if (disabled || readOnly) return

    setDraft(raw)

    if (raw.trim() === "") {
      setValidationError(false)
      writeValue("", updateFn)
      return
    }

    const numValue = parseInputToNumber(raw, formatOptions)
    if (isNaN(numValue)) {
      setValidationError(true)
      return
    }

    setValidationError(false)
    writeValue(numValue, updateFn)
  }

  const handleFieldFocus = (currentValue: NumberValue) => {
    setIsFocused(true)
    if (disabled || readOnly) return
    // Swap the formatted display for an editable one while the user types.
    setDraft(toEditableString(currentValue, formatOptions))
  }

  const handleFieldBlur = (updateFn?: (value: NumberValue) => void) => {
    setIsFocused(false)

    const editedText = draft
    setDraft(null)
    if (editedText === null) return

    if (editedText.trim() === "") {
      setValidationError(false)
      writeValue("", updateFn)
      return
    }

    const parsed = parseInputToNumber(editedText, formatOptions)
    if (isNaN(parsed)) {
      setValidationError(true)
      return
    }

    setValidationError(false)
    writeValue(roundToPrecision(constrainValue(parsed), countDecimals(parsed)), updateFn)
  }

  const getDisplayValue = (value: NumberValue) => {
    if (value === "") return ""
    if (formatOptions) {
      return formatter.format(value)
    }
    return value.toString()
  }

  const numberInputFieldProps: Omit<NumberInputFieldProps, "value" | "onValueChange" | "fieldError"> = {
    label,
    fieldName,
    labelClassName: className,
    isFocused,
    draft,
    onFieldFocus: handleFieldFocus,
    onFieldBlur: handleFieldBlur,
    onInputChange: handleInputChange,
    error,
    validationError,
    formatOptions,
    min,
    max,
    disabled,
    readOnly,
    required,
    onIncrement: increment,
    onDecrement: decrement,
    getDisplayValue,
    ...inputProps,
  }

  const helperOrDescription = helperText || description

  if (!formContext) {
    return (
      <div className={cn("w-full", className)}>
        <NumberInputField {...numberInputFieldProps} value={displayValue} />

        {helperOrDescription && !error && !validationError && (
          <p className={cn("text-muted-foreground mt-2 text-xs")} role="region" aria-live="polite">
            {helperOrDescription}
          </p>
        )}

        {(error || validationError) && (
          <p className={cn("text-destructive mt-2 text-xs")} role="alert">
            {error || resolvedErrorMessage}
          </p>
        )}
      </div>
    )
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue ?? ""}
      render={({ field, fieldState }) => (
        <FormNumberInput
          field={field}
          fieldState={fieldState}
          controlledValue={controlledValue}
          prevControlledValueRef={prevControlledValueRef}
          numberInputFieldProps={numberInputFieldProps}
          helperOrDescription={helperOrDescription}
          error={error}
          errorMessage={resolvedErrorMessage}
          validationError={validationError}
          setValidationError={setValidationError}
          onValueChange={onChange}
          className={className}
        />
      )}
    />
  )
}

export { IGRPInputNumber, type IGRPInputNumberProps }

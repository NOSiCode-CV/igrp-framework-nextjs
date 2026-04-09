"use client"

import { useId, useState, useCallback } from "react"
import { useFormContext } from "react-hook-form"
import type { VariantProps } from "class-variance-authority"

import { cn } from "../../../lib/utils"
import { type IGRPInputProps } from "../../../types"
import { Input } from "../../primitives/input"
import { IGRPButton } from "../button"
import { IGRPFieldDescription } from "../field-description"
import { IGRPFormField } from "../form/form-field"
import { IGRPIcon, type IGRPIconName } from "../icon"
import { IGRPLabel } from "../label"

/**
 * Props for the IGRPInputSearch component.
 * @see IGRPInputSearch
 */
interface IGRPInputSearchProps extends Omit<IGRPInputProps, "value" | "defaultValue"> {
  /** Controlled search value. */
  value?: string
  /** Default search value. */
  defaultValue?: string
  /** Called on search (with optional debounce). */
  onSearch?: (value: string) => void
  /** Called when input value changes. */
  setValueChange?: (value: string) => void
  /** Show icon at start of input. */
  showStartIcon?: boolean
  /** Icon name for start icon. */
  startIcon?: IGRPIconName | string
  /** Show submit button. */
  showSubmitButton?: boolean
  /** Icon for submit button. */
  submitIcon?: IGRPIconName | string
  /** Label for submit button. */
  submitButtonLabel?: string
  /** CSS classes for submit button. */
  submitButtonClassName?: string
  /** Enable debounce for onSearch. */
  isDebounce?: boolean
  /** Debounce delay in ms. */
  debounceMs?: number
  /** Submit button variant. */
  submitVariant?: VariantProps<typeof IGRPButton>["variant"]
  /** Show loading state. */
  loading?: boolean
}

/** @internal Search input field with icon and submit button. */
function SearchInputField({
  value,
  onChange,
  onKeyDown,
  fieldName,
  required,
  error,
  helperText,
  helperId,
  className,
  showStartIcon,
  startIcon,
  showSubmitButton,
  submitButtonClassName,
  submitButtonLabel,
  onSearch,
  submitIcon,
  iconSize,
  submitVariant,
  loading,
  iconPlacement,
  showIcon,
  disabled,
  ...inputProps
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  fieldName: string
  required: boolean
  error?: string
  helperText?: string
  helperId?: string
  className?: string
  showStartIcon: boolean
  startIcon: IGRPIconName | string
  showSubmitButton: boolean
  submitButtonClassName?: string
  submitButtonLabel?: string
  onSearch?: (value: string) => void
  submitIcon: IGRPIconName | string
  iconSize?: number | string
  submitVariant: VariantProps<typeof IGRPButton>["variant"]
  loading?: boolean
  iconPlacement?: IGRPInputProps["iconPlacement"]
  showIcon?: boolean
  disabled?: boolean
} & Omit<IGRPInputProps, "value" | "defaultValue">) {
  return (
    <div className={cn("relative py-2")}>
      <Input
        id={fieldName}
        name={fieldName}
        type="search"
        required={required}
        aria-required={required}
        aria-invalid={!!error || !!inputProps["aria-invalid"]}
        aria-describedby={helperText || error ? helperId : undefined}
        className={cn(
          "peer py-3 text-sm outline-hidden flex w-full items-center",
          showStartIcon && "ps-6.5",
          showSubmitButton && "pe-9",
          error && "border-destructive focus-visible:ring-destructive/20",
          className,
        )}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        {...inputProps}
      />

      {showStartIcon && (
        <div
          className={cn(
            "text-muted-foreground/80 pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-1.5 peer-disabled:opacity-50",
          )}
        >
          <IGRPIcon iconName={startIcon} aria-hidden="true" size={14} />
        </div>
      )}

      {showSubmitButton && (
        <IGRPButton
          className={cn(
            "absolute top-1/2 -translate-y-1/2 inset-e-0 flex items-center justify-center rounded-md transition-[color,box-shadow] outline-none z-10 focus-visible:ring-[3px] gap-0",
            submitButtonClassName,
          )}
          aria-label={submitButtonLabel}
          type="button"
          onClick={() => onSearch?.(value)}
          disabled={disabled}
          showIcon={showIcon}
          iconName={submitIcon}
          iconSize={iconSize}
          variant={submitVariant}
          loading={loading}
          iconPlacement={iconPlacement}
        >
          {submitButtonLabel}
        </IGRPButton>
      )}
    </div>
  )
}

const isDebouncedCallback = (callback?: (val: string) => void, delay = 2000) => {
  if (!callback) return null

  let timeout: ReturnType<typeof setTimeout>
  return (value: string) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => callback(value), delay)
  }
}

/**
 * Search input with optional icon, submit button, and debounce. Integrates with react-hook-form.
 */
function IGRPInputSearch({
  name,
  id,
  label,
  helperText,
  className,
  required = false,
  error,
  value: controlledValue,
  defaultValue = "",
  onSearch,
  setValueChange,
  showStartIcon = true,
  startIcon = "Search",
  showSubmitButton = true,
  submitIcon = "ArrowRight",
  submitButtonLabel,
  submitButtonClassName,
  debounceMs = 2000,
  isDebounce = false,
  showIcon = true,
  iconSize = 14,
  iconPlacement,
  submitVariant = "ghost",
  loading,
  ...props
}: IGRPInputSearchProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()
  const [localValue, setLocalValue] = useState(controlledValue ?? defaultValue)
  const debouncedSearch = isDebouncedCallback(onSearch, debounceMs)
  const displayValue = controlledValue !== undefined ? controlledValue : localValue

  const handleInputChange = useCallback(
    (value: string) => {
      if (controlledValue === undefined) setLocalValue(value)
      setValueChange?.(value)
      if (isDebounce) debouncedSearch?.(value)
    },
    [controlledValue, debouncedSearch, isDebounce, setValueChange],
  )

  const inputFieldProps = {
    fieldName,
    required,
    error,
    helperText,
    helperId: `${fieldName}-helper`,
    className,
    showStartIcon,
    startIcon,
    showSubmitButton,
    submitButtonClassName,
    submitButtonLabel,
    onSearch,
    submitIcon,
    iconSize,
    submitVariant,
    loading,
    iconPlacement,
    showIcon,
    disabled: props.disabled,
    ...props,
  }

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        required={required}
        control={formContext.control}
      >
        {(field) => (
          <SearchInputField
            {...inputFieldProps}
            value={field.value ?? ""}
            onChange={(e) => {
              field.onChange(e.target.value)
              handleInputChange(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onSearch?.(field.value)
              }
            }}
          />
        )}
      </IGRPFormField>
    )
  }

  return (
    <div className={cn("*:not-first:mt-2", className)}>
      {label && <IGRPLabel label={label} required={required} id={fieldName} />}

      <SearchInputField
        {...inputFieldProps}
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onSearch?.(displayValue)
          }
        }}
      />

      <IGRPFieldDescription error={error} helperText={helperText} />
    </div>
  )
}

export { IGRPInputSearch, type IGRPInputSearchProps }

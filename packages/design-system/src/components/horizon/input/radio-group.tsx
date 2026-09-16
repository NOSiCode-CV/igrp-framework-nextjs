"use client"

import { useId } from "react"
import { useFormContext } from "react-hook-form"

import { cn } from "../cn"
import { igrpOmitNonDomProps } from "../../../lib/dom-props"
import type { IGRPBaseAttributes } from "../../../types"
import { Field, FieldDescription, FieldError } from "../../primitives/field"
import { RadioGroup, RadioGroupItem } from "../../primitives/radio-group"
import { IGRPFormField } from "../form/form-field"
import { IGRPLabel } from "../label"

/**
 * Option for radio group.
 * @see IGRPRadioGroup
 */
type IGRPRadioOption = {
  /** Option value. */
  value: string
  /** Option label. */
  label: string
  /** Optional description. */
  description?: string
  /** Disable this option. */
  disabled?: boolean
}

/**
 * Props for the IGRPRadioGroup component.
 * @see IGRPRadioGroup
 */
interface IGRPRadioGroupProps extends IGRPBaseAttributes, React.ComponentProps<typeof RadioGroup> {
  options: IGRPRadioOption[]
  error?: string
}

/** @internal Radio group with options. */
function RadioGroupOptionsField({
  value,
  onValueChange,
  fieldName,
  options,
  defaultValue,
  className,
  orientation,
  disabled,
  required,
  error,
  describedById,
  dir,
  ...radioGroupProps
}: {
  value?: string | null
  onValueChange?: (value: string) => void
  fieldName: string
  options: IGRPRadioOption[]
  defaultValue?: string
  className?: string
  orientation?: "horizontal" | "vertical"
  disabled?: boolean
  required?: boolean
  error?: string
  describedById?: string
  dir?: "ltr" | "rtl"
} & Omit<React.ComponentProps<typeof RadioGroup>, "value" | "onValueChange" | "name" | "children">) {
  return (
    <RadioGroup
      defaultValue={defaultValue}
      value={value ?? undefined}
      onValueChange={onValueChange}
      name={fieldName}
      className={cn("flex flex-row", orientation === "vertical" && "flex-col", className)}
      disabled={disabled}
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={describedById}
      {...igrpOmitNonDomProps(radioGroupProps)}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className={cn(
            "flex items-center gap-2",
            dir === "rtl" && "flex-row-reverse justify-between",
            option.disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <RadioGroupItem
            value={option.value}
            id={`${fieldName}-${option.value}`}
            disabled={option.disabled || disabled}
            className="mt-0.5"
          />
          {(option.label || option.description) && (
            <div>
              {option.label && (
                <IGRPLabel
                  htmlFor={`${fieldName}-${option.value}`}
                  label={option.label}
                  className={cn("text-sm leading-none font-medium", option.disabled && "cursor-not-allowed opacity-70")}
                />
              )}
              {option.description && <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>}
            </div>
          )}
        </div>
      ))}
    </RadioGroup>
  )
}

/**
 * Radio group with label, helper text, and form integration.
 */
function IGRPRadioGroup({
  name,
  id,
  required = false,
  disabled = false,
  dir,
  orientation,
  defaultValue,
  value,
  onValueChange,
  className,
  options,
  label,
  labelClassName,
  helperText,
  error,
  ...props
}: IGRPRadioGroupProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const formContext = useFormContext()

  const describedById = error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined

  const radioFieldProps = {
    fieldName,
    options,
    defaultValue,
    className,
    orientation,
    disabled,
    required,
    error,
    describedById,
    dir,
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
          <div className={cn("relative")}>
            <RadioGroupOptionsField
              {...radioFieldProps}
              value={field.value}
              onValueChange={(newValue) => {
                field.onChange(newValue)
                onValueChange?.(newValue)
              }}
            />
          </div>
        )}
      </IGRPFormField>
    )
  }

  return (
    <Field className={className} data-invalid={error ? true : undefined}>
      {label && <IGRPLabel label={label} required={required} id={fieldName} className={labelClassName} />}

      <RadioGroupOptionsField {...radioFieldProps} value={value} onValueChange={onValueChange ?? (() => {})} />

      {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

      {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
    </Field>
  )
}

export { IGRPRadioGroup, type IGRPRadioGroupProps }

"use client"

import { useId } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { cn } from "../cn.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import type { IGRPInputProps } from "../../../types.js"
import { Input } from "../../primitives/input.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"

/**
 * Props for the IGRPInputTime component.
 * @see IGRPInputTime
 */
interface IGRPInputTimeProps extends Omit<IGRPInputProps, "onChange"> {
  /** Controlled time value (HH:mm). */
  value?: string
  /** Default time value. */
  defaultValue?: string
  /** Called when value changes. */
  onChange?: (value: string) => void
}

/**
 * Time input (native time picker). Integrates with react-hook-form.
 */
function IGRPInputTime({
  name,
  id,
  label,
  labelClassName,
  helperText = "",
  className,
  inputClassName,
  required = false,
  error,
  value,
  defaultValue,
  onChange,
  ...props
}: IGRPInputTimeProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  // Whatever is left belongs to the native element; the IGRP-only keys would
  // otherwise be rendered as invalid DOM attributes.
  const domProps = igrpOmitNonDomProps(props)

  const formContext = useFormContext()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
  }

  if (!formContext) {
    return (
      <Field>
        {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

        <div className={cn("relative")}>
          <Input
            id={fieldName}
            name={fieldName}
            type="time"
            required={required}
            aria-required={required}
            aria-invalid={!!error || !!props["aria-invalid"]}
            aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
            className={cn(
              "peer bg-background py-3 text-sm outline-hidden",
              error && "border-destructive focus-visible:ring-destructive/20",
              className,
              inputClassName
            )}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            {...domProps}
          />
        </div>

        {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

        {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
      </Field>
    )
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue || ""}
      render={({ field, fieldState }) => (
        <Field>
          {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

          <div className={cn("relative")}>
            <Input
              id={fieldName}
              name={fieldName}
              type="time"
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error || !!props["aria-invalid"]}
              aria-describedby={
                error || fieldState.error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
              }
              className={cn(
                "peer bg-background py-3 text-sm outline-hidden",
                (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
                className,
                inputClassName
              )}
              value={field.value}
              onChange={(e) => {
                field.onChange(e)
                handleChange(e)
              }}
              onBlur={field.onBlur}
              {...domProps}
            />
          </div>

          {helperText && !error && !fieldState.error && (
            <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>
          )}

          {(error || fieldState.error) && (
            <FieldError id={`${fieldName}-error`}>{error || fieldState.error?.message}</FieldError>
          )}
        </Field>
      )}
    />
  )
}

export { IGRPInputTime, type IGRPInputTimeProps }

"use client"

import { useId } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { cn } from "../cn"
import type { IGRPInputProps } from "../../../types"
import { Textarea } from "../../primitives/textarea"
import { IGRPLabel } from "../label"
import { Field, FieldDescription, FieldError } from "../../primitives/field"

/**
 * Props for the IGRPTextarea component.
 * @see IGRPTextarea
 */
interface IGRPTextareaProps
  extends
    React.ComponentProps<typeof Textarea>,
    Pick<IGRPInputProps, "label" | "helperText" | "className" | "required" | "error"> {}

/**
 * Textarea with label, helper text, and form integration.
 */
function IGRPTextarea({
  name,
  id,
  label,
  helperText,
  className,
  required = false,
  error,
  rows = 3,
  ...props
}: IGRPTextareaProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()

  if (!formContext) {
    return (
      <Field>
        {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}

        <div className={cn("relative")}>
          <Textarea
            id={fieldName}
            name={fieldName}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
            className={cn(
              "peer bg-background py-3 text-sm outline-hidden",
              error && "border-destructive focus-visible:ring-destructive/20",
              className,
            )}
            rows={rows}
            {...props}
          />
        </div>

        {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

        {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
      </Field>
    )
  }

  const fieldError = formContext.formState.errors[fieldName]
  const errorMessage = error || (fieldError?.message as string)

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      render={({ field, fieldState }) => (
        <Field>
          {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}

          <div className={cn("relative")}>
            <Textarea
              id={fieldName}
              name={fieldName}
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error}
              aria-describedby={
                errorMessage || fieldState.error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
              }
              className={cn(
                "peer bg-background py-3 text-sm outline-hidden",
                (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
                className,
              )}
              rows={rows}
              value={field.value || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              {...props}
            />
          </div>

          {helperText && !errorMessage && !fieldState.error && (
            <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>
          )}

          {(errorMessage || fieldState.error) && (
            <FieldError id={`${fieldName}-error`}>{errorMessage || fieldState.error?.message}</FieldError>
          )}
        </Field>
      )}
    />
  )
}

export { IGRPTextarea, type IGRPTextareaProps }

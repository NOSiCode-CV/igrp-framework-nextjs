"use client"

import { useId } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { cn } from "../../../lib/utils"
import type { IGRPInputProps } from "../../../types"
import { Input } from "../../primitives/input"
import { IGRPLabel } from "../label"

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
  helperText = "",
  className,
  required = false,
  error,
  value,
  defaultValue,
  onChange,
  ...props
}: IGRPInputTimeProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
  }

  if (!formContext) {
    return (
      <div className={cn("*:not-first:mt-2")}>
        {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}

        <div className={cn("relative")}>
          <Input
            id={fieldName}
            name={fieldName}
            type="time"
            required={required}
            aria-required={required}
            aria-invalid={!!error || !!props["aria-invalid"]}
            aria-describedby={helperText || error ? `${id}-helper` : undefined}
            className={cn(
              "peer bg-background py-3 text-sm outline-hidden",
              error && "border-destructive focus-visible:ring-destructive/20",
              className,
            )}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            {...props}
          />
        </div>

        {helperText && !error && (
          <p
            id={`${fieldName}-helper`}
            className={cn("text-muted-foreground mt-2 text-xs")}
            role="region"
            aria-live="polite"
          >
            {helperText}
          </p>
        )}

        {error && (
          <p id={`${fieldName}-error`} className={cn("text-destructive mt-2 text-xs")} role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue || ""}
      render={({ field, fieldState }) => (
        <div className={cn("*:not-first:mt-2")}>
          {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}

          <div className={cn("relative")}>
            <Input
              id={fieldName}
              name={fieldName}
              type="time"
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error || !!props["aria-invalid"]}
              aria-describedby={helperText || error ? `${id}-helper` : undefined}
              className={cn(
                "peer bg-background py-3 text-sm outline-hidden",
                (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
                className,
              )}
              value={field.value}
              onChange={(e) => {
                field.onChange(e)
                handleChange(e)
              }}
              onBlur={field.onBlur}
              {...props}
            />
          </div>

          {helperText && !error && !fieldState.error && (
            <p
              id={`${fieldName}-helper`}
              className={cn("text-muted-foreground mt-2 text-xs")}
              role="region"
              aria-live="polite"
            >
              {helperText}
            </p>
          )}

          {(error || fieldState.error) && (
            <p id={`${fieldName}-error`} className={cn("text-destructive mt-2 text-xs")} role="alert">
              {error || fieldState.error?.message}
            </p>
          )}
        </div>
      )}
    />
  )
}

export { IGRPInputTime, type IGRPInputTimeProps }

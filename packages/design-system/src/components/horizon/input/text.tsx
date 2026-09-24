"use client"

import { useId } from "react"
import { useFormContext } from "react-hook-form"

import { cn } from "../cn.js"
import type { IGRPInputProps } from "../../../types.js"
import { Input } from "../../primitives/input.js"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../primitives/form.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"
import { IGRPIcon } from "../icon/index.js"
import { IGRPLabel } from "../label.js"

/**
 * Props for the IGRPInputText component.
 * Extends IGRPInputProps with text input specifics.
 * @see IGRPInputText
 */
interface IGRPInputTextProps extends IGRPInputProps {
  /** Input type: 'text' | 'email' | 'number'. */
  type?: "text" | "email" | "number"
  /** Validation error message (overrides form field error). */
  error?: string
}

/**
 * Text input with label, helper text, optional icon, and form integration.
 * Auto-wires to IGRPForm when inside form context.
 */
function IGRPInputText({
  name,
  id,
  type = "text",
  label,
  helperText,
  showIcon = false,
  iconName = "House",
  iconSize = 16,
  iconPlacement = "start",
  iconClassName,
  className,
  labelClassName,
  required,
  inputClassName,
  error,
  ...props
}: IGRPInputTextProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()

  const positionIcon = iconPlacement === "start" ? "start-0 ps-3" : "end-0 pe-3"
  const positionParentIcon = iconPlacement === "start" ? "ps-9" : "pe-9"

  if (formContext) {
    return (
      <FormField
        control={formContext.control}
        name={fieldName}
        render={({ field, fieldState }) => (
          <FormItem className={className}>
            {label && (
              <FormLabel
                className={cn("gap-0.5", required && 'after:text-destructive after:content-["*"]', labelClassName)}
              >
                {label}
              </FormLabel>
            )}
            <div className={cn("relative")}>
              <FormControl>
                <Input
                  name={fieldName}
                  type={type}
                  required={required}
                  aria-required={required}
                  className={cn(
                    "peer bg-background py-3 text-sm outline-hidden",
                    showIcon && positionParentIcon,
                    (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
                    inputClassName
                  )}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  {...props}
                />
              </FormControl>
              {showIcon && (
                <div className={cn("pointer-events-none absolute inset-y-0 flex items-center", positionIcon)}>
                  <IGRPIcon iconName={iconName} size={iconSize} className={iconClassName} />
                </div>
              )}
            </div>
            {helperText && !fieldState.error && !error && <FormDescription>{helperText}</FormDescription>}
            {error ? (
              <p className={cn("text-xs text-destructive")} role="alert">
                {error}
              </p>
            ) : (
              <FormMessage className={cn("text-xs")} />
            )}
          </FormItem>
        )}
      />
    )
  }

  return (
    <Field className={className} data-invalid={error ? true : undefined}>
      {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

      <div className={cn("relative")}>
        <Input
          id={fieldName}
          name={fieldName}
          type={type}
          required={required}
          aria-required={required}
          aria-invalid={!!error || !!props["aria-invalid"]}
          aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
          className={cn(
            "peer bg-background py-3 text-sm outline-hidden",
            showIcon && positionParentIcon,
            error && "border-destructive focus-visible:ring-destructive/20",
            inputClassName
          )}
          {...props}
        />
        {showIcon && (
          <div className={cn("pointer-events-none absolute inset-y-0 flex items-center", positionIcon)}>
            <IGRPIcon iconName={iconName} size={iconSize} className={iconClassName} />
          </div>
        )}
      </div>

      {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

      {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
    </Field>
  )
}

export { IGRPInputText, type IGRPInputTextProps }

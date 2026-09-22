"use client"

import { useId } from "react"
import { useFormContext } from "react-hook-form"

import { cn } from "../cn.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import type { IGRPInputProps } from "../../../types.js"
import { Checkbox } from "../../primitives/checkbox.js"
import { IGRPFormField } from "../form/form-field.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"

/**
 * Props for the IGRPCheckbox component.
 * @see IGRPCheckbox
 */
interface IGRPCheckboxProps
  extends React.ComponentProps<typeof Checkbox>, Pick<IGRPInputProps, "helperText" | "label"> {
  /** CSS classes for the label. */
  labelClassName?: string
  /** Validation error message. */
  error?: string
}

/**
 * Checkbox with label, helper text, and form integration.
 */
function IGRPCheckbox({
  name,
  id,
  label,
  helperText,
  className,
  labelClassName,
  required,
  error,
  onCheckedChange,
  ...props
}: IGRPCheckboxProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()

  if (!formContext) {
    return (
      <Field>
        <div className={cn("flex items-center gap-2")}>
          <Checkbox
            id={fieldName}
            name={fieldName}
            className={cn(className, error && "border-destructive focus-visible:ring-destructive/20")}
            onCheckedChange={onCheckedChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
            {...igrpOmitNonDomProps(props)}
          />

          {label && (
            <IGRPLabel
              label={label}
              className={cn(labelClassName, error && "text-destructive")}
              required={required}
              id={fieldName}
            />
          )}
        </div>

        {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

        {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
      </Field>
    )
  }

  return (
    <IGRPFormField
      name={fieldName}
      label={label}
      helperText={helperText}
      required={required}
      control={formContext.control}
      labelPlacement="end"
      isToggle
    >
      {(field, fieldState) => (
        <Checkbox
          required={required}
          className={cn(
            "bg-backsground",
            (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
          checked={field.value === true}
          onCheckedChange={(checked) => {
            field.onChange(checked)
            if (onCheckedChange) {
              onCheckedChange(checked)
            }
          }}
          onBlur={field.onBlur}
          aria-invalid={!!fieldState.error || !!error}
          {...igrpOmitNonDomProps(props)}
        />
      )}
    </IGRPFormField>
  )
}

export { IGRPCheckbox, type IGRPCheckboxProps }

"use client"

import { FieldDescription, FieldError } from "../primitives/field.js"

/**
 * Props for the IGRPFieldDescription component.
 * @see IGRPFieldDescription
 */
interface IGRPFieldDescriptionProps {
  /** Helper text shown below the field. */
  helperText?: string
  /** Validation error message. */
  error?: string
  /** Field id: the helper renders as `{id}-helper` and the error as `{id}-error`, for the control's `aria-describedby`. */
  id?: string
}

/**
 * Renders helper text or error message for form fields.
 */
function IGRPFieldDescription({ helperText, error, id }: IGRPFieldDescriptionProps) {
  return (
    <>
      {helperText && !error && <FieldDescription id={id && `${id}-helper`}>{helperText}</FieldDescription>}

      {error && <FieldError id={id && `${id}-error`}>{error}</FieldError>}
    </>
  )
}

export { IGRPFieldDescription, type IGRPFieldDescriptionProps }

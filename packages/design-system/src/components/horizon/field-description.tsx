"use client"

import { FieldDescription, FieldError } from "../primitives/field"

/**
 * Props for the IGRPFieldDescription component.
 * @see IGRPFieldDescription
 */
interface IGRPFieldDescriptionProps {
  /** Helper text shown below the field. */
  helperText?: string
  /** Validation error message. */
  error?: string
}

/**
 * Renders helper text or error message for form fields.
 */
function IGRPFieldDescription({ helperText, error }: IGRPFieldDescriptionProps) {
  return (
    <>
      {helperText && !error && <FieldDescription>{helperText}</FieldDescription>}

      {error && <FieldError>{error}</FieldError>}
    </>
  )
}

export { IGRPFieldDescription, type IGRPFieldDescriptionProps }

import { cn } from "../../lib/utils"

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
      {helperText && !error && (
        <p className={cn("text-muted-foreground text-xs mt-1")} role="note">
          {helperText}
        </p>
      )}

      {error && (
        <p className={cn("text-destructive text-xs mt-1")} role="alert">
          {error}
        </p>
      )}
    </>
  )
}

export { IGRPFieldDescription, type IGRPFieldDescriptionProps }

import type { Control, ControllerFieldState, ControllerRenderProps, FieldValues } from "react-hook-form"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../primitives/form"
import { cn } from "../../../lib/utils"
import { type IGRPPlacementProps } from "../../../types"

/**
 * Props for the IGRPFormField component.
 * Wraps react-hook-form FormField with IGRP layout and styling.
 * @see IGRPFormField
 */
interface IGRPFormFieldProps {
  /** Form field name (must match schema). */
  name: string
  /** Field label. */
  label?: string
  /** Helper text shown below the field. */
  helperText?: string
  /** Additional CSS classes for the wrapper. */
  className?: string
  /**
   * @deprecated This props will be deprecated in the next release.
   */
  size?: string
  /** Field content or render function receiving field and fieldState. */
  children: React.ReactNode | ((field: ControllerRenderProps, fieldState: ControllerFieldState) => React.ReactNode)
  /** Whether the field is required. */
  required?: boolean
  /** react-hook-form control from useFormContext. */
  control: Control<FieldValues, unknown, FieldValues>
  /** Label position ('start' | 'end' | 'center'). */
  labelPlacement?: IGRPPlacementProps
  /** Use horizontal layout (label beside control), e.g. for switches. */
  isToggle?: boolean
}

/**
 * Form field wrapper integrating with react-hook-form.
 * Must be used inside IGRPFormContext. Renders label, control, helper text, and validation errors.
 */
function IGRPFormField({
  name,
  label,
  helperText,
  className,
  children,
  required,
  control,
  labelPlacement = "start",
  isToggle = false,
}: IGRPFormFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("*:not-first:mt-2", className)}>
          <FormItem>
            <div className={cn("flex flex-col gap-2", isToggle && "flex-row items-center")}>
              {label && (
                <FormLabel
                  className={cn(
                    labelPlacement === "end" && "order-last",
                    "gap-0.5",
                    required && 'after:content-["*"] after:text-destructive',
                  )}
                >
                  {label}
                </FormLabel>
              )}

              <FormControl>{typeof children === "function" ? children(field, fieldState) : children}</FormControl>
            </div>

            {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}

            <FormMessage className={cn("text-xs")} />
          </FormItem>
        </div>
      )}
    />
  )
}

export { IGRPFormField, type IGRPFormFieldProps }

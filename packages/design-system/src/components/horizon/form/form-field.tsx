"use client"

import type { Control, ControllerFieldState, ControllerRenderProps } from "react-hook-form"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../primitives/form.js"
import { cn } from "../cn.js"
import { IGRPRequiredMark } from "../label.js"
import { type IGRPPlacementProps } from "../../../types.js"

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
  /**
   * Error message that replaces the form's own message for this field. When set it
   * is always shown — the caller owns when the field is in error.
   */
  errorText?: string
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
  /** react-hook-form control. Optional inside IGRPForm or any FormProvider, which supply it. */
  // Any-typed so a `Control<MyValues>` from a typed `useForm` is accepted without a cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<any, any, any>
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
  errorText,
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
        <div className={className}>
          <FormItem>
            <div className={cn("flex flex-col gap-2", isToggle && "flex-row items-center")}>
              {label && (
                <FormLabel className={cn(labelPlacement === "end" && "order-last", "gap-0.5")}>
                  {label}
                  {required && <IGRPRequiredMark />}
                </FormLabel>
              )}

              <FormControl aria-required={required || undefined}>
                {typeof children === "function" ? children(field, fieldState) : children}
              </FormControl>
            </div>

            {helperText && !fieldState.error && !errorText && <FormDescription>{helperText}</FormDescription>}

            {/* errorText replaces the form's message; FormControl then marks the control invalid and describes it. */}
            <FormMessage className={cn("text-xs")} message={errorText} />
          </FormItem>
        </div>
      )}
    />
  )
}

export { IGRPFormField, type IGRPFormFieldProps }

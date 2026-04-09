"use client"

import { createContext, useContext } from "react"
import { type FieldValues, type UseFormReturn } from "react-hook-form"
import { z } from "zod"

/**
 * Form context value provided by IGRPForm.
 * @see IGRPForm
 * @see useIGRPFormContext
 */
type IGRPFormContextValue<TSchema extends z.ZodType> = {
  /** react-hook-form instance. */
  form: UseFormReturn<z.infer<TSchema> & FieldValues>
  /** Whether the form is submitting. */
  isSubmitting: boolean
  /** Global form error message. */
  formError?: string
  /** Whether all inputs are disabled. */
  disabled?: boolean
}

/** @internal Context for form state. Provided by IGRPForm. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IGRPFormContext = createContext<IGRPFormContextValue<any> | null>(null)

/**
 * Returns the form context. Must be used within IGRPForm.
 * @throws Error if used outside FormProvider
 */
function useIGRPFormContext<TSchema extends z.ZodType>() {
  const context = useContext(IGRPFormContext)

  if (!context) {
    throw new Error("useIGRPFormContext must be used within a FormProvider")
  }

  return context as IGRPFormContextValue<TSchema>
}

// eslint-disable-next-line react-refresh/only-export-components
export { type IGRPFormContextValue, useIGRPFormContext, IGRPFormContext }

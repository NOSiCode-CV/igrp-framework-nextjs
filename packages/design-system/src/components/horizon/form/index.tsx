"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { type Mode, useForm, type UseFormReturn, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Form } from "../../primitives/form"
import { FieldSet } from "../../primitives/field"
import { cn } from "../../../lib/utils"
import { useIGRPi18n } from "../../../i18n"
import { IGRPFormContext } from "./form-context"

// `useForm`'s `TFieldValues` generic is constrained to react-hook-form's
// `FieldValues`, which is `Record<string, any>`. To satisfy that constraint
// without re-importing `FieldValues` (and to keep the type local), we mirror
// its shape here. The `any`s on this single line are intentional and bounded —
// they exist to thread through to a third-party generic, not to weaken our
// public surface. The context generic (middle slot) is `unknown` since IGRPForm
// doesn't expose a form-context typing surface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZod = z.ZodType<Record<string, any>, any, any>
type InputOf<T extends AnyZod> = z.input<T>
type OutputOf<T extends AnyZod> = z.output<T>

type ResetFn<TSchema extends AnyZod> = UseFormReturn<InputOf<TSchema>, unknown, OutputOf<TSchema>>["reset"]

/**
 * Form handle exposed via formRef.
 * Extends react-hook-form's UseFormReturn with submit, reset, and error helpers.
 */
export type IGRPFormHandle<TSchema extends AnyZod> = UseFormReturn<InputOf<TSchema>, unknown, OutputOf<TSchema>> & {
  /** Programmatically submit the form. */
  submit: () => Promise<void>
  /** Reset form to default values. */
  reset: ResetFn<TSchema>
  /** Set a global form error message. */
  setGlobalError: (message: string) => void
  /** Clear the global form error. */
  clearGlobalError: () => void
  /** Whether the form is currently submitting. */
  isSubmitting: boolean
}

/**
 * Props for the IGRPForm component.
 * @see IGRPForm
 */
export interface IGRPFormProps<TSchema extends AnyZod> {
  /** Zod schema for validation. */
  schema: TSchema
  /** Initial form values. */
  defaultValues?: InputOf<TSchema>
  /** Validation mode: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all'. */
  validationMode?: Mode
  /** Called when form is valid and submitted. */
  onSubmit: (values: OutputOf<TSchema>) => void | Promise<void>
  /** Reset form to defaultValues after successful submit. */
  resetAfterSubmit?: boolean
  /** Ref to access form handle (submit, reset, etc.). */
  formRef: React.RefObject<IGRPFormHandle<TSchema> | null>
  /** Called when submission throws. */
  onError?: (error: unknown) => void
  /** Show toast on submission error. */
  showToastOnError?: boolean
  /** CSS classes for the form element. */
  className?: string
  /** CSS classes for the grid wrapping form fields. */
  gridClassName?: string
  /** Form content (IGRPFormField, inputs, etc.). */
  children: React.ReactNode
  /** HTML id attribute. */
  id?: string
  /** Disable all form inputs. */
  disabled?: boolean
  /** Key to reset form when changed (e.g. record id when loading new data). When provided, form remounts instead of syncing via effect. */
  resetKey?: React.Key
}

/**
 * Form component with Zod validation and react-hook-form.
 * Provides IGRPFormContext for child fields. Use formRef to access submit/reset.
 */
function IGRPForm<TSchema extends AnyZod>({
  schema,
  defaultValues,
  validationMode = "onSubmit",
  onSubmit,
  resetAfterSubmit = false,
  formRef,
  onError,
  showToastOnError = false,
  className,
  gridClassName,
  children,
  id,
  disabled = false,
  resetKey,
}: IGRPFormProps<TSchema>) {
  const _id = useId()
  const ref = id ?? _id
  const i18n = useIGRPi18n()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | undefined>()
  const internalFormRef = useRef<IGRPFormHandle<TSchema> | null>(null)

  const form = useForm<InputOf<TSchema>, unknown, OutputOf<TSchema>>({
    resolver: zodResolver(schema) as Resolver<InputOf<TSchema>, unknown, OutputOf<TSchema>>,
    defaultValues,
    mode: validationMode,
  })

  // Sync defaultValues to form when they change. Two safety rails to avoid clobbering user input:
  //   1. If the consumer opts into `resetKey`, prop sync is disabled (they reset explicitly via remount).
  //   2. If the form is dirty (user has typed), skip the reset — only refresh untouched defaults.
  // Consumers that *need* to overwrite dirty state with new defaults should bump `resetKey` or call `formRef.current?.reset()` themselves.
  useEffect(() => {
    if (resetKey !== undefined) return
    if (!defaultValues) return
    if (form.formState.isDirty) return
    form.reset(defaultValues)
  }, [form, defaultValues, resetKey])

  const clearGlobalError = useCallback(() => setFormError(undefined), [])
  const setGlobalError = useCallback((message: string) => setFormError(message), [])

  const handleSubmit = useCallback(
    async (values: OutputOf<TSchema>) => {
      setIsSubmitting(true)
      clearGlobalError()

      try {
        await onSubmit(values)

        if (resetAfterSubmit) {
          form.reset(defaultValues)
        }
      } catch (err) {
        console.error("Form submission failed:", err)
        const errorMessage = err instanceof Error ? err.message : i18n.form.submissionErrorFallback

        setGlobalError(errorMessage)

        if (showToastOnError) {
          toast.error(i18n.form.submissionErrorTitle, { description: errorMessage })
        }

        onError?.(err)
      }
      setIsSubmitting(false)
    },
    [clearGlobalError, onSubmit, resetAfterSubmit, form, defaultValues, setGlobalError, showToastOnError, onError, i18n],
  )

  const submitForm = useCallback(async () => form.handleSubmit(handleSubmit)(), [form, handleSubmit])

  useEffect(() => {
    const handle: IGRPFormHandle<TSchema> = {
      ...form,
      submit: submitForm,
      reset: ((...args) => form.reset(...args)) as ResetFn<TSchema>,
      setGlobalError,
      clearGlobalError,
      isSubmitting,
    }

    if (formRef) {
      formRef.current = handle
    }
    internalFormRef.current = handle
  }, [form, submitForm, setGlobalError, clearGlobalError, isSubmitting, formRef])

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (disabled) {
        e.preventDefault()
        return
      }
      form.handleSubmit(handleSubmit)(e)
    },
    [disabled, form, handleSubmit],
  )

  return (
    <IGRPFormContext.Provider value={{ form, isSubmitting, formError, disabled }}>
      <Form {...form}>
        <form className={className} onSubmit={handleFormSubmit} noValidate id={ref}>
          {formError && (
            <div
              className={cn("mb-4 p-3 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm")}
            >
              {formError}
            </div>
          )}
          <FieldSet disabled={disabled} className={cn("border-0 p-0 m-0 gap-0")}>
            <div className={cn("grid gap-4", gridClassName)}>{children}</div>
          </FieldSet>
        </form>
      </Form>
    </IGRPFormContext.Provider>
  )
}

export { IGRPForm }

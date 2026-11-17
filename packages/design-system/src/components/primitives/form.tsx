/* shadcn: 2026-09-15 */
"use client"

/* IGRP CUSTOM: THIS COMPONENT IS CHANGED FROM THE ORIGINAL */

import * as React from "react"
import { Slot } from "radix-ui"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { cn } from "cn"

import { Label } from "./label.js"

// Explicit annotation avoids non-portable inferred type referencing local @types/react path
const Form: typeof FormProvider = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id, parts } = itemContext
  const formDescriptionId = `${id}-form-item-description`
  const formMessageId = `${id}-form-item-message`

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId,
    formMessageId,
    // Only ids of elements actually rendered — a dangling IDREF is an a11y error.
    formDescribedBy:
      [parts?.description && formDescriptionId, parts?.message && formMessageId].filter(Boolean).join(" ") || undefined,
    // A rendered message (RHF error or a caller-supplied one) means the control is invalid.
    formInvalid: !!fieldState.error || !!parts?.message,
    ...fieldState,
  }
}

type FormItemPart = "description" | "message"

type FormItemContextValue = {
  id: string
  parts?: Record<FormItemPart, boolean>
  setPart?: (part: FormItemPart, present: boolean) => void
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

/** Registers a rendered description/message with its FormItem so FormControl only references existing ids. */
function useFormItemPart(part: FormItemPart, present: boolean) {
  const { setPart } = React.useContext(FormItemContext)
  // Layout effect: the ids land in the same commit that renders the message, before anyone reads the DOM.
  React.useLayoutEffect(() => {
    if (!present || !setPart) return
    setPart(part, true)
    return () => setPart(part, false)
  }, [part, present, setPart])
}

/*
 * Warning: This component is changed from the original.
 * Was removed the 'grid gap-2' class from the original component.
 */
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()
  const [parts, setParts] = React.useState<Record<FormItemPart, boolean>>({ description: false, message: false })
  const setPart = React.useCallback(
    (part: FormItemPart, present: boolean) =>
      setParts((prev) => (prev[part] === present ? prev : { ...prev, [part]: present })),
    []
  )

  return (
    <FormItemContext.Provider value={{ id, parts, setPart }}>
      <div data-slot="form-item" className={cn("flex flex-col gap-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { formItemId, formDescribedBy, formInvalid } = useFormField()

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={formDescribedBy}
      aria-invalid={formInvalid}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()
  useFormItemPart("description", true)

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/** `message` (IGRP addition) overrides the form's own error — a caller-owned error such as `errorText`. */
function FormMessage({ className, message, ...props }: React.ComponentProps<"p"> & { message?: string }) {
  const { error, formMessageId } = useFormField()
  const body = message || (error ? String(error?.message ?? "") : props.children)
  useFormItemPart("message", !!body)

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      role="alert"
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  useFormItemPart,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

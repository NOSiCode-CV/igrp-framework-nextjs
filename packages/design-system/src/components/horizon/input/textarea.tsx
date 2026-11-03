"use client"

import { useId, useState } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { cn } from "../cn.js"
import { useIGRPi18n } from "../../../i18n/index.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import { igrpChainHandlers, igrpMergeRefs } from "../../../lib/form-binding.js"
import type { IGRPInputProps } from "../../../types.js"
import { Textarea } from "../../primitives/textarea.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"

/**
 * Props for the IGRPTextarea component.
 * @see IGRPTextarea
 */
interface IGRPTextareaProps
  extends
    React.ComponentProps<typeof Textarea>,
    Pick<
      IGRPInputProps,
      "label" | "labelClassName" | "helperText" | "className" | "inputClassName" | "required" | "error"
    > {
  /** Show the "n / max" counter. Requires `maxLength`. */
  showCounter?: boolean
  /** Show the fill bar above the counter. Requires `maxLength`. Default: follows `showCounter`. */
  showProgress?: boolean
  /** 0–1: fraction of `maxLength`; > 1: remaining characters. Default 0.9. */
  warnAt?: number
  /** Truncate the form value to `maxLength`, including setValue/reset. Default true when `maxLength` is set. Form branch only. */
  enforceMaxLength?: boolean
}

type TextareaCounterLevel = "normal" | "warning" | "limit"

function textareaValueLength(value: unknown): number {
  return typeof value === "string" ? value.length : 0
}

function textareaCounterLevel(length: number, maxLength: number, warnAt: number): TextareaCounterLevel {
  if (length >= maxLength) return "limit"
  return (warnAt <= 1 ? length >= warnAt * maxLength : maxLength - length <= warnAt) ? "warning" : "normal"
}

const FILL_CLASS: Record<TextareaCounterLevel, string> = {
  normal: "bg-primary/35",
  warning: "bg-warning",
  limit: "bg-destructive",
}

function TextareaCounter({
  id,
  length,
  maxLength,
  warnAt,
  showCounter,
  showProgress,
}: {
  id: string
  length: number
  maxLength: number
  warnAt: number
  showCounter: boolean
  showProgress: boolean
}) {
  const { textarea: t } = useIGRPi18n()
  if (!(maxLength > 0 && (showCounter || showProgress))) return null
  const level = textareaCounterLevel(length, maxLength, warnAt)

  return (
    <div className="flex flex-col gap-1">
      {showProgress && (
        <div aria-hidden="true" className="h-0.5 w-full overflow-hidden rounded-full bg-border/60">
          <div
            data-level={level}
            className={cn("h-full rounded-full transition-[width]", FILL_CLASS[level])}
            style={{ width: `${Math.min(100, (length / maxLength) * 100)}%` }}
          />
        </div>
      )}
      {showCounter && (
        <p
          id={id}
          role="status"
          aria-live="polite"
          data-level={level}
          className={cn(
            "text-right text-xs tracking-tight tabular-nums",
            level === "normal" ? "text-muted-foreground" : level === "warning" ? "text-warning" : "text-destructive"
          )}
        >
          <span className="sr-only">{t.counterUsed} </span>
          {length}
          <span aria-hidden="true"> / </span>
          <span className="sr-only"> {t.counterOf} </span>
          {maxLength}
        </p>
      )}
    </div>
  )
}

/**
 * Textarea with label, helper text, and form integration.
 */
function IGRPTextarea({
  name,
  id,
  label,
  labelClassName,
  helperText,
  className,
  inputClassName,
  required = false,
  error,
  rows = 3,
  maxLength,
  showCounter = false,
  showProgress = showCounter,
  warnAt = 0.9,
  enforceMaxLength: _enforceMaxLength,
  "aria-describedby": callerDescribedBy,
  ...props
}: IGRPTextareaProps) {
  // Whatever is left belongs to the native element; the IGRP-only keys would
  // otherwise be rendered as invalid DOM attributes.
  const domProps = igrpOmitNonDomProps(props)
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()
  void _enforceMaxLength // consumed by the form branch in the next change
  const [stateLength, setStateLength] = useState(() => textareaValueLength(props.defaultValue))
  const counterId = `${fieldName}-counter`
  const max = maxLength ?? 0
  const describedBy = (baseId: string | undefined) =>
    [callerDescribedBy, baseId, showCounter && max > 0 && counterId].filter(Boolean).join(" ") || undefined

  if (!formContext) {
    return (
      <Field>
        {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

        <div className={cn("relative")}>
          <Textarea
            id={fieldName}
            name={fieldName}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy(
              error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
            )}
            maxLength={maxLength}
            className={cn(
              "peer bg-background py-3 text-sm outline-hidden",
              error && "border-destructive focus-visible:ring-destructive/20",
              className,
              inputClassName
            )}
            rows={rows}
            {...domProps}
            onChange={igrpChainHandlers(
              (e: React.ChangeEvent<HTMLTextAreaElement>) => setStateLength(e.target.value.length),
              domProps.onChange
            )}
          />
        </div>

        <TextareaCounter
          id={counterId}
          length={props.value !== undefined ? textareaValueLength(props.value) : stateLength}
          maxLength={max}
          warnAt={warnAt}
          showCounter={showCounter}
          showProgress={showProgress}
        />

        {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

        {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
      </Field>
    )
  }

  // The field owns value/onChange/onBlur/ref; the caller's copies run after it
  // and never replace it (see lib/form-binding.ts).
  const { value: _value, defaultValue: _defaultValue, onChange, onBlur, ref, ...callerProps } = domProps
  void _value
  void _defaultValue

  const fieldError = formContext.formState.errors[fieldName]
  const errorMessage = error || (fieldError?.message as string)

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      render={({ field, fieldState }) => (
        <Field>
          {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

          <div className={cn("relative")}>
            <Textarea
              id={fieldName}
              name={fieldName}
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error}
              aria-describedby={describedBy(
                errorMessage || fieldState.error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
              )}
              maxLength={maxLength}
              className={cn(
                "peer bg-background py-3 text-sm outline-hidden",
                (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
                className,
                inputClassName
              )}
              rows={rows}
              ref={igrpMergeRefs(field.ref, ref)}
              value={field.value || ""}
              onChange={igrpChainHandlers(field.onChange, onChange)}
              onBlur={igrpChainHandlers(field.onBlur, onBlur)}
              {...callerProps}
            />
          </div>

          <TextareaCounter
            id={counterId}
            length={textareaValueLength(field.value)}
            maxLength={max}
            warnAt={warnAt}
            showCounter={showCounter}
            showProgress={showProgress}
          />

          {helperText && !errorMessage && !fieldState.error && (
            <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>
          )}

          {(errorMessage || fieldState.error) && (
            <FieldError id={`${fieldName}-error`}>{errorMessage || fieldState.error?.message}</FieldError>
          )}
        </Field>
      )}
    />
  )
}

export { IGRPTextarea, type IGRPTextareaProps }

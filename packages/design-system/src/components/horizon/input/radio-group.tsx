"use client"

import { useId } from "react"
import { useController, useFormContext, type Control, type FieldValues } from "react-hook-form"

import { cn } from "../cn.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import type { IGRPBaseAttributes, IGRPOptionsProps } from "../../../types.js"
import { useIGRPi18n } from "../../../i18n/index.js"
import { Badge } from "../../primitives/badge.js"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "../../primitives/field.js"
import { RadioGroup, RadioGroupItem } from "../../primitives/radio-group.js"
import { IGRPIcon } from "../icon/index.js"
import { IGRPLabel } from "../label.js"

/**
 * Option for radio group.
 * @deprecated Use `IGRPOptionsProps` — `IGRPRadioGroup` takes the shared option type.
 * @see IGRPRadioGroup
 */
type IGRPRadioOption = IGRPOptionsProps

/**
 * Props for the IGRPRadioGroup component.
 * @see IGRPRadioGroup
 */
interface IGRPRadioGroupProps
  extends IGRPBaseAttributes, Omit<React.ComponentProps<typeof RadioGroup>, "children" | "dir"> {
  /**
   * `options` offered. `description` renders in both variants; `icon` and `badge` only on option cards.
   */
  options: IGRPOptionsProps[]
  /**
   * `"default"` draws a dot and label per option. `"card"` draws each option as an option card —
   * reach for it when every option deserves a description or an icon and there are only a handful.
   */
  variant?: "default" | "card"
  /** Error message that replaces the form's own message for `name`; always shown when set. */
  errorText?: string
  /** @deprecated Use `errorText`. */
  error?: string
  /** Shown instead of the options when `options` is empty. */
  emptyLabel?: string
  /** Text direction; `"rtl"` puts the radio on the other side of its label. */
  dir?: "ltr" | "rtl"
}

type OptionsProps = {
  groupId: string
  fieldName?: string
  options: IGRPOptionsProps[]
  variant: "default" | "card"
  value?: string
  defaultValue?: string
  onValueChange: (value: string) => void
  orientation?: "horizontal" | "vertical"
  disabled?: boolean
  required?: boolean
  invalid: boolean
  labelledById?: string
  describedById?: string
  dir?: "ltr" | "rtl"
  radioGroupProps: object
}

/** @internal One option as a dot and label. */
function DefaultOption({
  option,
  itemId,
  disabled,
  dir,
}: {
  option: IGRPOptionsProps
  itemId: string
  disabled?: boolean
  dir?: "ltr" | "rtl"
}) {
  return (
    <div className={cn("flex items-start gap-2", dir === "rtl" && "flex-row-reverse justify-between")}>
      <RadioGroupItem value={option.value} id={itemId} disabled={disabled} className="mt-0.5" />
      <div className={cn(disabled && "opacity-50")}>
        <IGRPLabel
          htmlFor={itemId}
          label={option.label}
          className={cn("text-sm leading-none font-medium", disabled && "cursor-not-allowed")}
        />
        {option.description && <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>}
      </div>
    </div>
  )
}

/**
 * @internal One option as an option card. Selected, hover and focus looks are CSS on
 * `FieldLabel` keyed off the radio's own state — never a flag computed here.
 */
function CardOption({
  option,
  itemId,
  disabled,
  dir,
}: {
  option: IGRPOptionsProps
  itemId: string
  disabled?: boolean
  dir?: "ltr" | "rtl"
}) {
  return (
    <FieldLabel htmlFor={itemId} className={cn("h-full", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <Field
        orientation="horizontal"
        data-disabled={disabled ? "true" : undefined}
        className={cn(dir === "rtl" && "flex-row-reverse")}
      >
        <FieldContent>
          <FieldTitle className="w-full">
            {option.icon && (
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-has-data-checked/field:bg-primary/10 group-has-data-checked/field:text-primary"
              >
                <IGRPIcon iconName={option.icon} className="size-4" />
              </span>
            )}
            <span className="min-w-0 flex-1 text-pretty">{option.label}</span>
            {option.badge && (
              <Badge variant="secondary" className="shrink-0 font-normal">
                {option.badge}
              </Badge>
            )}
          </FieldTitle>
          {option.description && (
            <FieldDescription className="text-xs group-data-[disabled=true]/field:opacity-50">
              {option.description}
            </FieldDescription>
          )}
        </FieldContent>
        <RadioGroupItem value={option.value} id={itemId} disabled={disabled} />
      </Field>
    </FieldLabel>
  )
}

/** @internal The radios themselves, in either variant. */
function RadioGroupOptions({
  groupId,
  fieldName,
  options,
  variant,
  value,
  defaultValue,
  onValueChange,
  orientation,
  disabled,
  required,
  invalid,
  labelledById,
  describedById,
  dir,
  radioGroupProps,
}: OptionsProps) {
  const Option = variant === "card" ? CardOption : DefaultOption

  return (
    <RadioGroup
      {...igrpOmitNonDomProps(radioGroupProps)}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={fieldName}
      disabled={disabled}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      aria-labelledby={labelledById}
      aria-describedby={describedById}
      className={cn(
        variant === "card"
          ? cn(
              orientation !== "vertical" && "sm:grid-cols-2 lg:grid-cols-3",
              "aria-invalid:*:data-[slot=field-label]:border-destructive/50"
            )
          : cn("flex flex-row", orientation === "vertical" && "flex-col")
      )}
    >
      {options.map((option) => (
        <Option
          key={option.value}
          option={option}
          itemId={`${groupId}-${option.value}`}
          disabled={disabled || option.disabled}
          dir={dir}
        />
      ))}
    </RadioGroup>
  )
}

type FieldSetProps = Omit<OptionsProps, "invalid" | "labelledById" | "describedById"> & {
  label?: string
  labelClassName?: string
  helperText?: string
  error?: string
  emptyLabel?: string
  className?: string
}

/**
 * @internal The field around the radios: `FieldSet` + `FieldLegend` names the group,
 * `FieldError` (`role="alert"`) carries the message, `data-invalid` marks the set.
 */
function RadioGroupFieldSet({
  label,
  labelClassName,
  helperText,
  error,
  emptyLabel,
  className,
  ...optionsProps
}: FieldSetProps) {
  const i18n = useIGRPi18n().radioGroup
  const { groupId, options, required, disabled } = optionsProps
  const legendId = `${groupId}-legend`
  const helperId = `${groupId}-helper`
  const errorId = `${groupId}-error`
  const describedById = error ? errorId : helperText ? helperId : undefined

  return (
    <FieldSet
      className={cn("gap-3", className)}
      data-invalid={error ? true : undefined}
      data-disabled={disabled || undefined}
    >
      {label && (
        <FieldLegend
          id={legendId}
          variant="label"
          className={cn(
            "mb-0 gap-0.5",
            required && "after:text-destructive after:content-['*']",
            error && "text-destructive",
            labelClassName
          )}
        >
          {label}
        </FieldLegend>
      )}

      {options.length === 0 ? (
        <FieldDescription>{emptyLabel ?? i18n.empty}</FieldDescription>
      ) : (
        <RadioGroupOptions
          {...optionsProps}
          invalid={Boolean(error)}
          labelledById={label ? legendId : undefined}
          describedById={describedById}
        />
      )}

      {error ? (
        <FieldError id={errorId} className="text-xs">
          {error}
        </FieldError>
      ) : (
        helperText && (
          <FieldDescription id={helperId} className="text-xs">
            {helperText}
          </FieldDescription>
        )
      )}
    </FieldSet>
  )
}

/** @internal Form-bound mode: reads through `useController`, writes with validate + dirty + touch. */
function FormBoundRadioGroup({
  name,
  control,
  errorText,
  onValueChange,
  ...fieldSetProps
}: Omit<FieldSetProps, "value" | "onValueChange" | "error" | "fieldName"> & {
  name: string
  control: Control<FieldValues>
  errorText?: string
  onValueChange?: (value: string) => void
}) {
  const { setValue } = useFormContext()
  const { field, fieldState } = useController({ name, control })

  return (
    <RadioGroupFieldSet
      {...fieldSetProps}
      fieldName={name}
      value={typeof field.value === "string" ? field.value : ""}
      onValueChange={(next) => {
        setValue(name, next, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
        onValueChange?.(next)
      }}
      error={errorText ?? fieldState.error?.message}
    />
  )
}

/**
 * Single-choice field. Form-bound inside `IGRPForm` (by `name`), or controlled via
 * `value` / `onValueChange`.
 *
 * `variant="card"` renders each option as an option card with its icon, badge and
 * description (consumer request §12, `docs/12-igrp-card-radio-group.md`).
 */
function IGRPRadioGroup({
  name,
  variant = "default",
  required = false,
  disabled = false,
  dir,
  orientation,
  defaultValue,
  value,
  onValueChange,
  className,
  options,
  label,
  labelClassName,
  helperText,
  errorText,
  error,
  emptyLabel,
  ...props
}: IGRPRadioGroupProps) {
  const groupId = useId()
  const formContext = useFormContext()

  const shared = {
    groupId,
    options,
    variant,
    orientation,
    disabled,
    required,
    dir,
    label,
    labelClassName,
    helperText,
    emptyLabel,
    className,
    defaultValue,
    radioGroupProps: props,
  }

  if (formContext && name && value === undefined) {
    return (
      <FormBoundRadioGroup
        {...shared}
        name={name}
        control={formContext.control}
        errorText={errorText ?? error}
        onValueChange={onValueChange}
      />
    )
  }

  return (
    <RadioGroupFieldSet
      {...shared}
      fieldName={name}
      value={value ?? undefined}
      onValueChange={(next) => onValueChange?.(next)}
      error={errorText ?? error}
    />
  )
}

export { IGRPRadioGroup, type IGRPRadioGroupProps, type IGRPRadioOption }

"use client"

import { Controller, useFormContext } from "react-hook-form"

import { igrpChainHandlers } from "../../../lib/form-binding.js"
import { useIGRPi18n } from "../../../i18n/index.js"
import { cn } from "../cn.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../primitives/input-group.js"
import { IGRPButton } from "../button.js"
import { IGRPIcon, type IGRPIconName } from "../icon/index.js"
import { IGRPLabel } from "../label.js"
import { IGRPTooltip } from "../tooltip.js"

/**
 * Props for the IGRPLookupField component.
 * @see IGRPLookupField
 */
interface IGRPLookupFieldProps {
  /** Input id; also the display field when `displayName` is unset. */
  name: string
  /** Form field holding the looked-up value. */
  valueName?: string
  /** Form field bound to the visible input. Defaults to `name`. */
  displayName?: string
  label: string
  required?: boolean
  /** Runs when the lookup button is clicked, never while typing. */
  onLookup: () => void
  /** Accessible name of the lookup button. */
  lookupLabel: string
  /** Lookup button icon. Default "Search". */
  iconName?: IGRPIconName | string
  /** Disables the input and both buttons. */
  disabled?: boolean
  /** Disables the input only. Defaults to `disabled`. */
  inputDisabled?: boolean
  /** Disables the lookup button only. */
  lookupDisabled?: boolean
  /** Tooltip shown only while the lookup button is disabled. */
  lookupDisabledReason?: string
  /** Disables the lookup button and shows a spinner in place of the icon. */
  loading?: boolean
  onClear?: () => void
  /** Info tooltip next to the label. */
  labelTooltip?: string
  labelSuffix?: React.ReactNode
  helperText?: string
  /** Overrides any form error. */
  errorText?: string
  /** Standalone only; ignored inside a form. */
  value?: string | null
  /** Standalone; inside a form it runs after the binding. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  /** Classes for the Field wrapper. */
  className?: string
  /** Classes for the input. */
  inputClassName?: string
  /** Classes for the lookup button. */
  buttonClassName?: string
}

type ViewProps = IGRPLookupFieldProps & {
  inputValue: string
  error?: string
  inputProps?: Pick<React.ComponentProps<"input">, "onBlur" | "ref">
}

function LookupView({
  name,
  displayName,
  label,
  required,
  onLookup,
  lookupLabel,
  iconName = "Search",
  disabled,
  inputDisabled,
  lookupDisabled,
  lookupDisabledReason,
  loading,
  labelTooltip,
  labelSuffix,
  helperText,
  onChange,
  className,
  inputClassName,
  buttonClassName,
  inputValue,
  error,
  inputProps,
}: ViewProps) {
  const i18n = useIGRPi18n()
  const lookupButtonDisabled = Boolean(disabled || lookupDisabled)
  const describedBy = [helperText && `${name}-helper`, error && `${name}-error`].filter(Boolean).join(" ")

  return (
    <Field className={className} data-invalid={error ? true : undefined}>
      <div className="flex items-center justify-between gap-2">
        <IGRPLabel label={label} id={name} required={required} />
        {labelTooltip && (
          <IGRPTooltip label={labelTooltip}>
            <button type="button" aria-label={i18n.lookupField.moreInfo}>
              <IGRPIcon iconName="Info" size={14} aria-hidden="true" />
            </button>
          </IGRPTooltip>
        )}
        {labelSuffix && <div className="shrink-0">{labelSuffix}</div>}
      </div>
      <InputGroup>
        <InputGroupInput
          id={name}
          name={displayName ?? name}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          disabled={inputDisabled ?? disabled}
          className={inputClassName}
          value={inputValue}
          onChange={onChange}
          {...inputProps}
        />
        <InputGroupAddon align="inline-end">
          <IGRPTooltip label={lookupButtonDisabled ? lookupDisabledReason : undefined} disabled={lookupButtonDisabled}>
            <IGRPButton
              size="icon-xs"
              variant="ghost"
              iconName={iconName}
              aria-label={lookupLabel}
              onClick={onLookup}
              disabled={lookupButtonDisabled}
              loading={loading}
              className={buttonClassName}
            />
          </IGRPTooltip>
        </InputGroupAddon>
      </InputGroup>
      {helperText && (
        <FieldDescription id={`${name}-helper`} className={cn(disabled && "text-muted-foreground/80")}>
          {helperText}
        </FieldDescription>
      )}
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </Field>
  )
}

function BoundLookupField(props: IGRPLookupFieldProps) {
  const { control } = useFormContext()
  return (
    <Controller
      control={control}
      name={props.displayName ?? props.name}
      render={({ field, fieldState }) => (
        <LookupView
          {...props}
          inputValue={field.value ?? ""}
          onChange={igrpChainHandlers(field.onChange, props.onChange)}
          error={props.errorText ?? fieldState.error?.message}
          inputProps={{ onBlur: field.onBlur, ref: field.ref }}
        />
      )}
    />
  )
}

/**
 * Text field with a lookup button the caller wires to a search.
 * Auto-wires to IGRPForm when inside form context.
 */
function IGRPLookupField(props: IGRPLookupFieldProps) {
  const formContext = useFormContext()
  if (formContext) return <BoundLookupField {...props} />
  return <LookupView {...props} inputValue={props.value ?? ""} error={props.errorText} />
}

export { IGRPLookupField, type IGRPLookupFieldProps }

"use client"

import { useId, useState } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { useIGRPi18n } from "../../../i18n/index.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import type { IGRPGridSize, IGRPInputProps } from "../../../types.js"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../../primitives/input-group.js"
import { IGRPIcon } from "../icon/index.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"

/**
 * Props for the IGRPInputPassword component.
 * @see IGRPInputPassword
 */
interface IGRPInputPasswordProps extends Omit<IGRPInputProps, "onChange"> {
  /** Controlled password value. */
  value?: string
  /** Default password value. */
  defaultValue?: string
  /** Called when value changes. */
  onChange?: (value: string) => void
  /** Show toggle to reveal/hide password. */
  showPasswordToggle?: boolean
  /**
   * @deprecated This props will be deprecated in the next release.
   */
  IGRPGridSize?: IGRPGridSize
}

/**
 * Password input with optional visibility toggle. Integrates with react-hook-form.
 */
function IGRPInputPassword({
  name,
  id,
  label,
  labelClassName,
  helperText,
  className,
  inputClassName,
  required = false,
  error,
  value,
  defaultValue,
  onChange,
  showPasswordToggle = true,
  ...props
}: IGRPInputPasswordProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  // Whatever is left belongs to the native element; the IGRP-only keys would
  // otherwise be rendered as invalid DOM attributes.
  const domProps = igrpOmitNonDomProps(props)

  const [showPassword, setShowPassword] = useState(false)
  const formContext = useFormContext()
  const i18n = useIGRPi18n()
  const toggleLabel = showPassword ? i18n.inputPassword.hidePasswordLabel : i18n.inputPassword.showPasswordLabel
  const [localValue, setLocalValue] = useState(value ?? defaultValue ?? "")

  const handleStandaloneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (value === undefined) setLocalValue(newValue)
    onChange?.(newValue)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (!formContext) {
    return (
      <Field className={className} data-invalid={error ? true : undefined}>
        {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

        <InputGroup>
          <InputGroupInput
            className={inputClassName}
            id={fieldName}
            name={fieldName}
            type={showPassword ? "text" : "password"}
            spellCheck={false}
            autoComplete="current-password"
            required={required}
            aria-required={required}
            aria-invalid={!!error || !!props["aria-invalid"]}
            aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
            value={value !== undefined ? value : localValue}
            defaultValue={defaultValue}
            onChange={handleStandaloneChange}
            {...domProps}
          />

          {showPasswordToggle && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={togglePasswordVisibility}
                aria-label={toggleLabel}
                name="toggle-password-visibility"
              >
                <IGRPIcon iconName={showPassword ? "EyeOff" : "Eye"} aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

        {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
      </Field>
    )
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue || ""}
      render={({ field, fieldState }) => (
        <Field className={className} data-invalid={fieldState.error || error ? true : undefined}>
          {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

          <InputGroup>
            <InputGroupInput
              className={inputClassName}
              id={fieldName}
              type={showPassword ? "text" : "password"}
              spellCheck={false}
              autoComplete="current-password"
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error || !!props["aria-invalid"]}
              aria-describedby={
                error || fieldState.error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
              }
              value={field.value}
              onChange={(e) => {
                field.onChange(e)
                onChange?.(e.target.value)
              }}
              onBlur={field.onBlur}
              {...domProps}
            />

            {showPasswordToggle && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" onClick={togglePasswordVisibility} aria-label={toggleLabel}>
                  <IGRPIcon iconName={showPassword ? "EyeOff" : "Eye"} aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {helperText && !error && !fieldState.error && (
            <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>
          )}

          {(error || fieldState.error) && (
            <FieldError id={`${fieldName}-error`}>{error || fieldState.error?.message}</FieldError>
          )}
        </Field>
      )}
    />
  )
}

export { IGRPInputPassword, type IGRPInputPasswordProps }

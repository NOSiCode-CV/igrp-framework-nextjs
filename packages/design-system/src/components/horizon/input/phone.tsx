"use client"

import { useId, useState } from "react"
import { useFormContext, Controller } from "react-hook-form"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { cn } from "../../../lib/utils"
import type { IGRPInputProps } from "../../../types"
import { Input } from "../../primitives/input"
import { IGRPIcon } from "../icon"
import { IGRPLabel } from "../label"

/**
 * Props for the IGRPInputPhone component.
 * @see IGRPInputPhone
 */
interface IGRPInputPhoneProps extends Omit<IGRPInputProps, "onChange" | "ref"> {
  /** Description text. */
  description?: string
  /** Helper text below the input. */
  helperText?: string
  /** Default phone value. */
  defaultValue?: string
  /** Controlled phone value. */
  value?: string
  /** Use international format. */
  international?: boolean
  /** Default country code. */
  defaultCountry?: RPNInput.Country
  /** Allowed countries. */
  countries?: RPNInput.Country[]
  /** Called when phone value changes. */
  onChange?: (value: string | undefined) => void
  /** Text direction. */
  dir?: "ltr" | "rtl"
}

/** @internal Wrapper for phone input styling. */
function PhoneInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="phone-input"
      className={cn("-ms-px rounded-s-none shadow-none focus-visible:z-10", className)}
      {...props}
    />
  )
}

/** @internal Country selector for phone input. */
type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  onChange: (value: RPNInput.Country) => void
  options: { label: string; value: RPNInput.Country | undefined }[]
}

function CountrySelect({ disabled, value, onChange, options }: CountrySelectProps) {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as RPNInput.Country)
  }

  return (
    <div
      className={cn(
        "border-input bg-background text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 relative inline-flex items-center self-stretch rounded-s-md border py-2 ps-3 pe-2 transition-[color,box-shadow] outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50",
      )}
    >
      <div className={cn("inline-flex items-center gap-1")} aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
        <span className={cn("text-muted-foreground/80")}>
          <IGRPIcon iconName="ChevronDown" size={16} aria-hidden="true" />
        </span>
      </div>
      <select
        disabled={disabled}
        value={value}
        onChange={handleSelect}
        className={cn("absolute inset-0 text-sm opacity-0")}
        aria-label="Select country"
      >
        <option key="default" value="">
          Select a country
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option key={option.value ?? `empty-${i}`} value={option.value}>
              {option.label} {option.value && `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  )
}

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
  const Flag = flags[country]
  return (
    <span className={cn("w-5 overflow-hidden rounded-sm")}>
      {Flag ? <Flag title={countryName} /> : <IGRPIcon iconName="Phone" size={16} aria-hidden="true" />}
    </span>
  )
}

/**
 * Phone input with country selector. Integrates with react-hook-form.
 */
function IGRPInputPhone({
  name,
  id,
  label,
  description,
  helperText,
  error,
  defaultValue,
  value,
  placeholder = "Enter phone number",
  disabled,
  international = true,
  defaultCountry,
  countries,
  onChange,
  className,
  required,
  dir = "ltr",
  ...props
}: IGRPInputPhoneProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const formContext = useFormContext()
  const [localValue, setLocalValue] = useState(value ?? defaultValue ?? "")

  const handleStandaloneChange = (newValue: string | undefined) => {
    if (value === undefined) setLocalValue(newValue || "")
    onChange?.(newValue)
  }

  if (!formContext) {
    return (
      <div className={cn("*:not-first:mt-2", className)} dir={dir}>
        {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}

        <RPNInput.default
          className={cn("flex rounded-md shadow-xs")}
          international={international}
          flagComponent={FlagComponent}
          countrySelectComponent={CountrySelect}
          inputComponent={PhoneInput}
          id={fieldName}
          placeholder={placeholder}
          value={value !== undefined ? value : localValue}
          onChange={handleStandaloneChange}
          disabled={disabled}
          defaultCountry={defaultCountry}
          countries={countries}
          {...props}
        />

        {(description || helperText) && !error && (
          <p className={cn("text-xs text-muted-foreground")}>{description || helperText}</p>
        )}

        {error && <p className={cn("text-xs text-destructive")}>{error}</p>}
      </div>
    )
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue || ""}
      render={({ field, fieldState }) => (
        <div className={cn("*:not-first:mt-2", className)} dir={dir}>
          {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}

          <RPNInput.default
            className={cn("flex rounded-md shadow-xs")}
            international={international}
            flagComponent={FlagComponent}
            countrySelectComponent={CountrySelect}
            inputComponent={PhoneInput}
            id={fieldName}
            placeholder={placeholder}
            value={field.value}
            onChange={(newValue) => {
              field.onChange(newValue)
              onChange?.(newValue)
            }}
            onBlur={field.onBlur}
            disabled={disabled}
            defaultCountry={defaultCountry}
            countries={countries}
            {...props}
          />

          {(description || helperText) && !error && !fieldState.error && (
            <p className={cn("text-xs text-muted-foreground")}>{description || helperText}</p>
          )}

          {(error || fieldState.error) && (
            <p className={cn("text-xs text-destructive")}>{error || fieldState.error?.message}</p>
          )}
        </div>
      )}
    />
  )
}

export { IGRPInputPhone, type IGRPInputPhoneProps }

"use client"

import { useId, useState, useCallback } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { cn } from "../cn"
import type { IGRPInputProps, IGRPOptionsProps } from "../../../types"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../primitives/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../primitives/select"
import { igrpOmitNonDomProps } from "../../../lib/dom-props"
import { IGRPLabel } from "../label"
import { Field, FieldDescription, FieldError } from "../../primitives/field"
import { useIGRPi18n } from "../../../i18n"

/**
 * Props for the IGRPInputUrl component.
 * @see IGRPInputUrl
 */
interface IGRPInputUrlProps extends Omit<IGRPInputProps, "onChange"> {
  /** Field name. */
  name: string
  /** Field label. */
  label?: string
  /** Helper text below the input. */
  helperText?: string
  /** Validation error message. */
  error?: string
  /** Whether the field is required. */
  required?: boolean
  /** Controlled URL value. */
  value?: string
  /** Default URL value. */
  defaultValue?: string
  /** Called when URL changes. */
  onChange?: (value: string) => void
  /** Protocol options (e.g. https://, http://). */
  protocols?: IGRPOptionsProps[]
  /** Default protocol prefix. */
  defaultProtocol?: string
}

const DEFAULT_PROTOCOLS: IGRPOptionsProps[] = [
  { value: "https://", label: "https://" },
  { value: "http://", label: "http://" },
  { value: "ftp://", label: "ftp://" },
  { value: "sftp://", label: "sftp://" },
  { value: "ws://", label: "ws://" },
  { value: "wss://", label: "wss://" },
]

/**
 * URL input with protocol selector. Integrates with react-hook-form.
 */
function IGRPInputUrl({
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
  defaultValue = "",
  onChange,
  protocols = DEFAULT_PROTOCOLS,
  defaultProtocol = "https://",
  ...props
}: IGRPInputUrlProps) {
  const i18n = useIGRPi18n()
  const _id = useId()
  const fieldName = name ?? id ?? _id
  // Whatever is left belongs to the native element; the IGRP-only keys would
  // otherwise be rendered as invalid DOM attributes.
  const domProps = igrpOmitNonDomProps(props)

  const formContext = useFormContext()

  const extractUrlParts = useCallback(
    (url: string) => {
      const protocolMatch = protocols.find((p) => url.startsWith(String(p.value)))
      if (protocolMatch) {
        return {
          protocol: protocolMatch.value,
          address: url.substring(String(protocolMatch.value).length),
        }
      }
      return {
        protocol: defaultProtocol,
        address: url,
      }
    },
    [defaultProtocol, protocols]
  )

  const initialUrl = value ?? defaultValue ?? ""
  const initialParts = extractUrlParts(initialUrl)
  const [localProtocol, setLocalProtocol] = useState(() => String(initialParts.protocol))
  const [localAddress, setLocalAddress] = useState(() => initialParts.address)

  const displayProtocol = !formContext && value !== undefined ? String(extractUrlParts(value).protocol) : localProtocol
  const displayAddress = !formContext && value !== undefined ? extractUrlParts(value).address : localAddress

  const combineUrl = (protocol: string, address: string) => {
    return `${protocol}${address}`
  }

  const handleStandaloneProtocolChange = (newProtocol: string) => {
    if (value === undefined) setLocalProtocol(newProtocol)
    onChange?.(combineUrl(newProtocol, displayAddress))
  }

  const handleStandaloneAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    if (value === undefined) setLocalAddress(newAddress)
    onChange?.(combineUrl(displayProtocol, newAddress))
  }

  if (!formContext) {
    return (
      <Field className={className} data-invalid={error ? true : undefined}>
        {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

        <InputGroup>
          <InputGroupAddon align="inline-start" className={cn("p-0")}>
            <Select value={displayProtocol} onValueChange={handleStandaloneProtocolChange} disabled={props.disabled}>
              <SelectTrigger
                aria-label={i18n.inputUrl.protocolLabel}
                className={cn("h-auto min-w-[100px] border-0 bg-transparent shadow-none focus-visible:ring-0")}
              >
                <SelectValue placeholder={defaultProtocol} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {protocols.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </InputGroupAddon>

          <InputGroupInput
            className={inputClassName}
            id={fieldName}
            name={fieldName}
            type="url"
            inputMode="url"
            value={displayAddress}
            onChange={handleStandaloneAddressChange}
            required={required}
            aria-required={required}
            aria-invalid={!!error || !!props["aria-invalid"]}
            aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
            {...domProps}
          />
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
      render={({ field, fieldState }) => {
        const { protocol: fieldProtocol, address: fieldAddress } = extractUrlParts(field.value || "")

        const handleProtocolChange = (newProtocol: string) => {
          const newValue = combineUrl(newProtocol, fieldAddress)
          field.onChange(newValue)
          onChange?.(newValue)
        }

        const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newAddress = e.target.value
          const newValue = combineUrl(String(fieldProtocol), newAddress)
          field.onChange(newValue)
          onChange?.(newValue)
        }

        return (
          <Field className={className} data-invalid={fieldState.error || error ? true : undefined}>
            {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

            <InputGroup>
              <InputGroupAddon align="inline-start" className={cn("p-0")}>
                <Select
                  value={String(fieldProtocol)}
                  onValueChange={handleProtocolChange}
                  disabled={props.disabled}
                  onOpenChange={() => field.onBlur()}
                >
                  <SelectTrigger
                    aria-label={i18n.inputUrl.protocolLabel}
                    className={cn("h-auto min-w-[100px] border-0 bg-transparent shadow-none focus-visible:ring-0")}
                  >
                    <SelectValue placeholder={defaultProtocol} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {protocols.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </InputGroupAddon>

              <InputGroupInput
                className={inputClassName}
                id={fieldName}
                name={fieldName}
                type="url"
                inputMode="url"
                value={fieldAddress}
                onChange={handleAddressChange}
                onBlur={field.onBlur}
                required={required}
                aria-required={required}
                aria-invalid={!!fieldState.error || !!error || !!props["aria-invalid"]}
                aria-describedby={
                  error || fieldState.error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
                }
                {...domProps}
              />
            </InputGroup>

            {helperText && !error && !fieldState.error && (
              <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>
            )}

            {(error || fieldState.error) && (
              <FieldError id={`${fieldName}-error`}>{error || fieldState.error?.message}</FieldError>
            )}
          </Field>
        )
      }}
    />
  )
}

export { IGRPInputUrl, type IGRPInputUrlProps }

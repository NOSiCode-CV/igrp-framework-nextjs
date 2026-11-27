"use client"

import { useId, useState, useCallback } from "react"
import { useFormContext, Controller } from "react-hook-form"

import { cn } from "../cn.js"
import type { IGRPInputProps, IGRPOptionsProps } from "../../../types.js"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../primitives/input-group.js"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../primitives/select.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import { igrpChainHandlers, igrpMergeRefs } from "../../../lib/form-binding.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"
import { useIGRPi18n } from "../../../i18n/index.js"

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
      // Case-insensitive ("HTTPS://" is https://); the stored protocol is the option's spelling.
      const lower = url.toLowerCase()
      const protocolMatch = protocols.find((p) => lower.startsWith(String(p.value).toLowerCase()))
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

  const displayProtocol = !formContext && value ? String(extractUrlParts(value).protocol) : localProtocol
  const displayAddress = !formContext && value !== undefined ? extractUrlParts(value).address : localAddress

  // A protocol typed or pasted into the address wins over the select, and an
  // empty address is an empty URL, not a bare "https://".
  const resolveUrl = (protocol: string, address: string) => {
    const typed = extractUrlParts(address)
    const resolved = typed.address !== address ? String(typed.protocol) : protocol
    return { protocol: resolved, address: typed.address, url: typed.address ? `${resolved}${typed.address}` : "" }
  }

  const handleStandaloneProtocolChange = (newProtocol: string) => {
    setLocalProtocol(newProtocol)
    onChange?.(resolveUrl(newProtocol, displayAddress).url)
  }

  const handleStandaloneAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = resolveUrl(displayProtocol, e.target.value)
    setLocalProtocol(next.protocol)
    if (value === undefined) setLocalAddress(next.address)
    onChange?.(next.url)
  }

  if (!formContext) {
    return (
      <Field className={className} data-invalid={error ? true : undefined}>
        {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

        {/* The visible input holds only the address; native forms submit the full URL from here. */}
        <input type="hidden" name={fieldName} value={value ?? resolveUrl(displayProtocol, displayAddress).url} />
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

  // The field owns onBlur/ref; the caller's copies run after it and never replace
  // it (see lib/form-binding.ts).
  const { onBlur, ref, ...callerProps } = domProps

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue || ""}
      render={({ field, fieldState }) => {
        const parts = extractUrlParts(field.value || "")
        // An empty field keeps the protocol last picked instead of snapping back to the default.
        const fieldProtocol = field.value ? String(parts.protocol) : localProtocol
        const fieldAddress = parts.address

        // An empty URL is "": undefined would make useWatch bring the default back,
        // and null fails z.string() schemas.
        const commit = (next: ReturnType<typeof resolveUrl>) => {
          setLocalProtocol(next.protocol)
          field.onChange(next.url)
          onChange?.(next.url)
        }

        const handleProtocolChange = (newProtocol: string) => commit(resolveUrl(newProtocol, fieldAddress))

        const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) =>
          commit(resolveUrl(fieldProtocol, e.target.value))

        return (
          <Field className={className} data-invalid={fieldState.error || error ? true : undefined}>
            {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

            <input type="hidden" name={fieldName} value={field.value ?? ""} />
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
                inputMode="url"
                ref={igrpMergeRefs(field.ref, ref)}
                value={fieldAddress}
                onChange={handleAddressChange}
                onBlur={igrpChainHandlers(field.onBlur, onBlur)}
                required={required}
                aria-required={required}
                aria-invalid={!!fieldState.error || !!error || !!props["aria-invalid"]}
                aria-describedby={
                  error || fieldState.error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
                }
                {...callerProps}
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

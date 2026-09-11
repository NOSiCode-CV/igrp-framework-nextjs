"use client"

import { useId, useState } from "react"
import { useFormContext } from "react-hook-form"
import { ChevronDown } from "lucide-react"

import { cn } from "../../../lib/utils"
import type { IGRPInputProps } from "../../../types"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "../../primitives/input-group"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "../../primitives/dropdown-menu"
import { IGRPFormField } from "../form/form-field"
import { IGRPLabel } from "../label"
import { useIGRPi18n } from "../../../i18n"
import { hexToFormat, formatToHex, detectFormat, type ColorFormat } from "../../../lib/color-utils"

interface IGRPInputColorProps extends Omit<IGRPInputProps, "onChange" | "value" | "defaultValue"> {
  /** Initial color in any supported format. Default: "#000000" */
  defaultValue?: string
  /** Controlled color value in the active format. */
  value?: string
  /** Fires on every confirmed change; emits in the active format. */
  onChange?: (value: string) => void
  /** Locks the display format and hides the format dropdown. */
  format?: ColorFormat
  /** Format used when the value does not declare one. Default: "oklch" */
  defaultFormat?: ColorFormat
  /** Show/hide the text field + format dropdown. Default: true */
  showFormatValue?: boolean
  /** Overrides the message shown when the typed color cannot be parsed. */
  invalidValueMessage?: string
}

const FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  oklch: "OKLCH",
}

const ALL_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "oklch"]

/** Shared input props this component has no slot for — they must not reach the DOM. */
const IGRP_ONLY_INPUT_PROPS = ["showIcon", "iconName", "iconSize", "iconPlacement", "iconClassName"] as const

function toInputProps(props: Record<string, unknown>): React.ComponentProps<typeof InputGroupInput> {
  const rest: Record<string, unknown> = { ...props }
  for (const key of IGRP_ONLY_INPUT_PROPS) delete rest[key]
  return rest
}

function normalizeToHex(value: string | undefined, hint?: ColorFormat): string {
  if (!value) return "#000000"
  const fmt = hint ?? detectFormat(value) ?? "hex"
  return formatToHex(value, fmt) ?? "#000000"
}

interface ColorFieldProps {
  /** External value. `undefined` keeps the field uncontrolled. */
  value?: string
  defaultValue: string
  onChange: (value: string) => void
  onBlur?: () => void
  format?: ColorFormat
  defaultFormat: ColorFormat
  showFormatValue: boolean
  disabled?: boolean
  hasError: boolean
  invalidValueMessage?: string
  label?: string
  inputClassName?: string
  /** Rest props forwarded to the value text field. */
  inputProps?: React.ComponentProps<typeof InputGroupInput>
  /** Set by `FormControl` in the form path — lands on the picker so the label targets it. */
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

/**
 * Swatch + value field. Owns the in-progress text edit only — the committed color
 * always comes from `value` when the caller supplies one, so `reset()` / `setValue()`
 * and external updates stay in sync with what is rendered.
 */
function ColorField({
  value,
  defaultValue,
  onChange,
  onBlur,
  format: lockedFormat,
  defaultFormat,
  showFormatValue,
  disabled,
  hasError,
  invalidValueMessage,
  label,
  inputClassName,
  inputProps,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
}: ColorFieldProps) {
  const i18n = useIGRPi18n()
  const generatedId = useId()
  const controlId = id ?? generatedId
  const messageId = `${controlId}-invalid`

  const [internalValue, setInternalValue] = useState(defaultValue)
  const [draft, setDraft] = useState<string | null>(null)
  const [pickedFormat, setPickedFormat] = useState<ColorFormat | null>(null)

  const source = value ?? internalValue

  // An external change (reset, setValue, a new controlled value) wins over an
  // in-progress edit — otherwise a rejected draft would survive a form reset.
  const [lastSource, setLastSource] = useState(source)
  if (source !== lastSource) {
    setLastSource(source)
    setDraft(null)
  }

  // Display in the format the value itself declares, so a stored hex is not
  // silently rewritten as oklch before the user touches anything.
  const format = lockedFormat ?? pickedFormat ?? detectFormat(source ?? "") ?? defaultFormat
  const parsedHex = source ? formatToHex(source, detectFormat(source) ?? format) : null
  const sourceInvalid = !!source && parsedHex === null

  // The swatch holds the last color that parsed, so it stays meaningful while the
  // value field shows text that does not.
  const [lastValidHex, setLastValidHex] = useState(() => normalizeToHex(source))
  if (parsedHex !== null && parsedHex !== lastValidHex) setLastValidHex(parsedHex)

  const hexValue = parsedHex ?? lastValidHex
  const text = draft ?? (sourceInvalid ? source : hexToFormat(hexValue, format))
  const invalid = hasError || sourceInvalid || ariaInvalid === true

  const emit = (next: string) => {
    setDraft(null)
    setInternalValue(next)
    onChange(next)
  }

  const commitDraft = () => {
    if (draft === null) return
    const trimmed = draft.trim()
    // An empty field is not a color — keep the one already selected.
    if (trimmed === "") {
      setDraft(null)
      return
    }
    // Accept a value in any recognised format and re-emit it in the active one.
    const parsed = formatToHex(trimmed, detectFormat(trimmed) ?? format)
    // Unparseable text is published as typed, so the field value never disagrees
    // with what the user sees; rejecting it is then the consumer schema's job.
    emit(parsed ? hexToFormat(parsed, format) : trimmed)
  }

  // A field-level error from the consumer already says what is wrong — don't stack.
  const showInvalidMessage = sourceInvalid && !hasError
  const describedByIds = [describedBy, showInvalidMessage ? messageId : null].filter(Boolean).join(" ") || undefined
  const formatLabel = FORMAT_LABELS[format]
  // With a visible label the picker is already named through `htmlFor`; only fall
  // back to an aria-label when there is none.
  const pickerLabel = label ? undefined : i18n.inputColor.pickerLabel

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {/* Swatch — overflow-hidden removed so focus ring is not clipped */}
        <div
          className={cn(
            "relative size-9 shrink-0 rounded-md border border-input shadow-xs",
            "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
            invalid && "border-destructive",
            disabled && "opacity-50",
          )}
        >
          <input
            type="color"
            id={controlId}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            value={hexValue}
            onChange={(e) => emit(hexToFormat(e.target.value, format))}
            onBlur={onBlur}
            disabled={disabled}
            aria-label={pickerLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={describedByIds}
          />
          <div className="absolute inset-0 rounded-md pointer-events-none" style={{ backgroundColor: hexValue }} />
        </div>

        {showFormatValue && (
          <InputGroup className="flex-1" data-disabled={disabled || undefined}>
            <InputGroupInput
              {...inputProps}
              className={inputClassName}
              value={text}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                commitDraft()
                onBlur?.()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitDraft()
                }
              }}
              disabled={disabled}
              aria-label={`${label ?? i18n.inputColor.valueLabel} (${formatLabel})`}
              aria-invalid={invalid || undefined}
              aria-describedby={describedByIds}
            />
            {lockedFormat === undefined && (
              <InputGroupAddon align="inline-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton size="xs" disabled={disabled} aria-label={i18n.inputColor.formatSelectorLabel}>
                      {formatLabel}
                      <ChevronDown data-icon="inline-end" />
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      {ALL_FORMATS.map((fmt) => (
                        <DropdownMenuItem
                          key={fmt}
                          onSelect={() => {
                            setPickedFormat(fmt)
                            emit(hexToFormat(hexValue, fmt))
                          }}
                        >
                          {FORMAT_LABELS[fmt]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </InputGroupAddon>
            )}
          </InputGroup>
        )}
      </div>

      {showInvalidMessage && (
        <p id={messageId} className="text-destructive text-xs" role="alert">
          {invalidValueMessage ?? i18n.inputColor.invalidValueMessage}
        </p>
      )}
    </div>
  )
}

/**
 * Color input with a native picker, an editable value field and a format selector.
 * Inside an IGRP form it binds to the field value; standalone it works controlled
 * (`value` + `onChange`) or uncontrolled (`defaultValue`).
 */
function IGRPInputColor({
  name,
  id,
  label,
  helperText,
  className,
  labelClassName,
  inputClassName,
  required,
  defaultValue = "#000000",
  value: controlledValue,
  onChange,
  format: formatProp,
  defaultFormat = "oklch",
  showFormatValue = true,
  invalidValueMessage,
  error,
  disabled,
  ...props
}: IGRPInputColorProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const controlId = `${fieldName}-color`
  const formContext = useFormContext()

  const shared = {
    defaultValue,
    format: formatProp,
    defaultFormat,
    showFormatValue,
    disabled,
    invalidValueMessage,
    label,
    inputClassName,
    inputProps: toInputProps(props),
  }

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        required={required}
        control={formContext.control}
      >
        {(field, fieldState) => (
          <ColorField
            {...shared}
            value={field.value}
            onChange={(display) => {
              field.onChange(display)
              onChange?.(display)
            }}
            onBlur={field.onBlur}
            hasError={!!fieldState.error || !!error}
          />
        )}
      </IGRPFormField>
    )
  }

  return (
    <div className={cn("*:not-first:mt-2", className)}>
      {label && <IGRPLabel label={label} className={labelClassName} required={required} id={controlId} />}

      <ColorField
        {...shared}
        id={controlId}
        value={controlledValue}
        onChange={(display) => onChange?.(display)}
        hasError={!!error}
        aria-describedby={
          [helperText && !error ? `${fieldName}-helper` : null, error ? `${fieldName}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />

      {helperText && !error && (
        <p id={`${fieldName}-helper`} className="text-muted-foreground mt-2 text-xs" aria-live="polite">
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${fieldName}-error`} className="text-destructive mt-2 text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export { IGRPInputColor, type IGRPInputColorProps }

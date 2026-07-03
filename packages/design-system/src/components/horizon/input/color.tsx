"use client"

import { useId, useState, useEffect, useRef } from "react"
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
  /** Initial format when format prop is omitted. Default: "oklch" */
  defaultFormat?: ColorFormat
  /** Show/hide the text field + format dropdown. Default: true */
  showFormatValue?: boolean
}

const FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  oklch: "OKLCH",
}

const ALL_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "oklch"]

function normalizeToHex(value: string, hint?: ColorFormat): string {
  if (!value) return "#000000"
  const fmt = hint ?? detectFormat(value) ?? "hex"
  return formatToHex(value, fmt) ?? "#000000"
}

interface ColorControlProps {
  hexValue: string
  stringInput: string
  activeFormat: ColorFormat
  isFormatLocked: boolean
  showFormatValue: boolean
  disabled?: boolean
  hasError: boolean
  onPickerChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStringChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFormatChange: (fmt: ColorFormat) => void
  label?: string
}

function ColorControl({
  hexValue,
  stringInput,
  activeFormat,
  isFormatLocked,
  showFormatValue,
  disabled,
  hasError,
  onPickerChange,
  onStringChange,
  onBlur,
  onKeyDown,
  onFormatChange,
  label,
}: ColorControlProps) {
  return (
    <div className={cn("flex items-center gap-2", disabled && "opacity-50 pointer-events-none")}>
      {/* Swatch — overflow-hidden removed so focus ring is not clipped */}
      <div
        className={cn(
          "relative size-9 shrink-0 rounded-md border border-input shadow-xs",
          "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
          hasError && "border-destructive",
        )}
      >
        <input
          type="color"
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          value={hexValue}
          onChange={onPickerChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-label={label ? `${label} color picker` : "Color picker"}
        />
        <div className="absolute inset-0 rounded-md pointer-events-none" style={{ backgroundColor: hexValue }} />
      </div>

      {showFormatValue && (
        <InputGroup className={cn("flex-1", hasError && "border-destructive")}>
          <InputGroupInput
            value={stringInput}
            onChange={onStringChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            aria-label={
              label ? `${label} (${FORMAT_LABELS[activeFormat]})` : `Color value (${FORMAT_LABELS[activeFormat]})`
            }
            aria-invalid={hasError ? true : undefined}
          />
          {!isFormatLocked && (
            <InputGroupAddon align="inline-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton size="xs">
                    {FORMAT_LABELS[activeFormat]}
                    <ChevronDown data-icon="inline-end" />
                  </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    {ALL_FORMATS.map((fmt) => (
                      <DropdownMenuItem key={fmt} onSelect={() => onFormatChange(fmt)}>
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
  )
}

function IGRPInputColor({
  name,
  id,
  label,
  helperText,
  className,
  labelClassName,
  required,
  defaultValue = "#000000",
  value: controlledValue,
  onChange,
  format: formatProp,
  defaultFormat = "oklch",
  showFormatValue = true,
  error,
  ...props
}: IGRPInputColorProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const formContext = useFormContext()
  const isFormatLocked = formatProp !== undefined

  const [activeFormat, setActiveFormat] = useState<ColorFormat>(formatProp ?? defaultFormat)
  const [hexValue, setHexValue] = useState(() =>
    normalizeToHex(
      controlledValue ?? defaultValue,
      formatProp ?? (controlledValue ? (detectFormat(controlledValue) ?? defaultFormat) : defaultFormat),
    ),
  )
  const [stringInput, setStringInput] = useState(() => hexToFormat(hexValue, activeFormat))

  // Keep a ref to the latest activeFormat so the sync effect always reads current format
  const activeFormatRef = useRef(activeFormat)
  useEffect(() => {
    activeFormatRef.current = activeFormat
  }, [activeFormat])

  // Sync when controlled value changes externally (standalone path only)
  useEffect(() => {
    if (controlledValue !== undefined && !formContext) {
      const newHex = normalizeToHex(
        controlledValue,
        formatProp ?? detectFormat(controlledValue) ?? activeFormatRef.current,
      )
      setHexValue(newHex)
      setStringInput(hexToFormat(newHex, activeFormatRef.current))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue])

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
          <ColorControl
            hexValue={hexValue}
            stringInput={stringInput}
            activeFormat={activeFormat}
            isFormatLocked={isFormatLocked}
            showFormatValue={showFormatValue}
            disabled={props.disabled}
            hasError={!!fieldState.error || !!error}
            onPickerChange={(e) => {
              const newHex = e.target.value
              setHexValue(newHex)
              const display = hexToFormat(newHex, activeFormat)
              setStringInput(display)
              field.onChange(display)
              onChange?.(display)
            }}
            onStringChange={(e) => setStringInput(e.target.value)}
            onBlur={() => {
              const parsed = formatToHex(stringInput, activeFormat)
              if (parsed) {
                setHexValue(parsed)
                const display = hexToFormat(parsed, activeFormat)
                setStringInput(display)
                field.onChange(display)
                onChange?.(display)
              } else {
                setStringInput(hexToFormat(hexValue, activeFormat))
              }
              field.onBlur()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const parsed = formatToHex(stringInput, activeFormat)
                if (parsed) {
                  setHexValue(parsed)
                  const display = hexToFormat(parsed, activeFormat)
                  setStringInput(display)
                  field.onChange(display)
                  onChange?.(display)
                } else {
                  setStringInput(hexToFormat(hexValue, activeFormat))
                }
              }
            }}
            onFormatChange={(fmt) => {
              setActiveFormat(fmt)
              const display = hexToFormat(hexValue, fmt)
              setStringInput(display)
              field.onChange(display)
              onChange?.(display)
            }}
            label={label}
          />
        )}
      </IGRPFormField>
    )
  }

  return (
    <div className={cn("*:not-first:mt-2", className)}>
      {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

      <ColorControl
        hexValue={hexValue}
        stringInput={stringInput}
        activeFormat={activeFormat}
        isFormatLocked={isFormatLocked}
        showFormatValue={showFormatValue}
        disabled={props.disabled}
        hasError={!!error}
        onPickerChange={(e) => {
          const newHex = e.target.value
          setHexValue(newHex)
          const display = hexToFormat(newHex, activeFormat)
          setStringInput(display)
          onChange?.(display)
        }}
        onStringChange={(e) => setStringInput(e.target.value)}
        onBlur={() => {
          const parsed = formatToHex(stringInput, activeFormat)
          if (parsed) {
            setHexValue(parsed)
            const display = hexToFormat(parsed, activeFormat)
            setStringInput(display)
            onChange?.(display)
          } else {
            setStringInput(hexToFormat(hexValue, activeFormat))
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            const parsed = formatToHex(stringInput, activeFormat)
            if (parsed) {
              setHexValue(parsed)
              const display = hexToFormat(parsed, activeFormat)
              setStringInput(display)
              onChange?.(display)
            } else {
              setStringInput(hexToFormat(hexValue, activeFormat))
            }
          }
        }}
        onFormatChange={(fmt) => {
          setActiveFormat(fmt)
          const display = hexToFormat(hexValue, fmt)
          setStringInput(display)
          onChange?.(display)
        }}
        label={label}
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

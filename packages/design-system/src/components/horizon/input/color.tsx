"use client"

import { useId, useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { ChevronDown } from "lucide-react"

import { cn } from "../../../lib/utils"
import type { IGRPInputProps } from "../../../types"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "../../primitives/input-group"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "../../primitives/dropdown-menu"
import { IGRPFormField } from "../form/form-field"
import { IGRPLabel } from "../label"
import {
  hexToFormat,
  formatToHex,
  detectFormat,
  type ColorFormat,
} from "../../../lib/color-utils"

interface IGRPInputColorProps
  extends Omit<IGRPInputProps, "onChange" | "value" | "defaultValue"> {
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
  error?: string
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

  // Sync when controlled value changes externally (standalone path only)
  useEffect(() => {
    if (controlledValue !== undefined && !formContext) {
      const newHex = normalizeToHex(
        controlledValue,
        formatProp ?? detectFormat(controlledValue) ?? activeFormat,
      )
      setHexValue(newHex)
      setStringInput(hexToFormat(newHex, activeFormat))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue])

  function commitString(onFieldChange?: (v: string) => void) {
    const parsed = formatToHex(stringInput, activeFormat)
    if (parsed) {
      setHexValue(parsed)
      const display = hexToFormat(parsed, activeFormat)
      setStringInput(display)
      onFieldChange?.(display)
      onChange?.(display)
    } else {
      setStringInput(hexToFormat(hexValue, activeFormat))
    }
  }

  function handlePickerChange(
    e: React.ChangeEvent<HTMLInputElement>,
    onFieldChange?: (v: string) => void,
  ) {
    const newHex = e.target.value
    setHexValue(newHex)
    const display = hexToFormat(newHex, activeFormat)
    setStringInput(display)
    onFieldChange?.(display)
    onChange?.(display)
  }

  function handleFormatChange(fmt: ColorFormat, onFieldChange?: (v: string) => void) {
    setActiveFormat(fmt)
    const display = hexToFormat(hexValue, fmt)
    setStringInput(display)
    onFieldChange?.(display)
    onChange?.(display)
  }

  function renderControl(
    hasError: boolean,
    onFieldChange?: (v: string) => void,
    onFieldBlur?: () => void,
  ) {
    return (
      <div className={cn("flex items-center gap-2", props.disabled && "opacity-50 pointer-events-none")}>
        {/* Swatch — overflow-hidden removed so focus ring is not clipped */}
        <div
          className={cn(
            "relative size-9 flex-shrink-0 rounded-md border border-input shadow-xs",
            "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
            hasError && "border-destructive",
          )}
        >
          <input
            type="color"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            value={hexValue}
            onChange={(e) => handlePickerChange(e, onFieldChange)}
            onBlur={onFieldBlur}
            disabled={props.disabled}
          />
          <div
            className="absolute inset-0 rounded-md pointer-events-none"
            style={{ backgroundColor: hexValue }}
          />
        </div>

        {showFormatValue && (
          <InputGroup className={cn("flex-1", hasError && "border-destructive")}>
            <InputGroupInput
              value={stringInput}
              onChange={(e) => setStringInput(e.target.value)}
              onBlur={() => commitString(onFieldChange)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitString(onFieldChange)
                }
              }}
              aria-invalid={hasError || undefined}
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
                        <DropdownMenuItem
                          key={fmt}
                          onSelect={() => handleFormatChange(fmt, onFieldChange)}
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
    )
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
        {(field, fieldState) =>
          renderControl(!!fieldState.error || !!error, field.onChange, field.onBlur)
        }
      </IGRPFormField>
    )
  }

  return (
    <div className={cn("*:not-first:mt-2", className)}>
      {label && (
        <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />
      )}

      {renderControl(!!error)}

      {helperText && !error && (
        <p
          id={`${fieldName}-helper`}
          className="text-muted-foreground mt-2 text-xs"
          role="region"
          aria-live="polite"
        >
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

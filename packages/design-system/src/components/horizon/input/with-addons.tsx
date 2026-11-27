"use client"

import { useEffect, useId, useMemo } from "react"

import { cn } from "../cn.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import type { IGRPInputProps, IGRPOptionsProps } from "../../../types.js"
import { Input } from "../../primitives/input.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../primitives/select.js"
import { useIGRPi18n } from "../../../i18n/index.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"

/**
 * Props for the IGRPInputAddOn component.
 * @see IGRPInputAddOn
 */
interface IGRPInputAddOnProps extends Omit<
  IGRPInputProps,
  "showIcon" | "iconName" | "iconSize" | "iconPlacement" | "iconClassName"
> {
  /** Options for the addon select. */
  options: IGRPOptionsProps[]
  /** Label for the option group. */
  optionLabel?: string
  /** Selected addon value. */
  selectValue?: string
  /** Called when addon selection changes. */
  onSelectValueChange?(value: string): void
  /** CSS classes for the label. */
  classNameLabel?: string
}

/**
 * Input with a select addon (e.g. prefix/suffix). Integrates with form context.
 */
function IGRPInputAddOn({
  optionLabel,
  options,
  selectValue,
  onSelectValueChange,
  label,
  className: classNameGlobal,
  classNameLabel,
  name,
  id,
  error,
  helperText,
  ...props
}: IGRPInputAddOnProps) {
  const i18n = useIGRPi18n()
  const _id = useId()
  const ref = name ?? id ?? _id

  const defaultValue = useMemo(() => options?.[0]?.value, [options])

  useEffect(() => {
    if (defaultValue && !selectValue) {
      onSelectValueChange?.(String(defaultValue))
    }
  }, [defaultValue, selectValue, onSelectValueChange])

  return (
    <Field className={classNameGlobal}>
      {label && <IGRPLabel label={label} className={classNameLabel} id={ref} />}

      {/* The embedded select/input drop their own rings, so the wrapper shows focus. */}
      <div
        className={cn(
          "flex overflow-hidden rounded-md border transition-[color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50"
        )}
      >
        <Select value={selectValue} onValueChange={onSelectValueChange}>
          <SelectTrigger
            aria-label={optionLabel ?? i18n.inputAddons.selectOption}
            className={cn(
              "min-w-20 rounded-none border-0 border-r px-3 py-2 shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
          >
            <SelectValue>
              {selectValue && (
                <span className={cn("font-semibold", options.find((color) => color.value === selectValue)?.color)}>
                  {options.find((color) => color.value === selectValue)?.label}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {optionLabel && <SelectLabel className={cn("text-sm font-light")}>{optionLabel}</SelectLabel>}
              {options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={String(option.value)}
                  className={cn("cursor-pointer font-semibold", option.color)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          id={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${ref}-error` : helperText ? `${ref}-helper` : undefined}
          className={cn(
            "flex-1 rounded-none border-0 px-3 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          {...igrpOmitNonDomProps(props)}
        />
      </div>
      {helperText && !error && <FieldDescription id={`${ref}-helper`}>{helperText}</FieldDescription>}
      {error && <FieldError id={`${ref}-error`}>{error}</FieldError>}
    </Field>
  )
}

export { IGRPInputAddOn, type IGRPInputAddOnProps }

"use client"

import { useEffect, useId, useMemo } from "react"

import { cn } from "../../../lib/utils"
import type { IGRPInputProps, IGRPOptionsProps } from "../../../types"
import { Input } from "../../primitives/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../primitives/select"
import { IGRPLabel } from "../label"

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
  ...props
}: IGRPInputAddOnProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  const defaultValue = useMemo(() => options?.[0]?.value, [options])

  useEffect(() => {
    if (defaultValue && !selectValue) {
      onSelectValueChange?.(String(defaultValue))
    }
  }, [defaultValue, selectValue, onSelectValueChange])

  return (
    <div className={cn("*:not-first:mt-2", classNameGlobal)} id={ref}>
      {label && <IGRPLabel label={label} className={classNameLabel} id={ref} />}

      <div className={cn("flex rounded-md border overflow-hidden")}>
        <Select value={selectValue} onValueChange={onSelectValueChange}>
          <SelectTrigger
            className={cn(
              "border-0 border-r rounded-none min-w-20 px-3 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
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
              {optionLabel && <SelectLabel className={cn("font-light text-sm")}>{optionLabel}</SelectLabel>}
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
          className={cn(
            "border-0 rounded-none flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 shadow-none",
          )}
          {...props}
        />
      </div>
    </div>
  )
}

export { IGRPInputAddOn, type IGRPInputAddOnProps }

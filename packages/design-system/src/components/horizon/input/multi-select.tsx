"use client"

import { useId, useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"

import { igrpColorText } from "../../../lib/colors.js"
import { cn } from "../cn.js"
import type { IGRPOptionsProps } from "../../../types.js"
import { Badge } from "../../primitives/badge.js"
import { Button } from "../../primitives/button.js"
import { Checkbox } from "../../primitives/checkbox.js"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../primitives/command.js"
import { Field } from "../../primitives/field.js"
import { Popover, PopoverContent, PopoverTrigger } from "../../primitives/popover.js"
import { IGRPFieldDescription } from "../field-description.js"
import { IGRPFormField } from "../form/form-field.js"
import { IGRPLabel } from "../label.js"
import { IGRPIcon } from "../icon/index.js"
import { IGRPCircleFull } from "../icon/custom.js"
import { useIGRPi18n } from "../../../i18n/index.js"

/** Options count from which the search box is shown by default. */
const SEARCH_THRESHOLD = 8

/**
 * Reads whatever the field holds as a selection. A bare string is tolerated on read
 * (some consumer schemas accept one where the API declares `string[]`); the field
 * always writes `string[]`.
 */
function toSelection(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string")
  if (typeof raw === "string" && raw !== "") return [raw]
  return []
}

/**
 * Puts a set of codes in option order, with unmatched codes (no current option
 * carries them) kept after the options, in the order they already had.
 */
function inOptionOrder(codes: Iterable<string>, options: IGRPOptionsProps[]): string[] {
  const set = new Set(codes)
  const known = new Set(options.map((o) => o.value))
  return [...options.map((o) => o.value).filter((v) => set.has(v)), ...[...set].filter((v) => !known.has(v))]
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))

/**
 * Props for the IGRPMultiSelect component.
 * @see IGRPMultiSelect
 */
interface IGRPMultiSelectProps {
  /** Field name in the surrounding `IGRPForm` schema. Ignored when `value` is passed. */
  name?: string
  /** Input id; defaults to `name` or a generated id. */
  id?: string
  label?: string
  /** Options offered. `icon`, `description`, `status`, `color`, `group` and `disabled` render when present. */
  options: IGRPOptionsProps[]
  required?: boolean
  disabled?: boolean
  helperText?: string
  /** Error message that replaces the form's own message for `name`; always shown when set. */
  errorText?: string
  /** Trigger text while nothing is picked. */
  placeholder?: string
  /** Text in the dropdown when no option matches the search. */
  emptyLabel?: string
  searchPlaceholder?: string
  /** Trigger text for two or more picks. `{count}` is replaced with the selection size. */
  selectedCountLabel?: string
  selectAllLabel?: string
  clearLabel?: string
  /** Accessible name of a chip's remove button. `{label}` is replaced with the option label. */
  removeChipLabel?: string
  /** Force the search box on or off. Default: shown from 8 options up. */
  showSearch?: boolean
  /** Hide the "select all" / "clear" row. */
  hideBulkActions?: boolean
  /** Don't echo the selection as chips below the trigger (e.g. dense filter bars). */
  hideChips?: boolean
  /** Cap on how many options can be picked. When set, "select all" is not offered. */
  maxSelected?: number
  /** CSS classes for the wrapper. */
  className?: string
  /** CSS classes for the popover content. */
  popoverClassName?: string
  /** Controlled selection (outside `IGRPForm`). */
  value?: string[]
  /** Called with the next selection, in option order. */
  onChange?: (value: string[]) => void
}

type ControlProps = Omit<IGRPMultiSelectProps, "name" | "label" | "helperText" | "errorText" | "value"> & {
  triggerId: string
  selection: string[]
  /** The selection as it is right now, not as of this render. */
  readNow: () => string[]
  commit: (next: string[]) => void
  onClose?: () => void
  invalid?: boolean
  /** `id` and the aria props below are supplied by `FormControl` (via Slot) in form-bound mode; they go on the trigger. */
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

/** @internal Trigger, popover list and chips. */
function MultiSelectControl({
  id: slotId,
  triggerId,
  options,
  selection,
  readNow,
  commit,
  onClose,
  invalid,
  disabled,
  placeholder,
  emptyLabel,
  searchPlaceholder,
  selectedCountLabel,
  selectAllLabel,
  clearLabel,
  removeChipLabel,
  showSearch,
  hideBulkActions,
  hideChips,
  maxSelected,
  popoverClassName,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: ControlProps) {
  const i18n = useIGRPi18n().multiSelect
  const listId = useId()
  const [open, setOpen] = useState(false)

  const optionByValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options])
  const groups = useMemo(() => {
    if (!options.some((o) => o.group)) return [{ heading: undefined, options }]
    const byGroup = new Map<string, IGRPOptionsProps[]>()
    for (const option of options) {
      const key = option.group ?? ""
      byGroup.set(key, [...(byGroup.get(key) ?? []), option])
    }
    return [...byGroup].map(([heading, groupOptions]) => ({ heading: heading || undefined, options: groupOptions }))
  }, [options])

  const selected = new Set(selection)
  const enabledValues = options.filter((o) => !o.disabled).map((o) => o.value)
  const allSelected = enabledValues.length > 0 && enabledValues.every((v) => selected.has(v))
  const atLimit = maxSelected !== undefined && selection.length >= maxSelected
  const labelOf = (code: string) => optionByValue.get(code)?.label ?? code

  const toggle = (code: string) => {
    const now = readNow()
    if (now.includes(code)) {
      commit(
        inOptionOrder(
          now.filter((v) => v !== code),
          options
        )
      )
      return
    }
    if (maxSelected !== undefined && now.length >= maxSelected) return
    commit(inOptionOrder([...now, code], options))
  }
  const remove = (code: string) =>
    commit(
      inOptionOrder(
        readNow().filter((v) => v !== code),
        options
      )
    )
  const selectAll = () => commit(inOptionOrder([...readNow(), ...enabledValues], options))
  // Disabled options can't be unpicked by the user, so "clear" leaves them alone.
  const clear = () =>
    commit(
      inOptionOrder(
        readNow().filter((v) => optionByValue.get(v)?.disabled),
        options
      )
    )

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) onClose?.()
  }

  const summary =
    selection.length === 0
      ? (placeholder ?? i18n.placeholder)
      : selection.length === 1
        ? labelOf(selection[0] ?? "")
        : fill(selectedCountLabel ?? i18n.selectedCount, { count: selection.length })
  const isInvalid = Boolean(invalid || ariaInvalid)
  const searchVisible = showSearch ?? options.length >= SEARCH_THRESHOLD

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2")}>
      {/* Non-modal: a field's popover must not scroll-lock the page or hide the rest of the form. */}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={slotId ?? triggerId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={isInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            disabled={disabled}
            className={cn(
              "w-full min-w-0 justify-between gap-2 font-normal",
              selection.length === 0 && "text-muted-foreground",
              isInvalid && "border-destructive"
            )}
          >
            <span className={cn("truncate")}>{summary}</span>
            <span className={cn("flex shrink-0 items-center gap-1.5")}>
              {selection.length > 1 && (
                <Badge variant="secondary" className={cn("tabular-nums")}>
                  {selection.length}
                </Badge>
              )}
              <IGRPIcon iconName="ChevronsUpDown" className={cn("size-4 opacity-50")} />
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn("w-72 max-w-[calc(100vw-2rem)] min-w-(--radix-popover-trigger-width) p-0", popoverClassName)}
        >
          <Command>
            {searchVisible && (
              <CommandInput placeholder={searchPlaceholder ?? i18n.searchPlaceholder} className={cn("h-9")} />
            )}
            <CommandList id={listId} className={cn("max-h-64")}>
              <CommandEmpty>{emptyLabel ?? i18n.notFound}</CommandEmpty>
              {groups.map((group, index) => (
                <div key={group.heading ?? `group-${index}`}>
                  {index > 0 && <CommandSeparator />}
                  <CommandGroup heading={group.heading}>
                    {group.options.map((option) => {
                      const isSelected = selected.has(option.value)
                      const itemDisabled = option.disabled || (atLimit && !isSelected)
                      return (
                        <CommandItem
                          key={option.value}
                          value={`${option.label} ${option.value}`}
                          disabled={itemDisabled}
                          onSelect={() => toggle(option.value)}
                          className={cn("flex items-start gap-3")}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={itemDisabled}
                            tabIndex={-1}
                            aria-hidden
                            className={cn("pointer-events-none mt-0.5")}
                          />
                          <span className={cn("flex min-w-0 flex-1 flex-col gap-0.5")}>
                            <span className={cn("flex items-center gap-2 text-sm leading-snug", option.color)}>
                              {option.status && (
                                <IGRPCircleFull className={cn("shrink-0", igrpColorText(option.status))} />
                              )}
                              {option.icon && (
                                <IGRPIcon
                                  iconName={option.icon}
                                  className={cn("size-4 shrink-0 text-muted-foreground")}
                                />
                              )}
                              {option.label}
                            </span>
                            {option.description && (
                              <span className={cn("text-xs leading-relaxed text-muted-foreground")}>
                                {option.description}
                              </span>
                            )}
                          </span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </div>
              ))}
            </CommandList>

            {!hideBulkActions && options.length > 0 && (
              <div className={cn("flex items-center justify-between gap-2 border-t p-2")}>
                <span className={cn("text-xs text-muted-foreground tabular-nums")}>
                  {fill(i18n.tally, { count: selection.length, total: options.length })}
                  {maxSelected !== undefined && fill(i18n.tallyMax, { max: maxSelected })}
                </span>
                <span className={cn("flex items-center gap-1")}>
                  {maxSelected === undefined && (
                    <Button type="button" variant="ghost" size="sm" disabled={allSelected} onClick={selectAll}>
                      {selectAllLabel ?? i18n.selectAll}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" disabled={selection.length === 0} onClick={clear}>
                    {clearLabel ?? i18n.clear}
                  </Button>
                </span>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Chips live outside the trigger: a remove button inside a <button> is invalid HTML. */}
      {!hideChips && selection.length > 0 && (
        <ul className={cn("flex flex-wrap gap-1.5")}>
          {selection.map((code) => {
            const option = optionByValue.get(code)
            const label = labelOf(code)
            return (
              <li key={code}>
                <Badge variant="secondary" className={cn("gap-1 py-1 pr-1 pl-2 font-normal")}>
                  <span className={cn("truncate", option?.color)}>{label}</span>
                  {!disabled && !option?.disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => remove(code)}
                      aria-label={fill(removeChipLabel ?? i18n.removeChip, { label })}
                      className={cn("size-5 text-muted-foreground hover:text-foreground")}
                    >
                      <IGRPIcon iconName="X" className={cn("size-3")} />
                    </Button>
                  )}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * Multi-value choice field: picks a selection (`string[]`, in option order) from a
 * closed list of options. Selection happens in a non-modal popover with a checkbox
 * per option; picks are echoed below the trigger as removable chips.
 *
 * Form-bound inside `IGRPForm` (by `name`), or controlled via `value` / `onChange`.
 * Replaces `IGRPCombobox variant="multiple"` — see `docs/adr/0001-multi-select-separate-from-combobox.md`.
 */
function IGRPMultiSelect({
  name,
  id,
  label,
  required = false,
  helperText,
  errorText,
  className,
  value,
  onChange,
  ...controlProps
}: IGRPMultiSelectProps) {
  const _id = useId()
  const triggerId = id ?? name ?? _id
  const formContext = useFormContext()
  const [localValue, setLocalValue] = useState<string[]>([])

  if (formContext && name && value === undefined) {
    const readNow = () => toSelection(formContext.getValues(name))
    const commit = (next: string[]) => {
      formContext.setValue(name, next, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
      onChange?.(next)
    }

    return (
      <IGRPFormField
        name={name}
        label={label}
        helperText={helperText}
        errorText={errorText}
        className={cn("w-full min-w-0", className)}
        required={required}
        control={formContext.control}
      >
        {(field, fieldState) => (
          <MultiSelectControl
            {...controlProps}
            triggerId={triggerId}
            selection={toSelection(field.value)}
            readNow={readNow}
            commit={commit}
            onClose={field.onBlur}
            invalid={Boolean(fieldState.error || errorText)}
          />
        )}
      </IGRPFormField>
    )
  }

  const selection = toSelection(value ?? localValue)
  const commit = (next: string[]) => {
    if (value === undefined) setLocalValue(next)
    onChange?.(next)
  }

  return (
    <Field className={cn("w-full min-w-0", className)}>
      {label && <IGRPLabel label={label} required={required} id={triggerId} />}
      <MultiSelectControl
        {...controlProps}
        triggerId={triggerId}
        selection={selection}
        readNow={() => selection}
        commit={commit}
        invalid={Boolean(errorText)}
      />
      <IGRPFieldDescription error={errorText} helperText={helperText} />
    </Field>
  )
}

export { IGRPMultiSelect, type IGRPMultiSelectProps }

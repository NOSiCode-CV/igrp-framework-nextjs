"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"

import { igrpColorText } from "../../../lib/colors.js"
import { cn } from "../cn.js"
import type { IGRPInputProps, IGRPOptionsProps } from "../../../types.js"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../primitives/command.js"
import { Popover, PopoverContent, PopoverTrigger } from "../../primitives/popover.js"
import { IGRPButton } from "../button.js"
import { IGRPFieldDescription } from "../field-description.js"
import { IGRPFormField } from "../form/form-field.js"
import { IGRPLabel } from "../label.js"
import { IGRPIcon } from "../icon/index.js"
import { IGRPCircleFull } from "../icon/custom.js"
import { Field } from "../../primitives/field.js"
import { useIGRPi18n } from "../../../i18n/index.js"

/** @internal Options list for combobox dropdown. */
function ComboboxOptionsList({
  groupedOptions,
  showGroup,
  showStatus,
  showIcon,
  currentValue,
  onSelectHandler,
  isSelected,
  iconName = "CornerDownRight",
}: {
  groupedOptions: Record<string, IGRPOptionsProps[]>
  showGroup?: boolean
  showStatus?: boolean
  showIcon?: boolean
  currentValue: string | string[]
  onSelectHandler: (value: string) => void
  isSelected: (optValue: string, currentValue: string | string[]) => boolean
  iconName?: string
}) {
  return (
    <>
      {Object.entries(groupedOptions).map(([groupName, groupOptions], index) => (
        <div key={groupName}>
          {showGroup && index > 0 && <CommandSeparator />}
          <CommandGroup heading={showGroup ? groupName : ""}>
            {groupOptions.map(({ label, value, status, statusLabel, icon }) => (
              <CommandItem
                key={`${groupName}-${value}`}
                onSelect={() => onSelectHandler(value)}
                data-checked={isSelected(value, currentValue)}
                // cmdk uses aria-selected for the highlighted option, so the chosen one is exposed as checked.
                aria-checked={isSelected(value, currentValue)}
                className={cn("flex cursor-pointer items-center justify-between gap-4")}
              >
                <div className={cn("flex items-center gap-2")}>
                  {showStatus && status && <IGRPCircleFull className={igrpColorText(status)} />}
                  {showStatus && statusLabel && <span className="sr-only">{statusLabel}: </span>}
                  {showIcon && <IGRPIcon iconName={icon ?? iconName} />}
                  {label}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </div>
      ))}
    </>
  )
}

/** @internal Combobox trigger + popover field. */
function ComboboxField({
  fieldName,
  listId,
  open,
  setOpen,
  currentValue,
  onChangeHandler,
  setSelectValue,
  groupedOptions,
  showGroup,
  showStatus,
  showIcon,
  showSearch,
  searchText,
  selectLabel,
  selectClassName,
  disabled,
  className,
  onOptionsChangeHandler,
  isSelected,
  onClose,
  triggerRef,
  iconName = "CornerDownRight",
  renderChips,
  id: slotId,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
}: {
  fieldName: string
  listId: string
  open: boolean
  setOpen: (open: boolean) => void
  currentValue: string | string[]
  onChangeHandler: (value: string | string[]) => void
  setSelectValue: (val: string | string[], handler?: (v: string | string[]) => void) => React.ReactNode
  groupedOptions: Record<string, IGRPOptionsProps[]>
  showGroup?: boolean
  showStatus?: boolean
  showIcon?: boolean
  showSearch?: boolean
  searchText?: string
  selectLabel?: string
  selectClassName?: string
  disabled?: boolean
  className?: string
  onOptionsChangeHandler: (
    selectedValue: string,
    currentValue: string | string[],
    onChangeHandler: (value: string | string[]) => void
  ) => void
  isSelected: (optValue: string, currentValue: string | string[]) => boolean
  /** Called when the popover closes — form-bound fields mark themselves touched here. */
  onClose?: () => void
  /** react-hook-form's `field.ref`, so the trigger is focused when the field is invalid. */
  triggerRef?: React.Ref<HTMLButtonElement>
  iconName?: string
  /** Removable chips (variant="multiple"), rendered outside the trigger: a button inside a <button> is invalid. */
  renderChips?: (val: string | string[], handler: (v: string | string[]) => void) => React.ReactNode
  /** `id` and the aria props below come from `FormControl` (via Slot) in form mode, or the caller standalone; they go on the trigger. */
  id?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  "aria-required"?: boolean
}) {
  const i18n = useIGRPi18n()
  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) onClose?.()
  }
  return (
    <div className={cn("w-full max-w-full min-w-0")}>
      {/* Non-modal: a field's popover must not scroll-lock the page or hide the rest of the form. */}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <IGRPButton
            ref={triggerRef}
            id={slotId ?? fieldName}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            aria-required={ariaRequired || undefined}
            disabled={disabled}
            className={cn(
              "w-full max-w-full justify-between overflow-hidden border-input text-left",
              className,
              disabled && "pointer-events-none cursor-not-allowed opacity-50"
            )}
            iconName="ChevronsUpDown"
            iconPlacement="end"
            iconClassName="ml-2 size-4 shrink-0 opacity-50"
            showIcon
          >
            {setSelectValue(currentValue, onChangeHandler)}
          </IGRPButton>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-auto max-w-[calc(100vw-2rem)] min-w-(--radix-popover-trigger-width) p-0", selectClassName)}
          align="start"
          side="bottom"
        >
          <Command>
            {showSearch ? (
              <div className={cn("relative p-2")}>
                <CommandInput placeholder={searchText ?? i18n.combobox.searchPlaceholder} className={cn("h-8")} />
                <CommandEmpty>{selectLabel ?? i18n.combobox.notFound}</CommandEmpty>
              </div>
            ) : (
              // Without it nothing in the popover takes focus, so cmdk never receives arrow keys or Enter.
              <div className={cn("sr-only")}>
                <CommandInput readOnly aria-labelledby={slotId ?? fieldName} />
              </div>
            )}
            {/* Keep native wheel scrolling in this portaled list from reaching a parent dialog's document scroll lock. */}
            <CommandList id={listId} onWheel={(event) => event.stopPropagation()}>
              <ComboboxOptionsList
                groupedOptions={groupedOptions}
                showGroup={showGroup}
                showStatus={showStatus}
                showIcon={showIcon}
                currentValue={currentValue}
                onSelectHandler={(selectedValue) =>
                  onOptionsChangeHandler(selectedValue, currentValue, onChangeHandler)
                }
                isSelected={isSelected}
                iconName={iconName}
              />
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {renderChips?.(currentValue, onChangeHandler)}
    </div>
  )
}

/**
 * Props for the IGRPCombobox component.
 * @see IGRPCombobox
 */
interface IGRPComboboxProps extends Omit<IGRPInputProps, "onChange"> {
  /**
   * Single or multiple selection.
   * @deprecated `"multiple"` — use `IGRPMultiSelect`, whose value is always a `string[]`.
   * Removed at 0.1.0 stable (see `docs/adr/0001-multi-select-separate-from-combobox.md`).
   */
  variant?: "single" | "multiple"
  /** Options to display. */
  options: IGRPOptionsProps[]
  /** Selected value(s). */
  value?: string | string[]
  /** Called when selection changes. */
  onChange?: (selected: string | string[]) => void
  /** CSS classes for the wrapper. */
  className?: string
  /** Placeholder when nothing selected. */
  placeholder?: string
  /** Disable the combobox. */
  disabled?: boolean
  /** Whether the field is required. */
  required?: boolean
  /** CSS classes for the select trigger. */
  selectClassName?: string
  /** CSS classes for the label. */
  labelClassName?: string
  /** Text when no items found. */
  selectLabel?: string
  /** Validation error message. */
  errorText?: string
  /** Show search input. */
  showSearch?: boolean
  /** Search input placeholder. */
  searchText?: string
  /** Group options. */
  showGroup?: boolean
  /** Show status indicator. */
  showStatus?: boolean
  /** Show icon in options. */
  showIcon?: boolean
  /** Input id. */
  id?: string
}

let warnedMultipleDeprecated = false

/**
 * Combobox with search and single/multiple selection. Integrates with react-hook-form.
 */
function IGRPCombobox({
  variant = "single",
  options,
  value,
  onChange,
  placeholder: placeholderProp,
  className,
  disabled = false,
  label,
  required = false,
  name,
  id,
  selectClassName,
  labelClassName,
  errorText,
  helperText,
  selectLabel,
  showSearch = true,
  searchText,
  showGroup,
  showStatus,
  showIcon = false,
  iconName = "CornerDownRight",
}: IGRPComboboxProps) {
  const i18n = useIGRPi18n()
  const placeholder = placeholderProp ?? i18n.combobox.placeholder
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const listId = useId()

  const formContext = useFormContext()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || variant !== "multiple" || warnedMultipleDeprecated) return
    warnedMultipleDeprecated = true
    console.warn(
      'IGRPCombobox: variant="multiple" is deprecated and will be removed at 0.1.0 stable. Use IGRPMultiSelect instead.'
    )
  }, [variant])
  const [localValue, setLocalValue] = useState<string | string[]>(() => (variant === "single" ? "" : []))
  const displayValue = value !== undefined ? value : localValue

  const setSelectValue = (currentValue: string | string[]) => {
    if (variant === "single") {
      const selected = options?.find((opt) => opt.value === currentValue)
      const labelValue = selected?.label ?? placeholder
      const iconValue = selected?.icon ?? iconName

      return (
        <span
          className={cn("flex min-w-0 flex-1 items-center gap-2 overflow-hidden", selected?.color)}
          style={{ maxWidth: "100%" }}
        >
          {showStatus && selected?.status && (
            <IGRPCircleFull className={cn("shrink-0", igrpColorText(selected.status))} />
          )}
          {showStatus && selected?.statusLabel && <span className="sr-only">{selected?.statusLabel}: </span>}

          {showIcon && <IGRPIcon iconName={iconValue} className={cn("shrink-0")} />}

          <span className={cn("block min-w-0 flex-1 truncate")}>{labelValue}</span>
        </span>
      )
    }

    if (!Array.isArray(currentValue) || currentValue.length === 0) {
      return placeholder
    }

    return (
      <span className={cn("block min-w-0 flex-1 truncate")}>
        {currentValue.map((val) => options?.find((opt) => opt.value === val)?.label ?? val).join(", ")}
      </span>
    )
  }

  const renderChips = (currentValue: string | string[], onChangeHandler?: (value: string | string[]) => void) => {
    if (variant === "single" || !Array.isArray(currentValue) || currentValue.length === 0) return null

    const removeValue = (valueToRemove: string) => {
      const currentValues = currentValue as string[]
      const updatedValues = currentValues.filter((val) => val !== valueToRemove)

      if (!formContext && !onChangeHandler) {
        setLocalValue(updatedValues)
      }
      if (onChangeHandler) {
        onChangeHandler(updatedValues)
      } else {
        onChange?.(updatedValues)
      }
    }

    // The clicked chip unmounts, which would drop focus to <body>: hand it to the next chip,
    // else the previous one, else the trigger.
    const moveFocusFrom = (button: HTMLElement) => {
      const chips = button.closest<HTMLElement>("[data-slot=combobox-chips]")
      const buttons = Array.from(chips?.querySelectorAll<HTMLElement>("button") ?? [])
      const i = buttons.indexOf(button)
      const target =
        buttons[i + 1] ?? buttons[i - 1] ?? chips?.parentElement?.querySelector<HTMLElement>('[role="combobox"]')
      target?.focus()
    }

    return (
      <div data-slot="combobox-chips" className={cn("mt-2 flex flex-wrap gap-1")}>
        {currentValue.map((val) => {
          const selected = options?.find((opt) => opt.value === val)
          if (!selected) return null

          return (
            <span key={val} className={cn("flex items-center gap-1 rounded-md bg-muted px-2 py-1")}>
              {showStatus && selected.status && <IGRPCircleFull className={igrpColorText(selected.status)} />}
              {showStatus && selected.statusLabel && <span className="sr-only">{selected.statusLabel}: </span>}

              {showIcon && <IGRPIcon iconName={selected.icon ?? iconName} />}

              <span className={selected.color}>{selected.label}</span>

              <IGRPButton
                className={cn("ml-1 size-5 rounded-full text-muted-foreground hover:text-destructive")}
                onClick={(e) => {
                  moveFocusFrom(e.currentTarget)
                  removeValue(val)
                }}
                disabled={disabled}
                aria-label={i18n.multiSelect.removeChip.replace("{label}", selected.label)}
                iconName="X"
                size="icon"
                showIcon
                variant="outline"
              />
            </span>
          )
        })}
      </div>
    )
  }

  const isSelected = (optValue: string, currentValue: string | string[]) => {
    if (variant === "single") return currentValue === optValue

    return Array.isArray(currentValue) && currentValue.includes(optValue)
  }

  const groupedOptions = useMemo(() => {
    if (!showGroup) return { Options: options }

    return options.reduce<Record<string, IGRPOptionsProps[]>>((acc, option) => {
      const groupName = option.group || i18n.combobox.otherGroup
      if (!acc[groupName]) {
        acc[groupName] = []
      }
      acc[groupName].push(option)
      return acc
    }, {})
  }, [showGroup, options, i18n.combobox.otherGroup])

  const onOptionsChangeHandler = (
    selectedValue: string,
    currentValue: string | string[],
    onChangeHandler: (value: string | string[]) => void
  ) => {
    if (variant === "single") {
      const newValue = selectedValue === currentValue ? "" : selectedValue
      onChangeHandler(newValue)
      setOpen(false)
    } else {
      const currentValues = Array.isArray(currentValue) ? currentValue : []
      const updatedValues = currentValues.includes(selectedValue)
        ? currentValues.filter((val) => val !== selectedValue)
        : [...currentValues, selectedValue]
      onChangeHandler(updatedValues)
    }
  }

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        errorText={errorText}
        className={className}
        required={required}
        control={formContext.control}
      >
        {(field) => (
          <ComboboxField
            fieldName={fieldName}
            listId={listId}
            open={open}
            setOpen={setOpen}
            currentValue={field.value}
            onChangeHandler={(val) => {
              field.onChange(val)
              onChange?.(val)
            }}
            setSelectValue={setSelectValue}
            groupedOptions={groupedOptions}
            showGroup={showGroup}
            showStatus={showStatus}
            showIcon={showIcon}
            showSearch={showSearch}
            searchText={searchText}
            selectLabel={selectLabel}
            selectClassName={selectClassName}
            disabled={disabled}
            className={className}
            onOptionsChangeHandler={onOptionsChangeHandler}
            isSelected={isSelected}
            onClose={field.onBlur}
            triggerRef={field.ref}
            iconName={iconName}
            renderChips={renderChips}
          />
        )}
      </IGRPFormField>
    )
  }

  return (
    <Field className={cn("w-full max-w-full min-w-0")}>
      {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}

      <ComboboxField
        fieldName={fieldName}
        listId={listId}
        open={open}
        setOpen={setOpen}
        currentValue={displayValue}
        onChangeHandler={(newValue) => {
          if (value === undefined) setLocalValue(newValue)
          onChange?.(newValue)
        }}
        setSelectValue={setSelectValue}
        groupedOptions={groupedOptions}
        showGroup={showGroup}
        showStatus={showStatus}
        showIcon={showIcon}
        showSearch={showSearch}
        searchText={searchText}
        selectLabel={selectLabel}
        selectClassName={selectClassName}
        disabled={disabled}
        className={className}
        onOptionsChangeHandler={onOptionsChangeHandler}
        isSelected={isSelected}
        iconName={iconName}
        renderChips={renderChips}
        aria-invalid={!!errorText}
        aria-describedby={errorText ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
        aria-required={required}
      />

      <IGRPFieldDescription id={fieldName} error={errorText} helperText={helperText} />
    </Field>
  )
}

export { IGRPCombobox, type IGRPComboboxProps }

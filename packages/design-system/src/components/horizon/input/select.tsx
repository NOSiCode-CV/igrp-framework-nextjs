"use client"

import { useId, useReducer, useMemo, useCallback, memo, Fragment, type SetStateAction, type Dispatch } from "react"
import Image from "next/image"
import { useFormContext } from "react-hook-form"
import { Circle } from "lucide-react"

import { igrpColorText } from "../../../lib/colors"
import { cn } from "../cn"
import type { IGRPInputProps, IGRPOptionsProps } from "../../../types"
import {
  useFormField,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../primitives/form"
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
import { IGRPButton } from "../button"
import { IGRPIcon } from "../icon"
import { IGRPLabel } from "../label"
import { Field, FieldDescription } from "../../primitives/field"
import { useIGRPi18n } from "../../../i18n"

type SelectState = {
  selected: string
  search: string
  isOpen: boolean
}

type SelectAction =
  | { type: "SET_SELECTED"; payload: string }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_OPEN"; payload: boolean }
  | { type: "RESET_SEARCH" }

function selectReducer(state: SelectState, action: SelectAction): SelectState {
  switch (action.type) {
    case "SET_SELECTED":
      return { ...state, selected: action.payload }
    case "SET_SEARCH":
      return { ...state, search: action.payload }
    case "SET_OPEN":
      return { ...state, isOpen: action.payload }
    case "RESET_SEARCH":
      return { ...state, search: "" }
    default:
      return state
  }
}

/**
 * Props for the IGRPSelect component.
 * @see IGRPSelect
 */
type IGRPSelectProps = Omit<
  React.ComponentProps<typeof Select>,
  "value" | "defaultValue" | "onValueChange" | "children"
> &
  Omit<IGRPInputProps, "autoComplete" | "defaultValue" | "dir" | "value"> & {
    options: IGRPOptionsProps[]
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    placeholder?: string
    className?: string
    showSearch?: boolean
    required?: boolean
    error?: string
    showStatus?: boolean
    selectClassName?: string
    showGroup?: boolean
    id?: string
    label?: string
    labelClassName?: string
    helperText?: string
  }

/** @internal Select field with trigger and content. */
function IGRPSelectField({
  value,
  onChange,
  onOpenChange,
  disabled,
  options,
  placeholder,
  isOpen,
  label,
  showSearch,
  search,
  setSearch,
  onResetSearch,
  filteredOptions,
  showStatus,
  showGroup,
  className,
  triggerId,
  triggerAriaLabelledby,
  triggerAriaInvalid,
  triggerAriaDescribedBy,
  ...selectProps
}: {
  value: string
  onChange: (val: string) => void
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  options: IGRPOptionsProps[]
  placeholder: string
  isOpen: boolean
  label: string
  showSearch: boolean
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  onResetSearch: () => void
  filteredOptions: IGRPOptionsProps[]
  showStatus: boolean
  showGroup: boolean
  className?: string
  triggerId?: string
  triggerAriaLabelledby?: string
  triggerAriaInvalid?: boolean
  triggerAriaDescribedBy?: string
} & Omit<React.ComponentProps<typeof Select>, "value" | "onValueChange" | "onOpenChange" | "children">) {
  return (
    <Select value={value} onValueChange={onChange} onOpenChange={onOpenChange} disabled={disabled} {...selectProps}>
      <IGRPSelectTrigger
        className={className}
        showStatus={showStatus}
        value={value}
        options={options}
        placeholder={placeholder}
        isOpen={isOpen}
        label={label}
        triggerId={triggerId}
        triggerAriaLabelledby={triggerAriaLabelledby}
        triggerAriaInvalid={triggerAriaInvalid}
        triggerAriaDescribedBy={triggerAriaDescribedBy}
      />
      <IGRPSelectContent
        showSearch={showSearch}
        search={search}
        setSearch={setSearch}
        onResetSearch={onResetSearch}
        filteredOptions={filteredOptions}
        showStatus={showStatus}
        showGroup={showGroup}
      />
    </Select>
  )
}

/**
 * @internal Wrapper rendered inside FormItem that reads the form context to wire
 * aria-invalid / aria-describedby onto the actual SelectTrigger button.
 */
function IGRPSelectFieldWithA11y(props: React.ComponentProps<typeof IGRPSelectField>) {
  const { error, formItemId, formMessageId } = useFormField()
  return (
    <IGRPSelectField
      {...props}
      triggerId={formItemId}
      triggerAriaInvalid={!!error}
      triggerAriaDescribedBy={error ? formMessageId : undefined}
    />
  )
}

/**
 * Select dropdown with optional search and grouped options. Integrates with react-hook-form.
 */
function IGRPSelect({
  options,
  placeholder = "Select an option",
  className,
  showSearch = false,
  name,
  id,
  required,
  disabled,
  error,
  helperText,
  showStatus = false,
  value,
  onValueChange,
  label = "Select an option",
  labelClassName,
  showGroup = false,
  ...props
}: IGRPSelectProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()

  const [state, dispatch] = useReducer(selectReducer, {
    selected: value || "",
    search: "",
    isOpen: false,
  })

  // `value` is a controlled prop, so the reducer's copy is only the uncontrolled
  // fallback. Reading the reducer unconditionally made `value` write-once: it
  // seeded the initial state and every later change was ignored.
  const selectedValue = value !== undefined ? value : state.selected

  const optionsMap = useMemo(() => new Map(options.map((opt) => [opt.value, opt])), [options])

  const normalizedSearch = state.search.trim().toLowerCase()
  const filteredOptions = useMemo(
    () => options.filter(({ label }) => label.toLowerCase().includes(normalizedSearch)),
    [options, normalizedSearch]
  )

  /**
   * Resolves a value to its option label.
   *
   * In form mode the caller passes `field.value` straight from the render prop.
   * This used to read `formContext.getValues(fieldName)` inside a `useMemo` that
   * did not depend on the form value — `getValues` is not reactive, so
   * `setValue()` moved the form on while the trigger kept the old label.
   */
  const labelFor = useCallback((val: string) => (val ? optionsMap.get(val)?.label || val : ""), [optionsMap])

  const selectedLabel = labelFor(selectedValue)

  const handleChange = useCallback(
    (val: string) => {
      if (val !== state.selected) {
        dispatch({ type: "SET_SELECTED", payload: val })
      }
      if (val !== selectedValue) {
        onValueChange?.(val)
      }
    },
    [state.selected, selectedValue, onValueChange]
  )

  const selectFieldProps = {
    onOpenChange: (open: boolean) => dispatch({ type: "SET_OPEN", payload: open }),
    disabled,
    options,
    placeholder,
    isOpen: state.isOpen,
    label: selectedLabel,
    showSearch,
    search: state.search,
    setSearch: (val: SetStateAction<string>) =>
      dispatch({
        type: "SET_SEARCH",
        payload: typeof val === "function" ? (val as (prev: string) => string)(state.search) : val,
      }),
    onResetSearch: () => dispatch({ type: "RESET_SEARCH" }),
    filteredOptions,
    showStatus,
    showGroup,
    className,
    ...props,
  }

  if (!formContext) {
    return (
      <Field className={className} data-invalid={error ? true : undefined}>
        <IGRPLabel id={fieldName} className={labelClassName} required={required} label={label} />

        <div className={cn("relative")}>
          <IGRPSelectField {...selectFieldProps} value={selectedValue} onChange={handleChange} triggerId={fieldName} />
        </div>

        {helperText && !error && <FieldDescription>{helperText}</FieldDescription>}

        {error && (
          <p className={cn("mt-1 text-xs text-destructive")} role="alert">
            {error}
          </p>
        )}
      </Field>
    )
  }

  return (
    <FormField
      control={formContext.control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <FormItem className={cn(className)}>
          {label && (
            <FormLabel
              id={`${fieldName}-label`}
              className={cn(labelClassName, required && 'after:text-destructive after:content-["*"]')}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <IGRPSelectFieldWithA11y
              {...selectFieldProps}
              value={field.value ?? ""}
              label={labelFor(field.value ?? "")}
              onChange={(val) => {
                field.onChange(val)
                handleChange(val)
              }}
              triggerAriaLabelledby={label ? `${fieldName}-label` : undefined}
            />
          </FormControl>

          {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
          <FormMessage className={cn("text-xs")} />
        </FormItem>
      )}
    />
  )
}

const IGRPSelectSearch = memo(
  ({
    search,
    setSearch,
    onResetSearch,
  }: {
    search: string
    setSearch: Dispatch<SetStateAction<string>>
    onResetSearch: () => void
  }) => {
    const i18n = useIGRPi18n()

    /**
     * Radix Select runs a typeahead on printable keys and pulls focus back to the
     * matching item, so only the first character ever reached this input — the
     * rest moved the highlight instead. Swallow the keys that mean "typing" and
     * let navigation keys (Escape, Tab, Enter, arrows) bubble to Radix.
     */
    const stopTypeaheadKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const isNavigationKey =
        event.key === "Escape" ||
        event.key === "Tab" ||
        event.key === "Enter" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"

      if (!isNavigationKey) event.stopPropagation()
    }

    return (
      <div className={cn("mb-2 flex items-center gap-2 border-b pb-3")}>
        <div className={cn("relative flex-1")}>
          <IGRPIcon
            iconName="Search"
            className={cn("absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground")}
          />
          <Input
            type="text"
            className={cn("h-8 pl-7 text-sm")}
            placeholder={i18n.inputSelect.searchPlaceholder}
            aria-label={i18n.inputSelect.searchLabel}
            value={search}
            onChange={(e) => setSearch(e.target.value.trimStart())}
            onKeyDown={stopTypeaheadKeys}
          />
        </div>
        {search && (
          <IGRPButton
            onClick={onResetSearch}
            aria-label={i18n.inputSelect.clearSearch}
            variant="ghost"
            size="icon"
            className={cn("size-8 p-0")}
            iconName="X"
          />
        )}
      </div>
    )
  }
)

const IGRPSelectItem = memo(({ item, showStatus }: { item: IGRPOptionsProps; showStatus: boolean }) => (
  <SelectItem value={String(item.value)} className={cn("flex items-center gap-2 truncate")}>
    <div className={cn("flex w-full items-center gap-2")}>
      {showStatus && <Circle className={cn("size-2 fill-current", igrpColorText(item.status || "primary"))} />}
      {item.image && (
        <Image
          className={cn("size-5 rounded")}
          src={item.image || "/placeholder.svg"}
          // Decorative: item.label is rendered as text immediately after this.
          alt=""
          width={20}
          height={20}
        />
      )}
      <div className={cn("flex flex-col")}>
        <span>{item.label}</span>
        {item.description && <span className={cn("text-xs text-muted-foreground")}>{item.description}</span>}
      </div>
    </div>
  </SelectItem>
))

const IGRPSelectContent = memo(
  ({
    showSearch,
    search,
    setSearch,
    onResetSearch,
    filteredOptions,
    showStatus,
    showGroup,
  }: {
    showSearch: boolean
    search: string
    setSearch: Dispatch<SetStateAction<string>>
    onResetSearch: () => void
    filteredOptions: IGRPOptionsProps[]
    showStatus: boolean
    showGroup: boolean
  }) => {
    const groups = useMemo(
      () => Array.from(new Set(filteredOptions.map((opt) => opt.group).filter(Boolean))),
      [filteredOptions]
    )

    return (
      <SelectContent className={cn("max-h-[300px] overflow-y-auto")}>
        {showSearch && <IGRPSelectSearch search={search} setSearch={setSearch} onResetSearch={onResetSearch} />}
        {showGroup && groups.length > 0
          ? groups.map((group) => (
              <Fragment key={group}>
                <SelectGroup>
                  <SelectLabel className={cn("px-2 text-xs text-muted-foreground")}>{group}</SelectLabel>
                  {filteredOptions
                    .filter((opt) => opt.group === group)
                    .map((opt) => (
                      <IGRPSelectItem key={opt.value} item={opt} showStatus={showStatus} />
                    ))}
                </SelectGroup>
              </Fragment>
            ))
          : filteredOptions.map((opt) => <IGRPSelectItem key={opt.value} item={opt} showStatus={showStatus} />)}
      </SelectContent>
    )
  }
)

const IGRPSelectTrigger = ({
  value,
  options,
  placeholder,
  showStatus,
  label,
  className,
  triggerId,
  triggerAriaLabelledby,
  triggerAriaInvalid,
  triggerAriaDescribedBy,
}: {
  value: string
  options: IGRPOptionsProps[]
  placeholder: string
  showStatus: boolean
  label: string
  isOpen: boolean
  className?: string
  triggerId?: string
  triggerAriaLabelledby?: string
  triggerAriaInvalid?: boolean
  triggerAriaDescribedBy?: string
}) => (
  <SelectTrigger
    id={triggerId}
    aria-labelledby={triggerAriaLabelledby}
    aria-invalid={triggerAriaInvalid || undefined}
    aria-describedby={triggerAriaDescribedBy}
    className={cn("w-full", className)}
  >
    <SelectValue placeholder={placeholder} className={cn("w-full")}>
      <div className={cn("flex w-full items-center gap-2 truncate")}>
        {showStatus && (
          <Circle
            className={cn(
              "size-2 fill-current",
              igrpColorText(options.find((o) => o.value === value)?.status || "primary")
            )}
          />
        )}
        {label}
      </div>
    </SelectValue>
  </SelectTrigger>
)

export { IGRPSelect, type IGRPSelectProps }

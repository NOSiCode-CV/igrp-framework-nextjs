"use client"

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { useFormContext } from "react-hook-form"
import type { VariantProps } from "class-variance-authority"

import { cn } from "../cn.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import { type IGRPInputProps } from "../../../types.js"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../primitives/input-group.js"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../primitives/form.js"
import { IGRPButton } from "../button.js"
import { IGRPFieldDescription } from "../field-description.js"
import { IGRPIcon, type IGRPIconName } from "../icon/index.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldError } from "../../primitives/field.js"

/**
 * Props for the IGRPInputSearch component.
 * @see IGRPInputSearch
 */
interface IGRPInputSearchProps extends Omit<IGRPInputProps, "value" | "defaultValue"> {
  /** Controlled search value. */
  value?: string
  /** Default search value. */
  defaultValue?: string
  /** Called on search (with optional debounce). */
  onSearch?: (value: string) => void
  /** Called when input value changes. */
  setValueChange?: (value: string) => void
  /** Show icon at start of input. */
  showStartIcon?: boolean
  /** Icon name for start icon. */
  startIcon?: IGRPIconName | string
  /** Show submit button. */
  showSubmitButton?: boolean
  /** Icon for submit button. */
  submitIcon?: IGRPIconName | string
  /** Label for submit button. */
  submitButtonLabel?: string
  /** CSS classes for submit button. */
  submitButtonClassName?: string
  /** Enable debounce for onSearch. */
  isDebounce?: boolean
  /** Debounce delay in ms. */
  debounceMs?: number
  /** Submit button variant. */
  submitVariant?: VariantProps<typeof IGRPButton>["variant"]
  /** Show loading state. */
  loading?: boolean
}

/**
 * @internal Wraps the supplied input element with the start-icon and submit-button decorations.
 * The caller owns the input element so it can optionally be wrapped in `<FormControl>` for proper
 * label↔input id forwarding under form context.
 */
function SearchInputDecoration({
  inputNode,
  showStartIcon,
  startIcon,
  showSubmitButton,
  submitButtonClassName,
  submitButtonLabel,
  submitIcon,
  submitVariant,
  loading,
  onSearch,
  value,
  iconPlacement,
  showIcon,
  disabled,
}: {
  inputNode: ReactNode
  showStartIcon: boolean
  startIcon: IGRPIconName | string
  showSubmitButton: boolean
  submitButtonClassName?: string
  submitButtonLabel?: string
  submitIcon: IGRPIconName | string
  submitVariant: VariantProps<typeof IGRPButton>["variant"]
  loading?: boolean
  onSearch?: (value: string) => void
  value: string
  iconPlacement?: IGRPInputProps["iconPlacement"]
  showIcon?: boolean
  disabled?: boolean
}) {
  return (
    <InputGroup>
      {showStartIcon && (
        <InputGroupAddon align="inline-start">
          <IGRPIcon iconName={startIcon} aria-hidden="true" />
        </InputGroupAddon>
      )}

      {inputNode}

      {showSubmitButton && (
        <InputGroupAddon align="inline-end">
          <IGRPButton
            className={cn(submitButtonClassName)}
            aria-label={submitButtonLabel}
            type="button"
            onClick={() => onSearch?.(value)}
            disabled={disabled}
            showIcon={showIcon}
            iconName={submitIcon}
            variant={submitVariant}
            loading={loading}
            iconPlacement={iconPlacement}
          >
            {submitButtonLabel}
          </IGRPButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

/**
 * Trailing-edge debounce whose pending timer survives re-renders.
 *
 * The timer lives in a ref and the callback in another, so neither a re-render
 * nor a changing `onSearch` identity restarts the debounce or strands a timer.
 * A previous version built the debouncer during render, which gave every render
 * a fresh `timeout` binding — nothing was ever cancelled and `onSearch` fired
 * once per keystroke.
 */
function useDebouncedCallback(callback: ((value: string) => void) | undefined, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Synced in an effect rather than during render: the pending timer fires well
  // after commit, so it always sees the latest callback either way.
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    []
  )

  return useCallback(
    (value: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        callbackRef.current?.(value)
      }, delay)
    },
    [delay]
  )
}

/**
 * Search input with optional icon, submit button, and debounce. Integrates with react-hook-form.
 */
function IGRPInputSearch({
  name,
  id,
  label,
  helperText,
  className,
  required = false,
  error,
  value: controlledValue,
  defaultValue = "",
  onSearch,
  setValueChange,
  showStartIcon = true,
  startIcon = "Search",
  showSubmitButton = true,
  submitIcon = "ArrowRight",
  submitButtonLabel,
  submitButtonClassName,
  debounceMs = 2000,
  isDebounce = false,
  showIcon = true,
  iconPlacement,
  submitVariant = "ghost",
  loading,
  ...props
}: IGRPInputSearchProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

  const formContext = useFormContext()
  const [localValue, setLocalValue] = useState(controlledValue ?? defaultValue)
  const debouncedSearch = useDebouncedCallback(onSearch, debounceMs)
  const displayValue = controlledValue !== undefined ? controlledValue : localValue

  const handleInputChange = useCallback(
    (value: string) => {
      if (controlledValue === undefined) setLocalValue(value)
      setValueChange?.(value)
      if (isDebounce) debouncedSearch(value)
    },
    [controlledValue, debouncedSearch, isDebounce, setValueChange]
  )

  // InputGroup owns the border, focus ring, addon padding and aria-invalid
  // styling, so the control only carries caller overrides.
  const inputClassName = cn(className)

  const decorationProps = {
    showStartIcon,
    startIcon,
    showSubmitButton,
    submitButtonClassName,
    submitButtonLabel,
    submitIcon,
    submitVariant,
    loading,
    onSearch,
    iconPlacement,
    showIcon,
    disabled: props.disabled,
  }

  if (formContext) {
    return (
      <FormField
        control={formContext.control}
        name={fieldName}
        render={({ field, fieldState }) => (
          <FormItem className={className}>
            {label && (
              <FormLabel className={cn("gap-0.5", required && "after:text-destructive after:content-['*']")}>
                {label}
              </FormLabel>
            )}
            <SearchInputDecoration
              {...decorationProps}
              value={field.value ?? ""}
              inputNode={
                <FormControl>
                  <InputGroupInput
                    name={fieldName}
                    type="search"
                    required={required}
                    aria-required={required}
                    className={inputClassName}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      handleInputChange(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        onSearch?.(field.value ?? "")
                      }
                    }}
                    onBlur={field.onBlur}
                    disabled={props.disabled}
                    {...igrpOmitNonDomProps(props)}
                  />
                </FormControl>
              }
            />
            {helperText && !fieldState.error && !error && <FormDescription>{helperText}</FormDescription>}
            {error ? <FieldError>{error}</FieldError> : <FormMessage className={cn("text-xs")} />}
          </FormItem>
        )}
      />
    )
  }

  return (
    <Field className={className}>
      {label && <IGRPLabel label={label} required={required} id={fieldName} />}

      <SearchInputDecoration
        {...decorationProps}
        value={displayValue}
        inputNode={
          <InputGroupInput
            id={fieldName}
            name={fieldName}
            type="search"
            required={required}
            aria-required={required}
            aria-invalid={!!error || !!props["aria-invalid"]}
            aria-describedby={helperText || error ? `${fieldName}-helper` : undefined}
            className={inputClassName}
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onSearch?.(displayValue)
              }
            }}
            disabled={props.disabled}
            {...igrpOmitNonDomProps(props)}
          />
        }
      />

      <IGRPFieldDescription error={error} helperText={helperText} />
    </Field>
  )
}

export { IGRPInputSearch, type IGRPInputSearchProps }

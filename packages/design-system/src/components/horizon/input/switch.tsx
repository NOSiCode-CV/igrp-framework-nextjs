"use client"

import { useId } from "react"
import { useFormContext } from "react-hook-form"

import { cn } from "../cn.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import { igrpChainHandlers, igrpMergeRefs } from "../../../lib/form-binding.js"
import type { IGRPInputProps } from "../../../types.js"
import { Switch } from "../../primitives/switch.js"
import { IGRPFormField } from "../form/form-field.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"

/**
 * Props for the IGRPSwitch component.
 * @see IGRPSwitch
 */
interface IGRPSwitchProps extends React.ComponentProps<typeof Switch>, Pick<IGRPInputProps, "helperText" | "label"> {
  /** CSS classes for the label. */
  labelClassName?: string
  /** Validation error message. */
  error?: string
}

/**
 * Switch/toggle with label, helper text, and form integration.
 */
function IGRPSwitch({
  name,
  id,
  label,
  helperText,
  className,
  labelClassName,
  required,
  error,
  onCheckedChange,
  ...props
}: IGRPSwitchProps) {
  const _id = useId()
  const fielName = name ?? id ?? _id

  const formContext = useFormContext()

  if (!formContext) {
    return (
      <Field>
        <div className={cn("flex items-center gap-2")}>
          <Switch
            id={fielName}
            name={fielName}
            className={cn(className, error && "border-destructive focus-visible:ring-destructive/20")}
            onCheckedChange={onCheckedChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${fielName}-error` : helperText ? `${fielName}-helper` : undefined}
            {...igrpOmitNonDomProps(props)}
          />

          {label && (
            <IGRPLabel
              label={label}
              className={cn(labelClassName, error && "text-destructive")}
              required={required}
              id={fielName}
            />
          )}
        </div>

        {helperText && !error && <FieldDescription id={`${fielName}-helper`}>{helperText}</FieldDescription>}

        {error && <FieldError id={`${fielName}-error`}>{error}</FieldError>}
      </Field>
    )
  }

  // The field owns checked/onBlur/ref; the caller's copies never replace it
  // (see lib/form-binding.ts).
  const { checked: _checked, defaultChecked: _defaultChecked, onBlur, ref, ...callerProps } = igrpOmitNonDomProps(props)
  void _checked
  void _defaultChecked

  return (
    <IGRPFormField
      name={fielName}
      label={label}
      helperText={helperText}
      required={required}
      control={formContext.control}
      labelPlacement="end"
      isToggle
    >
      {(field, fieldState) => (
        <Switch
          name={fielName}
          required={required}
          className={cn(
            "bg-backsground",
            (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
          ref={igrpMergeRefs(field.ref, ref)}
          checked={field.value === true}
          onCheckedChange={(checked) => {
            field.onChange(checked)
            if (onCheckedChange) {
              onCheckedChange(checked)
            }
          }}
          onBlur={igrpChainHandlers(field.onBlur, onBlur)}
          aria-invalid={!!fieldState.error || !!error}
          {...callerProps}
        />
      )}
    </IGRPFormField>
  )
}

export { IGRPSwitch, type IGRPSwitchProps }

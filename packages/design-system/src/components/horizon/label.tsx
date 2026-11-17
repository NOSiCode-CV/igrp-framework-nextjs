"use client"

import { useId } from "react"

import { cn } from "cn"
import { useIGRPi18n } from "../../i18n/index.js"
import { Label } from "../primitives/label.js"

/**
 * Props for the IGRPLabel component.
 * @see IGRPLabel
 */
type IGRPLabelProps = React.ComponentProps<typeof Label> & {
  /** Label text. */
  label?: string
  /** Show required indicator (*). */
  required?: boolean
  /** HTML name attribute. */
  name?: string
  /** DOM id of the label element itself (`id` is the control it labels), for `aria-labelledby`. */
  labelId?: string
}

/**
 * Required indicator for a label: a visual asterisk hidden from assistive tech plus
 * visually hidden text, so every control the label names announces it is required.
 * The separating space is its own text node: name computation trims each element's text.
 * @internal
 */
function IGRPRequiredMark() {
  const i18n = useIGRPi18n()
  return (
    <>
      <span aria-hidden="true" className="text-destructive">
        *
      </span>{" "}
      <span className="sr-only">{i18n.form.required}</span>
    </>
  )
}

/**
 * Form label with optional required indicator.
 */
function IGRPLabel({ label, className, required = false, name, id, labelId, ...props }: IGRPLabelProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  if (!label) return null

  return (
    <Label id={labelId} htmlFor={ref} className={cn("gap-0.5", className)} {...props}>
      {label}
      {required && <IGRPRequiredMark />}
    </Label>
  )
}

export { IGRPLabel, IGRPRequiredMark, type IGRPLabelProps }

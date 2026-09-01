"use client"

import { useId } from "react"
import { useFormContext } from "react-hook-form"

import type { IGRPInputProps } from "../../../types"
import { Input } from "../../primitives/input"
import { IGRPFormField } from "../form/form-field"

/**
 * Hidden input for form values. Integrates with react-hook-form.
 */
function IGRPInputHidden({ name, id, required = false, ...props }: Omit<IGRPInputProps, "showIcon">) {
  const _id = useId()
  const ref = name ?? id ?? _id

  const formContext = useFormContext()

  if (!formContext) {
    return <Input id={ref} name={ref} required={required} type="hidden" {...props} />
  }

  return (
    <IGRPFormField name={ref} control={formContext.control}>
      {(field) => <Input id={ref} required={required} type="hidden" {...field} {...props} name={ref} />}
    </IGRPFormField>
  )
}

export { IGRPInputHidden }

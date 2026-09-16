"use client"

import { useId } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { igrpOmitNonDomProps } from "../../../lib/dom-props"
import type { IGRPInputProps } from "../../../types"

/**
 * Hidden input for form values. Integrates with react-hook-form.
 *
 * Renders the input and nothing else. It deliberately does **not** go through
 * `IGRPFormField`: that is a layout wrapper (an outer div, a `FormItem` flex
 * container and an inner flex row around the control). The input is
 * `display:none`, but those wrappers are not — inside a form laid out with
 * `gap-*` every hidden field used to consume a gap and leave a visible blank
 * band. `Controller` gives the same form wiring with no markup of its own.
 *
 * It also renders a bare `<input>` rather than the `Input` primitive. That
 * primitive's forty-odd sizing, border and focus utilities describe a visible
 * control and are inert on `display:none`; `data-slot="input"` is kept so
 * consumer selectors still match.
 */
function IGRPInputHidden({
  name,
  id,
  // `required` is not a valid attribute on `type="hidden"` — hidden inputs are
  // barred from constraint validation, so the browser ignores it and the only
  // effect is invalid markup. Accepted for API symmetry, never forwarded.
  required: _required,
  ...props
}: Omit<IGRPInputProps, "showIcon">) {
  void _required

  const _id = useId()
  const ref = name ?? id ?? _id
  // A hidden input renders nothing, so the label/icon/class props inherited from
  // IGRPInputProps have no meaning here. Drop them rather than let them through
  // to the DOM as attributes.
  const domProps = igrpOmitNonDomProps(props)

  const formContext = useFormContext()

  if (!formContext) {
    return <input data-slot="input" id={ref} name={ref} type="hidden" {...domProps} />
  }

  return (
    <Controller
      name={ref}
      control={formContext.control}
      render={({ field }) => (
        <input
          {...domProps}
          data-slot="input"
          id={ref}
          name={ref}
          type="hidden"
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          ref={field.ref}
        />
      )}
    />
  )
}

export { IGRPInputHidden }

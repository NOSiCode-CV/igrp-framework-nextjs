"use client"

import { useId } from "react"
import { Separator } from "../primitives/separator"

/**
 * Props for the IGRPSeparator component.
 * @see IGRPSeparator
 */
interface IGRPSeparatorProps extends React.ComponentProps<typeof Separator> {
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
}

/**
 * Horizontal or vertical separator line.
 */
function IGRPSeparator({ name, id, ...props }: IGRPSeparatorProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  return <Separator id={ref} {...props} />
}

export { IGRPSeparator }

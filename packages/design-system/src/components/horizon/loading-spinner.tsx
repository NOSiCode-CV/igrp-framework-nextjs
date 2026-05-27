"use client"

import { useId } from "react"

import { cn } from "../../lib/utils"
import { Spinner } from "../primitives/spinner"

/**
 * Props for the IGRPLoadingSpinner component.
 * @see IGRPLoadingSpinner
 */
interface IGRPLoadingSpinnerProps {
  /** CSS classes for the outer container (centers the spinner). */
  parentClassName?: string
  /** CSS classes for the spinner element. */
  className?: string
  /** HTML id attribute. */
  id?: string
  /** Accessible loading label announced to assistive tech. */
  label?: string
}

/**
 * Centered loading spinner for async states.
 * Announces its busy state via role="status" + aria-live.
 */
function IGRPLoadingSpinner({ parentClassName, className, id, label = "Loading…" }: IGRPLoadingSpinnerProps) {
  const _id = useId()
  const ref = id ?? _id

  return (
    <div
      className={cn("flex justify-center items-center h-64", parentClassName)}
      id={ref}
      role="status"
      aria-live="polite"
    >
      <Spinner className={cn("size-12 text-primary", className)} aria-label={undefined} />
      <span className={cn("sr-only")}>{label}</span>
    </div>
  )
}

export { IGRPLoadingSpinner, type IGRPLoadingSpinnerProps }

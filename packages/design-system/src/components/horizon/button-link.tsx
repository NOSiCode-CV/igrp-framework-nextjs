"use client"

import { useLinkStatus } from "next/link"

import { cn } from "cn"
import { igrpSpinnerSizeClassName } from "../../lib/button-size.js"
import { Spinner } from "../primitives/spinner.js"
import type { IGRPButtonProps } from "./button.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"

interface IGRPLinkPendingIconProps {
  /** Empty string, null or undefined means no icon; the spinner still shows while pending. */
  iconName?: IGRPIconName | string | null
  iconClassName?: string
  /** Sets data-icon="inline-start" | "inline-end" on whatever renders. Default "start". */
  iconPlacement?: "start" | "end"
  /** Button size, only to size the spinner. */
  size?: IGRPButtonProps["size"]
  /** Default true. */
  showPendingIndicator?: boolean
}

/**
 * Icon that becomes a spinner while the enclosing `next/link` navigation is pending.
 * Reports pending only when rendered inside a `next/link` `Link`; anywhere else it is always idle.
 */
function IGRPLinkPendingIcon({
  iconName,
  iconClassName,
  iconPlacement = "start",
  size,
  showPendingIndicator = true,
}: IGRPLinkPendingIconProps) {
  const { pending } = useLinkStatus()
  const dataIcon = iconPlacement === "end" ? "inline-end" : "inline-start"

  if (pending && showPendingIndicator) {
    return (
      <Spinner aria-hidden="true" data-icon={dataIcon} className={cn(igrpSpinnerSizeClassName(size), iconClassName)} />
    )
  }
  return iconName ? (
    <IGRPIcon iconName={iconName} data-icon={dataIcon} aria-hidden="true" className={iconClassName} />
  ) : null
}

export { IGRPLinkPendingIcon, type IGRPLinkPendingIconProps }

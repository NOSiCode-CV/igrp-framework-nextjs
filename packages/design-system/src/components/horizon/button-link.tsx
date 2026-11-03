"use client"

import Link, { useLinkStatus } from "next/link"
import type * as React from "react"

import { cn } from "cn"
import { igrpSpinnerSizeClassName, isIconOnlySize } from "../../lib/button-size.js"
import { igrpOmitNonDomProps } from "../../lib/dom-props.js"
import { Button } from "../primitives/button.js"
import { Spinner } from "../primitives/spinner.js"
import type { IGRPButtonProps } from "./button.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"
import { IGRPTooltip } from "./tooltip.js"

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

interface IGRPButtonLinkProps
  extends
    Omit<React.ComponentProps<typeof Link>, "href">,
    Pick<IGRPButtonProps, "variant" | "size" | "iconName" | "iconClassName" | "iconPlacement"> {
  href: string
  label?: string
  disabled?: boolean
  /** Default true. Set false for same-page anchors and external hrefs, where useLinkStatus never fires. */
  showPendingIndicator?: boolean
  /** Styles the button, which is the <a> when enabled. */
  className?: string
  /** Tooltip text. With an icon-only size, `label` is the tooltip when this is unset, and is never rendered as text. */
  tooltip?: string
  tooltipSide?: "top" | "right" | "bottom" | "left"
  tooltipAlign?: "start" | "center" | "end"
}

/** A button-shaped `next/link`; a real disabled <button> when `disabled`. */
function IGRPButtonLink({
  href,
  label,
  disabled = false,
  variant = "default",
  size,
  iconName,
  iconClassName,
  iconPlacement,
  showPendingIndicator = true,
  className,
  tooltip,
  tooltipSide,
  tooltipAlign,
  ...rest
}: IGRPButtonLinkProps) {
  const iconOnly = isIconOnlySize(size)
  const tooltipText = tooltip ?? (iconOnly ? label : undefined)
  const ariaLabel = iconOnly ? (rest["aria-label"] ?? label ?? tooltip) : undefined
  if (process.env.NODE_ENV !== "production" && iconOnly && !ariaLabel && !rest["aria-labelledby"]) {
    console.warn(`IGRPButtonLink: icon-only link (href="${href}") has no accessible name. Pass "label" or "tooltip".`)
  }
  const placement = iconPlacement === "end" ? "end" : "start" // "center" has no meaning beside a label
  const icon = (
    <IGRPLinkPendingIcon
      iconName={iconName}
      iconClassName={iconClassName}
      iconPlacement={placement}
      size={size}
      showPendingIndicator={showPendingIndicator}
    />
  )
  const content = (
    <>
      {placement === "start" && icon}
      {iconOnly ? undefined : label}
      {placement === "end" && icon}
    </>
  )

  // Disabled takes none of `rest`: no href/target/onClick reach the DOM.
  if (disabled) {
    return (
      <IGRPTooltip label={tooltipText} side={tooltipSide} align={tooltipAlign} disabled>
        <Button type="button" variant={variant} size={size} className={className} aria-label={ariaLabel} disabled>
          {content}
        </Button>
      </IGRPTooltip>
    )
  }
  return (
    <IGRPTooltip label={tooltipText} side={tooltipSide} align={tooltipAlign}>
      <Button asChild variant={variant} size={size} className={className}>
        <Link href={href} aria-label={ariaLabel} {...igrpOmitNonDomProps(rest)}>
          {content}
        </Link>
      </Button>
    </IGRPTooltip>
  )
}

export { IGRPLinkPendingIcon, IGRPButtonLink, type IGRPLinkPendingIconProps, type IGRPButtonLinkProps }

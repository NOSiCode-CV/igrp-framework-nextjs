"use client"

import Link, { useLinkStatus } from "next/link"
import type * as React from "react"

import { cn } from "cn"
import { igrpSpinnerSizeClassName } from "../../lib/button-size.js"
import { igrpOmitNonDomProps } from "../../lib/dom-props.js"
import { Button } from "../primitives/button.js"
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
  ...rest
}: IGRPButtonLinkProps) {
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
      {label}
      {placement === "end" && icon}
    </>
  )

  // Disabled takes none of `rest`: no href/target/onClick reach the DOM.
  if (disabled) {
    return (
      <Button type="button" variant={variant} size={size} className={className} disabled>
        {content}
      </Button>
    )
  }
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href} {...igrpOmitNonDomProps(rest)}>
        {content}
      </Link>
    </Button>
  )
}

export { IGRPLinkPendingIcon, IGRPButtonLink, type IGRPLinkPendingIconProps, type IGRPButtonLinkProps }

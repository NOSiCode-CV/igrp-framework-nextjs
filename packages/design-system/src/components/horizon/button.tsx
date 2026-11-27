"use client"

import * as React from "react"
import { useId, type ReactNode } from "react"
import type { VariantProps } from "class-variance-authority"

import { Button, buttonVariants } from "../primitives/button.js"
import { Spinner } from "../primitives/spinner.js"
import { IGRPIcon } from "./icon/index.js"
import { cn } from "cn"
import { igrpOmitNonDomProps } from "../../lib/dom-props.js"
import { igrpSpinnerSizeClassName, isIconOnlySize } from "../../lib/button-size.js"
import type { IGRPBaseAttributes } from "../../types.js"
import { useIGRPi18n } from "../../i18n/index.js"

/** @internal Props shared by every IGRPButton, whatever its size. */
interface IGRPButtonBaseProps
  extends
    Omit<React.ComponentProps<typeof Button>, "name">,
    VariantProps<typeof buttonVariants>,
    Omit<IGRPBaseAttributes, "iconSize"> {
  /** Button content. */
  children?: ReactNode
  /** Render as child component (Radix composition). */
  asChild?: boolean
  /** Show loading spinner and ignore clicks; the button stays focusable (`aria-disabled`). */
  loading?: boolean
  /** Accessible text shown during loading state. */
  loadingText?: string
  /**
   * @deprecated No longer has any effect — the icon is sized by `size`. Will be removed in the next release.
   */
  iconSize?: string | number
}

type IGRPIconOnlySize = "icon" | "icon-xs" | "icon-sm" | "icon-lg"

/**
 * Props for the IGRPButton component.
 * Extends button primitives with IGRP conventions: icons, loading state, and base attributes.
 * An icon-only size has no visible text, so it requires `aria-label` or `aria-labelledby` (WCAG 4.1.2).
 * @see IGRPButton
 */
type IGRPButtonProps =
  | (IGRPButtonBaseProps & { size: IGRPIconOnlySize } & (
        { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string }
      ))
  | (IGRPButtonBaseProps & { size?: Exclude<IGRPButtonBaseProps["size"], IGRPIconOnlySize> })

/**
 * Horizon button with optional icon, loading state, and IGRP attributes.
 * Integrates with form context when used inside IGRPForm.
 */
function IGRPButton({
  children,
  asChild = false,
  showIcon = false,
  iconName = "ArrowLeft",
  iconPlacement = "start",
  iconClassName,
  className,
  loading = false,
  loadingText,
  disabled,
  type = "button",
  name,
  id,
  ...props
}: IGRPButtonProps) {
  const i18n = useIGRPi18n()
  const _id = useId()
  const ref = name ?? id ?? _id
  const resolvedLoadingText = loadingText ?? i18n.button.loadingText

  const { size } = props

  const spinnerSizeClassName = igrpSpinnerSizeClassName(size)

  // Loading keeps the button focusable (aria-disabled, not native `disabled`, which
  // drops focus to <body>); cancelling the click also blocks implicit form submit.
  const loadingProps = loading && {
    "aria-disabled": true as const,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  }

  if (isIconOnlySize(size)) {
    const hasAccessibleName = Boolean(props["aria-label"] || props["aria-labelledby"])
    if (process.env.NODE_ENV !== "production" && !hasAccessibleName) {
      console.warn(
        `IGRPButton: icon-only button (iconName="${iconName}") has no accessible name. Pass an "aria-label".`
      )
    }

    return (
      <Button
        aria-label={!hasAccessibleName ? iconName : undefined}
        {...igrpOmitNonDomProps(props)}
        {...loadingProps}
        className={cn(loading && "cursor-wait opacity-50", className)}
        disabled={disabled}
        type={type}
        id={ref}
      >
        {loading ? (
          <>
            <Spinner className={cn(spinnerSizeClassName, iconClassName)} aria-hidden="true" />
            <span className="sr-only">{resolvedLoadingText}</span>
          </>
        ) : (
          <IGRPIcon iconName={iconName} className={iconClassName} aria-hidden="true" />
        )}
      </Button>
    )
  }

  // When asChild, Slot requires a single child — skip icon siblings entirely.
  if (asChild) {
    return (
      <Button
        {...igrpOmitNonDomProps(props)}
        asChild
        className={cn("relative", loading && "pointer-events-none cursor-wait", className)}
        disabled={disabled || loading}
        aria-disabled={disabled || loading || undefined}
        id={ref}
      >
        {children}
      </Button>
    )
  }

  return (
    <Button
      {...igrpOmitNonDomProps(props)}
      {...loadingProps}
      className={cn("relative", loading && "cursor-wait opacity-50", className)}
      disabled={disabled}
      type={type}
      id={ref}
    >
      {loading && iconPlacement === "start" ? (
        <Spinner data-icon="inline-start" className={cn(spinnerSizeClassName, iconClassName)} aria-hidden="true" />
      ) : (
        showIcon &&
        iconPlacement === "start" && (
          <IGRPIcon iconName={iconName} data-icon="inline-start" className={iconClassName} aria-hidden="true" />
        )
      )}

      {loading ? resolvedLoadingText : children}

      {!loading && showIcon && iconPlacement === "end" && (
        <IGRPIcon iconName={iconName} data-icon="inline-end" className={iconClassName} aria-hidden="true" />
      )}

      {loading && iconPlacement === "end" && (
        <Spinner data-icon="inline-end" className={cn(spinnerSizeClassName, iconClassName)} aria-hidden="true" />
      )}
    </Button>
  )
}

export { IGRPButton, type IGRPButtonProps }

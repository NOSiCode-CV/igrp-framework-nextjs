"use client"

import * as React from "react"
import { useId, type ReactNode } from "react"
import type { VariantProps } from "class-variance-authority"

import { Button, buttonVariants } from "../primitives/button"
import { Spinner } from "../primitives/spinner"
import { IGRPIcon } from "./icon"
import { cn } from "../../lib/utils"
import type { IGRPBaseAttributes } from "../../types"
import { useIGRPi18n } from "../../i18n"

/**
 * Props for the IGRPButton component.
 * Extends button primitives with IGRP conventions: icons, loading state, and base attributes.
 * @see IGRPButton
 */
interface IGRPButtonProps
  extends
    Omit<React.ComponentProps<typeof Button>, "name">,
    VariantProps<typeof buttonVariants>,
    Omit<IGRPBaseAttributes, "iconSize"> {
  /** Button content. */
  children?: ReactNode
  /** Render as child component (Radix composition). */
  asChild?: boolean
  /** Show loading spinner and disable interaction. */
  loading?: boolean
  /** Accessible text shown during loading state. */
  loadingText?: string
}

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

  // Icons are sized by the button primitive via `[&_svg:not([class*='size-'])]`.
  // Spinner ships a literal `size-4`, which defeats that guard — mirror the
  // primitive's three size overrides for it only.
  const spinnerSizeClassName = size === "xs" || size === "icon-xs" ? "size-3" : size === "sm" ? "size-3.5" : undefined

  if (size === "icon" || size === "icon-xs" || size === "icon-sm" || size === "icon-lg") {
    const hasAccessibleName = Boolean(props["aria-label"] || props["aria-labelledby"])
    if (process.env.NODE_ENV !== "production" && !hasAccessibleName) {
      console.warn(
        `IGRPButton: icon-only button (iconName="${iconName}") has no accessible name. Pass an "aria-label".`,
      )
    }

    return (
      <Button
        aria-label={!hasAccessibleName ? iconName : undefined}
        {...props}
        className={cn(loading && "cursor-wait", className)}
        disabled={disabled || loading}
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
        {...props}
        asChild
        className={cn("relative", loading && "cursor-wait pointer-events-none", className)}
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
      {...props}
      className={cn("relative", loading && "cursor-wait", className)}
      disabled={disabled || loading}
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

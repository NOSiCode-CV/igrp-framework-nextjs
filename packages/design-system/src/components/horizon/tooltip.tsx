"use client"

// The context is shared with the data-table wrappers; exporting it here avoids a one-symbol file.
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, type ReactElement, type ReactNode } from "react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../primitives/tooltip.js"

/** True inside an `IGRPTooltipProvider`. */
const IGRPTooltipContext = createContext(false)

/** Shares one tooltip delay across many `IGRPTooltip`s (e.g. a row of actions). */
function IGRPTooltipProvider({
  children,
  delayDuration = 200,
}: {
  children: ReactNode
  /** Tooltip delay in ms. */
  delayDuration?: number
}) {
  return (
    <IGRPTooltipContext.Provider value>
      <TooltipProvider delayDuration={delayDuration}>{children}</TooltipProvider>
    </IGRPTooltipContext.Provider>
  )
}

interface IGRPTooltipProps {
  /** Tooltip text. Empty or undefined renders `children` unchanged. */
  label?: string
  /** The trigger. May be disabled; the tooltip still opens. */
  children: ReactElement
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  /** Used only when no IGRPTooltipProvider is in scope. Default 0. */
  delayDuration?: number
  /** Classes for the tooltip content. */
  className?: string
  /**
   * Set when the trigger is disabled but the child element doesn't carry `disabled` itself,
   * e.g. a DialogTrigger wrapping a disabled button. Defaults to the child's own `disabled` prop.
   */
  disabled?: boolean
}

/**
 * Tooltip over any control. A disabled control emits no pointer or focus events, so the trigger
 * is a wrapper span, focusable only when the child is disabled.
 */
function IGRPTooltip({
  label,
  children,
  side = "top",
  align = "center",
  sideOffset = 6,
  delayDuration = 0,
  className,
  disabled: disabledProp,
}: IGRPTooltipProps) {
  const hasProvider = useContext(IGRPTooltipContext)

  if (!label) return children

  const disabled = Boolean(disabledProp ?? (children.props as { disabled?: boolean }).disabled)

  const tooltipNode = (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex"
          data-slot="tooltip-trigger-wrapper"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a disabled child can't take focus; the span stands in so keyboard users reach the tooltip
          tabIndex={disabled ? 0 : undefined}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} align={align} className={className} sideOffset={sideOffset}>
        {label}
      </TooltipContent>
    </Tooltip>
  )

  if (hasProvider) return tooltipNode

  return <IGRPTooltipProvider delayDuration={delayDuration}>{tooltipNode}</IGRPTooltipProvider>
}

export { IGRPTooltip, IGRPTooltipContext, IGRPTooltipProvider, type IGRPTooltipProps }

"use client"

import { use, useEffect, useRef, useState } from "react"

import { cn } from "cn"
import { useIGRPi18n } from "../../i18n/index.js"
import { Button } from "../primitives/button.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "../primitives/tooltip.js"
import { IGRPIcon } from "./icon/index.js"
import { IGRPTooltipContext, IGRPTooltipProvider } from "./tooltip.js"
import { useIGRPToast } from "./toaster.js"

/**
 * Props for the IGRPCopyTo component.
 * @see IGRPCopyTo
 */
interface IGRPCopyToProps {
  /** Text to copy to clipboard. */
  value: string
  /** Tooltip delay in ms. */
  tooltipDelayDuration?: number
  /** Toast duration in ms. */
  toastDuration?: number
  /** Message shown on successful copy. */
  successMessage?: string
  /** Message shown when copy fails. */
  errorMessage?: string
  /** Tooltip text before copy. */
  tooltipMessage?: string
  /** CSS classes for the trigger button. */
  triggerClassName?: string
  /** Called when copy succeeds. */
  onCopySuccess?: (value: string) => void
  /** Called when copy fails. */
  onCopyError?: (error: Error) => void
}

/**
 * Copy-to-clipboard button with tooltip and toast feedback.
 */
function IGRPCopyTo({
  value,
  tooltipDelayDuration = 700,
  toastDuration = 3500,
  successMessage: successMessageProp,
  errorMessage: errorMessageProp,
  tooltipMessage: tooltipMessageProp,
  triggerClassName,
  onCopySuccess,
  onCopyError,
}: IGRPCopyToProps) {
  const [copied, setCopied] = useState(false)
  const { igrpToast } = useIGRPToast()
  const hasProvider = use(IGRPTooltipContext)
  const i18n = useIGRPi18n()
  const successMessage = successMessageProp ?? i18n.copyTo.copied
  const errorMessage = errorMessageProp ?? i18n.copyTo.copyFailed
  const tooltipMessage = tooltipMessageProp ?? i18n.copyTo.clickToCopy
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function handleCopy() {
    if (copied) return
    if (!value) {
      igrpToast({
        type: "error",
        title: errorMessage,
        description: i18n.copyTo.nothingToCopy,
        duration: toastDuration,
      })
      return
    }

    const displayValue = value.length > 50 ? `${value.substring(0, 47)}…` : value

    try {
      await navigator.clipboard.writeText(value)

      setCopied(true)
      igrpToast({
        type: "success",
        title: successMessage,
        description: displayValue,
        duration: toastDuration,
      })

      if (onCopySuccess) onCopySuccess(value)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      let errorInstance: Error
      if (error instanceof Error) {
        errorInstance = error
      } else {
        errorInstance = new Error("An unknown error occurred")
      }

      igrpToast({
        type: "error",
        title: errorMessage,
        description: errorInstance.message,
        duration: toastDuration,
      })

      if (onCopyError) onCopyError(errorInstance)
    }
  }

  const tooltip = (
    <Tooltip delayDuration={tooltipDelayDuration}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7 disabled:opacity-100", triggerClassName)}
          onClick={handleCopy}
          aria-label={copied ? successMessage : tooltipMessage}
          // aria-disabled, not disabled: a disabled button drops keyboard focus to <body>.
          aria-disabled={copied || undefined}
        >
          <div
            className={cn(
              "transition-[transform,opacity] motion-reduce:transition-none",
              copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          >
            <IGRPIcon iconName="Check" className={cn("stroke-primary")} strokeWidth={2} />
          </div>
          <div
            className={cn(
              "absolute transition-[transform,opacity] motion-reduce:transition-none",
              copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
          >
            <IGRPIcon iconName="Copy" strokeWidth={2} className={cn("size-3")} />
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent className={cn("px-2 py-1 text-xs")}>{tooltipMessage}</TooltipContent>
    </Tooltip>
  )

  // Share an app-level provider when there is one; otherwise Radix needs this one.
  return hasProvider ? (
    tooltip
  ) : (
    <IGRPTooltipProvider delayDuration={tooltipDelayDuration}>{tooltip}</IGRPTooltipProvider>
  )
}

export { IGRPCopyTo, type IGRPCopyToProps }

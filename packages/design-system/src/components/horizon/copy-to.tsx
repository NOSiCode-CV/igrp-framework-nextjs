"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "cn"
import { useIGRPi18n } from "../../i18n/index.js"
import { Button } from "../primitives/button.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../primitives/tooltip.js"
import { IGRPIcon } from "./icon/index.js"
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
  successMessage = "Copiado para a área de transferência",
  errorMessage = "Não foi possível copiar para a área de transferência",
  tooltipMessage = "Clique para copiar",
  triggerClassName,
  onCopySuccess,
  onCopyError,
}: IGRPCopyToProps) {
  const [copied, setCopied] = useState(false)
  const { igrpToast } = useIGRPToast()
  const i18n = useIGRPi18n()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function handleCopy() {
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

  return (
    <TooltipProvider delayDuration={tooltipDelayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-7 disabled:opacity-100", triggerClassName)}
            onClick={handleCopy}
            aria-label={copied ? successMessage : tooltipMessage}
            disabled={copied}
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
    </TooltipProvider>
  )
}

export { IGRPCopyTo, type IGRPCopyToProps }

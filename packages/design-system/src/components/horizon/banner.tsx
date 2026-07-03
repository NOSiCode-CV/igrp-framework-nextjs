"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { cn } from "../../lib/utils"
import { Button } from "../primitives/button"

interface IGRPBannerProps {
  variant: "cookie" | "announcement"
  message: string
  learnMoreHref?: string
  learnMoreLabel?: string
  acceptLabel?: string
  declineLabel?: string
  onAccept?: () => void
  onDecline?: () => void
  onDismiss?: () => void
  className?: string
}

function IGRPBanner({
  variant,
  message,
  learnMoreHref,
  learnMoreLabel = "Learn more",
  acceptLabel = "Accept",
  declineLabel = "Decline",
  onAccept,
  onDecline,
  onDismiss,
  className,
}: IGRPBannerProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  if (variant === "cookie") {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t bg-background px-6 py-4 shadow-lg",
          "motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200",
          className,
        )}
      >
        <p className="min-w-0 text-sm text-foreground">{message}</p>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setVisible(false)
              onDecline?.()
            }}
          >
            {declineLabel}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setVisible(false)
              onAccept?.()
            }}
          >
            {acceptLabel}
          </Button>
        </div>
      </div>
    )
  }

  // announcement variant
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 bg-primary px-6 py-3 text-primary-foreground",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150",
        className,
      )}
    >
      <p className="text-sm">
        {message}
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="ml-2 underline underline-offset-4 hover:opacity-80 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            target="_blank"
            rel="noopener noreferrer"
          >
            {learnMoreLabel}
          </a>
        )}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => {
          setVisible(false)
          onDismiss?.()
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export { IGRPBanner, type IGRPBannerProps }

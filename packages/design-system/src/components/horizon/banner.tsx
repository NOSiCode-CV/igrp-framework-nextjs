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
          className,
        )}
      >
        <p className="text-sm text-foreground">{message}</p>
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
        className,
      )}
    >
      <p className="text-sm">
        {message}
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="ml-2 underline underline-offset-4 hover:opacity-80"
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
        className="shrink-0 opacity-70 hover:opacity-100"
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

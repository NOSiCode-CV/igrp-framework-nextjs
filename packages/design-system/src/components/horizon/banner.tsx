"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { cn } from "cn"
import { Button } from "../primitives/button.js"
import { useIGRPi18n } from "../../i18n/index.js"

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
  learnMoreLabel,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
  onDismiss,
  className,
}: IGRPBannerProps) {
  const i18n = useIGRPi18n()
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  if (variant === "cookie") {
    return (
      <div
        className={cn(
          "fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between gap-4 border-t bg-background px-6 py-4 shadow-lg",
          "motion-safe:animate-in motion-safe:duration-200 motion-safe:slide-in-from-bottom-2",
          className
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
            {declineLabel ?? i18n.banner.decline}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setVisible(false)
              onAccept?.()
            }}
          >
            {acceptLabel ?? i18n.banner.accept}
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
        "motion-safe:animate-in motion-safe:duration-150 motion-safe:fade-in",
        className
      )}
    >
      <p className="text-sm">
        {message}
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="ml-2 rounded-sm underline underline-offset-4 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none"
            target="_blank"
            rel="noopener noreferrer"
          >
            {learnMoreLabel ?? i18n.banner.learnMore}
          </a>
        )}
      </p>
      <button
        type="button"
        aria-label={i18n.banner.dismiss}
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
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

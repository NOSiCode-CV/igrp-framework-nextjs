"use client"

// IGRPNotificationVariants is the component's CVA object and part of the public API.
/* eslint-disable react-refresh/only-export-components */

import { cva, type VariantProps } from "class-variance-authority"
import { useId, useState } from "react"

import { cn } from "cn"
import { IGRPButton } from "./button.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"
import { useIGRPi18n } from "../../i18n/index.js"

const IGRPNotificationVariants = cva("z-50 rounded-md bg-background p-4 shadow-lg", {
  variants: {
    variant: {
      default: "text-foreground",
      error: "border-destructive/50 text-destructive",
      info: "border-info/50 text-info",
      success: "border-success/50 text-success",
      warning: "border-warning/50 text-warning",
    },
    border: {
      default: "border-0",
      colored: "border",
    },
  },
  defaultVariants: {
    variant: "default",
    border: "default",
  },
})

const typeIconMap: Record<NonNullable<IGRPNotificationProps["variant"]>, IGRPIconName> = {
  default: "RefreshCcw",
  error: "CircleAlert",
  info: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
}

/**
 * Props for the IGRPNotification component.
 * @see IGRPNotification
 */
type IGRPNotificationProps = {
  /** Additional CSS classes. */
  className?: string
  /** Whether to show the type icon. */
  showIcon?: boolean
  /** Notification content. */
  content?: React.ReactNode
  /** Whether to show the close button. */
  showClose?: boolean
  /** Custom icon name. */
  iconName?: IGRPIconName | string
  /** Whether to show the link. */
  showLink?: boolean
  /** Link label. */
  lableLink?: string
  /** Link URL. */
  actionLink?: string
  /** Custom action elements. */
  customActions?: React.ReactNode
  /** Called after the close button hides the notification. */
  onClose?: () => void
  /** HTML id attribute. */
  id?: string
} & VariantProps<typeof IGRPNotificationVariants>

/**
 * Notification banner with icon, content, optional link, and close button.
 */
function IGRPNotification({
  className,
  showIcon = true,
  content,
  showClose = false,
  iconName,
  showLink = false,
  lableLink,
  actionLink,
  border = "default",
  variant = "default",
  customActions,
  onClose,
  id,
}: IGRPNotificationProps) {
  const i18n = useIGRPi18n()
  const [dismissed, setDismissed] = useState(false)
  const _id = useId()
  const ref = id ?? _id

  const icon = iconName ?? typeIconMap[variant ?? "default"]

  const isAssertive = variant === "error" || variant === "warning"

  if (dismissed) return null

  return (
    <div
      role={isAssertive ? "alert" : "status"}
      aria-live={isAssertive ? "assertive" : "polite"}
      className={cn(
        IGRPNotificationVariants(),
        border === "colored" && IGRPNotificationVariants({ variant, border }),
        className
      )}
      id={ref}
    >
      <div className={cn("flex justify-between gap-3")}>
        <div className={cn("flex grow text-sm")}>
          {showIcon && (
            <IGRPIcon
              iconName={icon}
              className={cn(
                IGRPNotificationVariants({ variant, border: "default" }),
                "me-3 mt-0.5 inline-flex p-0 shadow-none"
              )}
            />
          )}
          <div>{content}</div>
        </div>
        <div className={cn("flex items-center gap-3")}>
          {showLink && (
            <a href={actionLink} className={cn("group cursor-pointer text-sm font-medium whitespace-nowrap")}>
              {lableLink}
              <IGRPIcon
                iconName="ArrowRight"
                className={cn("ms-1 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5")}
              />
            </a>
          )}

          {customActions && <>{customActions}</>}

          {showClose && (
            <IGRPButton
              variant="ghost"
              className={cn("group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent")}
              aria-label={i18n.notification.close}
              onClick={() => {
                setDismissed(true)
                onClose?.()
              }}
              iconName="X"
              showIcon={true}
              size="icon"
              iconClassName={cn("opacity-60 transition-opacity group-hover:opacity-100")}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export { IGRPNotification, type IGRPNotificationProps, IGRPNotificationVariants }

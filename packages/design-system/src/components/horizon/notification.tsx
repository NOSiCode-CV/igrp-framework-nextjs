"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { useId } from "react"

import { cn } from "../../lib/utils"
import { IGRPButton } from "./button"
import { IGRPIcon, type IGRPIconName } from "./icon"

const IGRPNotificationVariants = cva("bg-background z-50 rounded-md p-4 shadow-lg", {
  variants: {
    variant: {
      default: "text-foreground",
      error: "text-destructive border-destructive/50",
      info: "text-info border-info/50",
      success: "text-success border-success/50",
      warning: "text-warning border-warning/50",
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
  /** HTML id attribute. */
  id?: string
} & VariantProps<typeof IGRPNotificationVariants>

/**
 * Notification banner with icon, content, optional link, and close button.
 */
function IGRPNotification({
  className,
  showIcon = true,
  content = "We use cookies to improve your experience, and show personalized content.",
  showClose = false,
  iconName,
  showLink = false,
  lableLink,
  actionLink,
  border = "default",
  variant = "default",
  customActions,
  id,
}: IGRPNotificationProps) {
  const _id = useId()
  const ref = id ?? _id

  const icon = iconName ?? typeIconMap[variant ?? "default"]

  const isAssertive = variant === "error" || variant === "warning"

  return (
    <div
      role={isAssertive ? "alert" : "status"}
      aria-live={isAssertive ? "assertive" : "polite"}
      className={cn(
        IGRPNotificationVariants(),
        border === "colored" && IGRPNotificationVariants({ variant, border }),
        className,
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
                "me-3 inline-flex shadow-none p-0 mt-0.5",
              )}
            />
          )}
          <div>{content}</div>
        </div>
        <div className={cn("flex items-center gap-3")}>
          {showLink && (
            <a href={actionLink} className={cn("group text-sm font-medium whitespace-nowrap cursor-pointer")}>
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
              aria-label="Close notification"
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

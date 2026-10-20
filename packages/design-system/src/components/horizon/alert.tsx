"use client"

import { useId } from "react"

import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from "../../lib/colors.js"
import { igrpAlertIconMappings } from "../../lib/utilities.js"
import { cn } from "cn"
import type { IGRPBaseAttributes, IGRPPlacementProps } from "../../types.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"
import { IGRPLink } from "./typography/link.js"

/**
 * Props for the IGRPAlert component.
 * @see IGRPAlert
 */
interface IGRPAlertProps extends Pick<
  IGRPBaseAttributes,
  "showIcon" | "iconName" | "iconClassName" | "iconPlacement" | "label" | "name"
> {
  /** Alert style variant (e.g. 'solid', 'soft', 'outline'). */
  variant?: IGRPColorRole
  /** Color theme (e.g. 'primary', 'success', 'destructive'). */
  color?: IGRPColorVariants
  /** Alert content. */
  children: React.ReactNode
  /** Label for optional link. */
  linkLabel?: string
  /** URL for optional link. */
  linkUrl?: string
  /** Icon for optional link. */
  linkIcon?: IGRPIconName | string
  /** Whether to show the link. */
  showLink?: boolean
  /** Apply color to text. */
  textColored?: boolean
  /** Apply color to border. */
  borderColored?: boolean
  /** Apply color to background. */
  bgColored?: boolean
  /** Additional CSS classes. */
  className?: string
  /** Content alignment ('start' | 'center' | 'end'). */
  alignment?: IGRPPlacementProps
  /** HTML id attribute. */
  id?: string
}

/**
 * Alert component for notifications, warnings, and informational messages.
 * Supports optional link, icon, and color variants.
 */
function IGRPAlert({
  variant = "solid",
  color = "primary",
  showIcon = true,
  iconName,
  iconClassName,
  iconPlacement = "end",
  children,
  label = "link",
  linkUrl,
  linkIcon = "ArrowRight",
  showLink,
  textColored = true,
  borderColored = true,
  bgColored = true,
  className,
  name,
  id,
  alignment = "start",
}: IGRPAlertProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  const iconDefault = igrpAlertIconMappings[color]
  const colors = IGRPColors[variant][color]
  const alertIcon = iconName !== undefined ? iconName : iconDefault
  const alignmentClass =
    alignment === "start" ? "items-baseline" : alignment === "center" ? "items-center" : "items-end"

  const isAssertive = color === "destructive"

  return (
    <div
      role={isAssertive ? "alert" : "status"}
      aria-live={isAssertive ? "assertive" : "polite"}
      className={cn(
        "rounded-md border px-4 py-3",
        // colors.alert already pairs each solid fill with its own *-foreground token;
        // overriding it with the page background breaks contrast on light fills.
        colors.alert,
        !borderColored && "border-transparent",
        !bgColored && "bg-transparent",
        className
      )}
      id={ref}
    >
      <div className={cn("flex gap-3", alignmentClass)}>
        {showIcon && (
          <IGRPIcon
            iconName={alertIcon}
            className={cn("size-5 shrink-0", textColored ? colors.text : undefined, iconClassName)}
          />
        )}

        <div className="flex grow justify-between gap-3">
          <div className="flex grow flex-col gap-1">{children}</div>

          {showLink && (
            <IGRPLink
              iconName={linkIcon}
              iconPlacement={iconPlacement}
              href={linkUrl}
              showIcon
              className={colors.alert}
            >
              {label}
            </IGRPLink>
          )}
        </div>
      </div>
    </div>
  )
}

export { IGRPAlert, type IGRPAlertProps }

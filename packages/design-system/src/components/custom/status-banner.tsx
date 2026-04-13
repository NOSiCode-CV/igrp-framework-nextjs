import { useId } from "react"

import type { IGRPColorRole, IGRPColorVariants } from "../../lib/colors"
import { cn } from "../../lib/utils"
import { IGRPAlert } from "../horizon/alert"
import { IGRPBadge } from "../horizon/badge"

/**
 * Props for the IGRPStatusBanner component.
 * @see IGRPStatusBanner
 */
interface IGRPStatusBannerProps {
  /** Alert style variant (e.g. 'soft', 'solid', 'outline'). */
  variant?: IGRPColorRole
  /** Alert color theme (e.g. 'success', 'primary', 'destructive'). */
  color?: IGRPColorVariants
  /** Main status text displayed in the banner. */
  text?: string
  /** Badge style variant. */
  badgeVariant?: IGRPColorRole
  /** Badge color theme. */
  badgeColor?: IGRPColorVariants
  /** Text displayed in the badge. */
  badgeText?: string
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Status banner combining an alert with a badge for displaying status information.
 * Uses IGRPAlert and IGRPBadge internally.
 */

function IGRPStatusBanner({
  variant = "soft",
  color = "success",
  text = "Insert our Text here",
  badgeVariant = "outline",
  badgeColor = "primary",
  badgeText = "Badge Text",
  name,
  id,
  className,
}: IGRPStatusBannerProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  return (
    <IGRPAlert
      variant={variant}
      color={color}
      iconName="Circle"
      iconClassName={cn("h-3 w-3 fill-current")}
      className={cn("p-4 rounded-lg items-center", className)}
      alignment="center"
      name={ref}
    >
      <span className={cn("font-medium")}>{text}</span>
      <IGRPBadge variant={badgeVariant} color={badgeColor} badgeClassName={cn("ml-4 font-normal")}>
        {badgeText}
      </IGRPBadge>
    </IGRPAlert>
  )
}

export { IGRPStatusBanner, type IGRPStatusBannerProps }

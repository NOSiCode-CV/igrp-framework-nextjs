"use client"

/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from "class-variance-authority"
import { useId } from "react"

import { type IGRPColorRole, IGRPColors, type IGRPColorVariants } from "../../lib/colors"
import { cn } from "cn"
import { igrpOmitNonDomProps } from "../../lib/dom-props"
import { type IGRPBaseAttributes } from "../../types"
import { IGRPIcon } from "./icon"

const igrpBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-3 py-0.5 text-xs font-medium whitespace-nowrap shadow-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      size: {
        sm: "text-xs [&>svg]:size-2.5",
        md: "text-sm [&>svg]:size-3",
        lg: "text-md [&>svg]:size-3.5",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
)

/**
 * Props for the IGRPBadge component.
 * @see IGRPBadge
 */
interface IGRPBadgeProps
  extends
    Omit<IGRPBaseAttributes, "helperText">,
    Omit<React.ComponentProps<"div">, "color">,
    VariantProps<typeof igrpBadgeVariants> {
  /** Show a colored dot indicator. */
  dot?: boolean
  /** Badge style variant (e.g. 'solid', 'soft', 'outline'). */
  variant?: IGRPColorRole
  /** Color theme (e.g. 'primary', 'success', 'destructive'). */
  color?: IGRPColorVariants
  /** Additional CSS classes for the badge. */
  badgeClassName?: string
}

/**
 * Badge for labels, status indicators, and counts.
 * Supports icon, dot indicator, and size variants.
 */
function IGRPBadge({
  dot = false,
  variant = "solid",
  color = "primary",
  badgeClassName,
  size,
  showIcon = false,
  iconName = "Info",
  iconPlacement = "start",
  children,
  className,
  name,
  id,
  ...props
}: IGRPBadgeProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  const colorClasses = IGRPColors[variant][color]
  const isIconOnly = (!children || children === "") && (showIcon || iconName)
  const isNumberOnly = typeof children === "number" && !showIcon && !iconName && !dot
  const isCircular = isIconOnly || isNumberOnly

  const getCircularSizeClass = () => {
    if (size === "sm") return "size-5"
    if (size === "lg") return "size-7"
    return "size-6"
  }

  return (
    <div
      data-slot="badge"
      id={ref}
      className={cn(
        igrpBadgeVariants({ size }),
        colorClasses.badge,
        isCircular && "flex aspect-square items-center justify-center",
        isCircular && getCircularSizeClass(),
        className,
        badgeClassName
      )}
      {...igrpOmitNonDomProps(props)}
    >
      {dot && <div className={cn("size-1.5 rounded-full", colorClasses.bgForeground)} />}

      <div className={cn("flex items-center", children && showIcon && "gap-1")}>
        {showIcon && <IGRPIcon iconName={iconName} strokeWidth={2} />}

        <div className={cn(iconPlacement === "end" && "order-first")}>{children}</div>
      </div>
    </div>
  )
}

export { IGRPBadge, type IGRPBadgeProps, igrpBadgeVariants }

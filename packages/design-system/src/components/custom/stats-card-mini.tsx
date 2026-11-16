"use client"

import { useId } from "react"
import { cn } from "cn"

import { IGRPColors, type IGRPColorVariants } from "../../lib/colors.js"
import { IGRPStatsCard, type IGRPStatsCardProps } from "../horizon/stats-card.js"

/**
 * Props for the StatsCardMini component.
 * Extends IGRPStatsCardProps with a simplified variant-based color scheme.
 * @see StatsCardMini
 */
interface IGRPStatsCardMiniProps extends Omit<
  IGRPStatsCardProps,
  | "cardBorder"
  | "cardBorderPosition"
  | "cardVariant"
  | "showIconBackground"
  | "iconBackground"
  | "showIconBorder"
  | "iconAppearance"
  | "iconShape"
  | "iconVariant"
  | "iconPlacement"
> {
  /** Color theme for the card (e.g. 'primary', 'success', 'destructive'). */
  variant?: IGRPColorVariants
}

/**
 * Compact stats card with minimal styling and variant-based colors.
 * Uses IGRPStatsCard internally with fixed layout (outlined square icon coloured by `variant`).
 */
function IGRPStatsCardMini({
  title,
  titleSize = "sm",
  titleClassName,
  value,
  valueSize = "2xl",
  valueClassName,
  iconName,
  image,
  imageAlt,
  iconClassName,
  className,
  onClick,
  variant = "primary",
  name,
  id,
  ...props
}: IGRPStatsCardMiniProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  const color = IGRPColors.outline[variant]

  return (
    <IGRPStatsCard
      {...props}
      id={ref}
      className={cn(className)}
      onClick={onClick}
      title={title}
      titleSize={titleSize}
      titleClassName={cn(titleClassName)}
      value={value}
      valueSize={valueSize}
      valueClassName={cn("font-semibold", color.text, valueClassName)}
      iconName={iconName}
      image={image}
      imageAlt={imageAlt}
      iconPlacement="start"
      iconAppearance="outline"
      iconShape="square"
      iconVariant={variant}
      iconClassName={cn(iconClassName)}
      cardBorder="rounded-xl"
      cardBorderPosition="none"
      cardVariant="primary"
    />
  )
}

export { IGRPStatsCardMini, type IGRPStatsCardMiniProps }

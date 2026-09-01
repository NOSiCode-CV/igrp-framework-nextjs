import { useId } from "react"
import { IGRPStatsCard, type IGRPStatsCardProps } from "../horizon/stats-card"
import { cn } from "../../lib/utils"

/**
 * Props for the IGRPStatsCardTopBorderColored component.
 * Subset of IGRPStatsCardProps for the top-border colored variant.
 * @see IGRPStatsCardTopBorderColored
 */
type IGRPStatsCardTopBorderColoredProps = Pick<
  IGRPStatsCardProps,
  "cardVariant" | "title" | "value" | "className" | "iconClassName" | "iconName" | "name" | "id"
>

/**
 * Stats card with a colored top border and icon at the end.
 * Renders title, value, and icon with the card variant applied to the top border.
 */
function IGRPStatsCardTopBorderColored({
  cardVariant,
  title,
  value,
  className,
  iconClassName,
  iconName,
  name,
  id,
}: IGRPStatsCardTopBorderColoredProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  return (
    <IGRPStatsCard
      title={title}
      value={value}
      iconVariant={cardVariant}
      className={cn(className)}
      iconClassName={cn(iconClassName)}
      iconName={iconName}
      cardBorder="rounded-lg"
      cardBorderPosition="top"
      cardVariant={cardVariant}
      iconPlacement="end"
      itemPlacement="start"
      iconBackground="rounded"
      showIconBackground={true}
      iconSize="sm"
      titleClassName={cn("text-muted-foreground")}
      titleSize="xs"
      valueSize="2xl"
      id={ref}
    />
  )
}

export { IGRPStatsCardTopBorderColored, type IGRPStatsCardTopBorderColoredProps }

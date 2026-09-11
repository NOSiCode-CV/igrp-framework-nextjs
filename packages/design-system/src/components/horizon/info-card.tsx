"use client"

import { Fragment, useId } from "react"

import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from "../../lib/colors"
import { cn } from "../../lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/card"
import { Separator } from "../primitives/separator"
import { IGRPIcon, type IGRPIconName } from "./icon"

/** Layout direction for a field's label and value. */
type IGRPInfoCardOrientation = "horizontal" | "vertical"

/** Number of responsive columns items flow into within a section. */
type IGRPInfoCardColumns = 1 | 2 | 3

/**
 * Layout classes per column count, keyed off the card's own width rather than
 * the viewport — an info card is often placed in a narrow grid cell or sidebar,
 * where a viewport breakpoint would report far more room than the card has.
 *
 * `horizontal` shares each column count's breakpoint: that is the point at which
 * a cell is wide enough to seat the label beside the value. Classes are written
 * out in full because Tailwind extracts them by literal match.
 */
const IGRP_INFO_CARD_LAYOUT: Record<
  IGRPInfoCardColumns,
  { grid: string; horizontal: string; horizontalLabel: string }
> = {
  1: {
    grid: "grid-cols-1",
    horizontal: "@sm/igrp-info-card:flex-row @sm/igrp-info-card:items-baseline @sm/igrp-info-card:gap-3",
    horizontalLabel: "@sm/igrp-info-card:w-2/5 @sm/igrp-info-card:shrink-0",
  },
  2: {
    grid: "grid-cols-1 @2xl/igrp-info-card:grid-cols-2",
    horizontal: "@2xl/igrp-info-card:flex-row @2xl/igrp-info-card:items-baseline @2xl/igrp-info-card:gap-3",
    horizontalLabel: "@2xl/igrp-info-card:w-2/5 @2xl/igrp-info-card:shrink-0",
  },
  3: {
    grid: "grid-cols-1 @2xl/igrp-info-card:grid-cols-2 @5xl/igrp-info-card:grid-cols-3",
    horizontal: "@5xl/igrp-info-card:flex-row @5xl/igrp-info-card:items-baseline @5xl/igrp-info-card:gap-3",
    horizontalLabel: "@5xl/igrp-info-card:w-2/5 @5xl/igrp-info-card:shrink-0",
  },
}

/**
 * Resolves the card surface classes for a color slot.
 *
 * Only `solid` recolors the card's text — it is the one variant whose background
 * is opaque enough to need its paired `-foreground` token. `outline` and `soft`
 * keep `text-card-foreground` so values stay readable, and carry the accent on
 * the title and icons instead.
 */
function igrpInfoCardSurface(variant: IGRPColorRole, color: IGRPColorVariants) {
  const slot = IGRPColors[variant][color]
  const isSolid = variant === "solid"

  return {
    // `bgStatic` is the background without the `hover:` state the shared map
    // pairs with interactive surfaces; an info card never enters that state.
    bg: slot.bgStatic,
    text: isSolid ? slot.text : "text-card-foreground",
    border: slot.border,
    accent: isSolid ? slot.text : slot.textCard,
    isSolid,
  }
}

/**
 * Single info field (label + value).
 * @see IGRPInfoCard
 */
interface IGRPInfoItem {
  /** Field label. */
  label: string
  /** Field value. */
  text: string
  /** Icon name. */
  icon?: IGRPIconName | string
  /** CSS classes for the icon. */
  iconClassName?: string
  /** Whether to show the icon. */
  showIcon?: boolean
  /**
   * Accent color for this item's value and icon. Ignored when the card uses
   * `variantSection="solid"`, where a per-item color cannot contrast against the
   * filled background.
   */
  colorItem?: IGRPColorVariants
}

/**
 * Section grouping multiple info items.
 * @see IGRPInfoCard
 */
interface IGRPInfoSection {
  /** Items in this section. */
  items: IGRPInfoItem[]
}

/**
 * Props for the IGRPInfoCard component.
 * @see IGRPInfoCard
 */
interface IGRPInfoCardProps {
  /** Card title. */
  title?: string
  /** CSS classes for the title. */
  titleClassName?: string
  /** Additional CSS classes. */
  className?: string
  /** CSS classes for the content area. */
  contentClassName?: string
  /** Sections of info items. */
  sections: IGRPInfoSection[]
  /** Color variant for sections. */
  variantSection?: IGRPColorRole
  /** Color theme for sections. */
  colorSection?: IGRPColorVariants
  /**
   * Layout direction of each field. `vertical` stacks the label above the value,
   * `horizontal` places them side by side once the card is wide enough.
   */
  orientation?: IGRPInfoCardOrientation
  /** Responsive columns items flow into within a section. */
  columns?: IGRPInfoCardColumns
  /** HTML id attribute. */
  id?: string
}

/**
 * Card displaying labeled info sections with optional icons.
 *
 * Each section renders as a description list, so assistive technology reads each
 * value as the value *of* its label rather than as loose adjacent text.
 */
function IGRPInfoCard({
  title,
  titleClassName,
  className,
  contentClassName,
  sections,
  variantSection = "outline",
  colorSection = "primary",
  orientation = "vertical",
  columns = 1,
  id,
}: IGRPInfoCardProps) {
  const _id = useId()
  const ref = id ?? _id

  const surface = igrpInfoCardSurface(variantSection, colorSection)
  const layout = IGRP_INFO_CARD_LAYOUT[columns]

  return (
    <Card className={cn(surface.bg, surface.text, surface.border, className)} id={ref}>
      {title && (
        <CardHeader>
          <CardTitle
            className={cn("text-2xl font-semibold leading-none tracking-tight", surface.accent, titleClassName)}
          >
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("@container/igrp-info-card flex flex-col gap-4", contentClassName)}>
        {sections.map((section, sectionIndex) => (
          <Fragment key={sectionIndex}>
            <dl className={cn("grid gap-4", layout.grid)}>
              {section.items.map((item, itemIndex) => (
                <IGRPInfoField
                  key={itemIndex}
                  item={item}
                  orientation={orientation}
                  layout={layout}
                  onSolid={surface.isSolid}
                />
              ))}
            </dl>
            {sectionIndex < sections.length - 1 && (
              // On a solid fill the default `bg-border` is unrelated to the
              // background it sits on; tracking the foreground keeps it visible.
              <Separator className={cn(surface.isSolid && "bg-current opacity-30")} />
            )}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Props for the internal IGRPInfoField component.
 */
interface IGRPInfoFieldProps {
  /** Info item to render. */
  item: IGRPInfoItem
  /** Layout direction inherited from the card. */
  orientation: IGRPInfoCardOrientation
  /** Resolved layout classes for the card's column count. */
  layout: (typeof IGRP_INFO_CARD_LAYOUT)[IGRPInfoCardColumns]
  /** Whether the card sits on a solid fill, which suppresses per-item colors. */
  onSolid: boolean
}

/** Renders a single info field as a `dt`/`dd` pair. */
function IGRPInfoField({ item, orientation, layout, onSolid }: IGRPInfoFieldProps) {
  const isHorizontal = orientation === "horizontal"

  // A per-item color would not contrast against a solid card fill, so it only
  // applies on the transparent/tinted variants. `textCard` is the same across
  // every role, so the role picked here is arbitrary.
  const itemColor = !onSolid && item.colorItem ? IGRPColors.soft[item.colorItem].textCard : undefined

  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", isHorizontal && layout.horizontal)}>
      <dt
        className={cn(
          "text-sm font-medium",
          // On a solid fill the label shares the card's foreground token; dimming
          // it keeps the label/value hierarchy without a second color.
          onSolid ? "opacity-80" : "text-muted-foreground",
          isHorizontal && layout.horizontalLabel,
        )}
      >
        {item.label}
      </dt>
      {/* `m-0` does not rely on the consumer's Tailwind preflight to clear the
          user-agent `dd` indent. */}
      <dd className={cn("m-0 flex min-w-0 items-center gap-2", itemColor)}>
        {item.showIcon && item.icon && <IGRPIcon iconName={item.icon} className={cn("shrink-0", item.iconClassName)} />}
        {/* Wrapped so the text is a real flex item that can shrink; a bare text
            node becomes an anonymous item and overflows on long values. */}
        <span className="min-w-0 break-words">{item.text}</span>
      </dd>
    </div>
  )
}

export {
  IGRPInfoCard,
  type IGRPInfoCardProps,
  type IGRPInfoItem,
  type IGRPInfoSection,
  type IGRPInfoCardOrientation,
  type IGRPInfoCardColumns,
}

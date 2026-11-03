"use client"

import { useId } from "react"

import { useIGRPi18n } from "../../i18n/index.js"
import { IGRPColors, type IGRPColorVariants } from "../../lib/colors.js"
import { igrpCleanString } from "../../lib/utilities.js"
import { cn } from "cn"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionTriggerArgs,
} from "../primitives/accordion.js"
import { Empty, EmptyDescription, EmptyMedia } from "../primitives/empty.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"

/**
 * Single accordion item with title and content.
 * @see IGRPAccordion
 */
interface IGRPAccordionItem extends Partial<AccordionTriggerArgs> {
  /** Item title shown in the trigger. */
  title: string
  /** Content shown when expanded. */
  content: React.ReactNode
  /** Stable item value. Default: `item-${igrpCleanString(title).toLowerCase()}`. */
  value?: string
  /** Pill after the title. `0` renders; it is also the default empty signal. */
  count?: number
  /** Circular soft-colour chip before the title (not the chevron). */
  badgeIcon?: IGRPIconName | string
  /** Chip colour, via IGRPColors.soft[badgeColor]. Default "primary". */
  badgeColor?: IGRPColorVariants
  /** Show the empty state instead of `content`. Default: `count === 0`. */
  empty?: boolean
  emptyIcon?: IGRPIconName | string
  /** Empty-state text. Default: the catalog's `accordion.empty`. */
  emptyLabel?: string
}

type IGRPAccordionBaseProps = Partial<AccordionTriggerArgs> &
  Omit<React.ComponentProps<typeof Accordion>, "type" | "value" | "defaultValue" | "onValueChange" | "collapsible"> & {
    /** CSS classes for the trigger. */
    classNameTrigger?: string
    /** CSS classes for the content. */
    classNameContent?: string
    /** Array of accordion items. */
    items: IGRPAccordionItem[]
    /** HTML name attribute. */
    name?: string
  }

/**
 * Props for the IGRPAccordion component.
 * `single` (default) keeps one item open; `multiple` allows several, and `defaultValue="all"` opens every item.
 * @see IGRPAccordion
 */
type IGRPAccordionProps = IGRPAccordionBaseProps &
  (
    | { type?: "single"; value?: string; defaultValue?: string; onValueChange?(value: string): void }
    | { type: "multiple"; value?: string[]; defaultValue?: string[] | "all"; onValueChange?(value: string[]): void }
  )

function itemValue(item: IGRPAccordionItem): string {
  return item.value ?? `item-${igrpCleanString(item.title).toLowerCase()}`
}

/**
 * Accordion with collapsible items, optional icons, and single/multiple expand modes.
 */
function IGRPAccordion(props: IGRPAccordionProps) {
  const {
    className,
    classNameTrigger,
    classNameContent,
    items,
    showIcon = true,
    iconName = "ChevronDown",
    iconPlacement = "end",
    name,
    id,
    ...rest
  } = props
  const i18n = useIGRPi18n()
  const _id = useId()
  const ref = name ?? id ?? _id

  const children = items?.map((item) => {
    const soft = IGRPColors.soft[item.badgeColor ?? "primary"]
    const isEmpty = item.empty ?? item.count === 0
    return (
      <AccordionItem key={itemValue(item)} value={itemValue(item)}>
        <AccordionTrigger
          iconName={item.iconName ?? iconName}
          showIcon={item.showIcon ?? showIcon}
          iconPlacement={item.iconPlacement ?? iconPlacement}
          className={classNameTrigger}
        >
          {item.badgeIcon || item.count !== undefined ? (
            <span data-slot="accordion-title" className="flex items-center gap-3">
              {item.badgeIcon && (
                <span
                  data-slot="accordion-badge-icon"
                  className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", soft.bg, soft.text)}
                >
                  <IGRPIcon iconName={item.badgeIcon} className="size-4" strokeWidth={2} />
                </span>
              )}
              {item.title}
              {item.count !== undefined && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                  {item.count}
                </span>
              )}
            </span>
          ) : (
            item.title
          )}
        </AccordionTrigger>
        <AccordionContent className={classNameContent}>
          {isEmpty ? (
            <Empty className="bg-background p-8">
              <EmptyMedia variant="icon">
                <IGRPIcon iconName={item.emptyIcon ?? "Inbox" /* igrp-i18n-ignore */} strokeWidth={1.75} />
              </EmptyMedia>
              <EmptyDescription>{item.emptyLabel ?? i18n.accordion.empty}</EmptyDescription>
            </Empty>
          ) : (
            item.content
          )}
        </AccordionContent>
      </AccordionItem>
    )
  })

  if (props.type === "multiple") {
    const { type, defaultValue, ...accordionProps } = rest as Extract<typeof rest, { type: "multiple" }>
    return (
      <Accordion
        id={ref}
        className={cn(className)}
        type={type}
        defaultValue={
          defaultValue === "all" ? items.map(itemValue) : (defaultValue ?? (items[0] ? [itemValue(items[0])] : []))
        }
        {...accordionProps}
      >
        {children}
      </Accordion>
    )
  }

  const { defaultValue, ...accordionProps } = rest as Extract<typeof rest, { type?: "single" }>
  return (
    <Accordion
      id={ref}
      className={cn(className)}
      type="single"
      collapsible
      defaultValue={
        defaultValue ? `item-${igrpCleanString(defaultValue).toLowerCase()}` : items[0] && itemValue(items[0])
      }
      {...accordionProps}
    >
      {children}
    </Accordion>
  )
}

export { IGRPAccordion, type IGRPAccordionProps, type IGRPAccordionItem }

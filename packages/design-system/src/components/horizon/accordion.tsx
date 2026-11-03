"use client"

import { useId } from "react"

import { igrpCleanString } from "../../lib/utilities.js"
import { cn } from "cn"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionTriggerArgs,
} from "../primitives/accordion.js"

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
  const _id = useId()
  const ref = name ?? id ?? _id

  const children = items?.map((item) => (
    <AccordionItem key={itemValue(item)} value={itemValue(item)}>
      <AccordionTrigger
        iconName={item.iconName ?? iconName}
        showIcon={item.showIcon ?? showIcon}
        iconPlacement={item.iconPlacement ?? iconPlacement}
        className={classNameTrigger}
      >
        {item.title}
      </AccordionTrigger>
      <AccordionContent className={classNameContent}>{item.content}</AccordionContent>
    </AccordionItem>
  ))

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

'use client';

import { useId } from 'react';

import { igrpCleanString } from '../../lib/strings';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionTriggerArgs,
} from '../primitives/accordion';
import { cn } from '../../lib/utils';

/**
 * Single accordion item with title and content.
 * @see IGRPAccordion
 */
interface IGRPAccordionItem extends Partial<AccordionTriggerArgs> {
  /** Item title shown in the trigger. */
  title: string;
  /** Content shown when expanded. */
  content: React.ReactNode;
}

/**
 * Props for the IGRPAccordion component.
 * @see IGRPAccordion
 */
interface IGRPAccordionProps
  extends Partial<AccordionTriggerArgs>, Omit<React.ComponentProps<typeof Accordion>, 'type'> {
  /** CSS classes for the trigger. */
  classNameTrigger?: string;
  /** CSS classes for the content. */
  classNameContent?: string;
  /** Array of accordion items. */
  items: IGRPAccordionItem[];
  /** Controlled value (open item). */
  value?: string;
  /** Uncontrolled default value. */
  defaultValue?: string;
  /** Called when the open item changes. */
  onValueChange?(value: string): void;
  /** HTML name attribute. */
  name?: string;
}

/**
 * Accordion with collapsible items, optional icons, and single/multiple expand modes.
 */
function IGRPAccordion({
  className,
  classNameTrigger,
  classNameContent,
  items,
  showIcon = true,
  iconName = 'ChevronDown',
  iconPlacement = 'end',
  defaultValue,
  name,
  id,
  ...accordionProps
}: IGRPAccordionProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const _defaultValue = defaultValue || items[0]?.title;
  const defaultId = igrpCleanString(_defaultValue).toLowerCase();

  return (
    <Accordion
      id={ref}
      className={cn(className)}
      type="single"
      collapsible
      defaultValue={`item-${defaultId}`}
      {...accordionProps}
    >
      {items?.map((item) => {
        const id = igrpCleanString(item.title).toLowerCase();
        return (
          <AccordionItem key={id} value={`item-${id}`}>
            <AccordionTrigger
              iconName={item.iconName ?? iconName}
              showIcon={item.showIcon ?? showIcon}
              iconPlacement={item.iconPlacement ?? iconPlacement}
            >
              {item.title}
            </AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export { IGRPAccordion, type IGRPAccordionProps, type IGRPAccordionItem };

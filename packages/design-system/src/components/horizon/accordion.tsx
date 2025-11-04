import { useId } from 'react';
import { igrpCleanString } from '../../lib/strings';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionTriggerArgs,
} from '../primitives/accordion';

interface IGRPAccordionItem extends Partial<AccordionTriggerArgs> {
  title: string;
  content: string;
}

interface IGRPAccordionProps
  extends Partial<AccordionTriggerArgs>,
    Omit<React.ComponentProps<typeof Accordion>, 'type'> {
  classNameTrigger?: string;
  classNameContent?: string;
  items: IGRPAccordionItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
  name?: string;
}

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
      className={className}
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

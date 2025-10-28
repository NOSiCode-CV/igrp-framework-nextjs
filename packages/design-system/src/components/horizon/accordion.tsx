import * as LucideIcons from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../primitives/accordion';

interface IGRPAccordionProps {
  iconName?: keyof typeof LucideIcons;
  showIcon?: boolean;
  iconPlacement?: 'left' | 'right';
  className?: string | undefined;
  accordionList?: Array<{ title: string; content: string; iconName?: keyof typeof LucideIcons }>;
}

function IGRPAccordion({ className, accordionList, iconPlacement, showIcon }: IGRPAccordionProps) {
  return (
    <Accordion className={className} type="single" collapsible>
      {accordionList?.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger
            iconName={item.iconName}
            showIcon={showIcon}
            iconPlacement={iconPlacement}
          >
            {item.title}
          </AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export { IGRPAccordion, type IGRPAccordionProps };

// IGRP CUSTOM: THIS COMPONENT IS CHANGED FROM THE ORIGINAL

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '../../lib/utils';
import { IGRPIcon, type IGRPIconName } from '../horizon/icon';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  );
}

type AccordionTriggerArgs = {
  iconName?: IGRPIconName | string;
  showIcon: boolean;
  iconPlacement: 'start' | 'end';
};

interface AccordionTriggerProps
  extends React.ComponentProps<typeof AccordionPrimitive.Trigger>, AccordionTriggerArgs {}

function AccordionTrigger({
  className,
  children,
  iconName = 'ChevronDown',
  showIcon,
  iconPlacement = 'end',
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className={cn('flex')}>
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          iconPlacement === 'end' && 'justify-between',
          className,
        )}
        {...props}
      >
        {showIcon && (
          <IGRPIcon
            iconName={iconName}
            className={cn(
              'text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200',
              iconPlacement === 'end' && 'order-last',
            )}
          />
        )}
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm',
      )}
      {...props}
    >
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionTriggerProps,
  type AccordionTriggerArgs,
};

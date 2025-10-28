import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';

// IGRP CUSTOM: THIS COMPONENT IS CHANGED FROM THE ORIGINAL
interface AccordionProps {
  iconName?: keyof typeof LucideIcons | '';
  showIcon?: boolean;
  iconPlacement?: 'left' | 'right';
}

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

type AccordionTriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger> &
  AccordionProps;

function AccordionTrigger({
  className,
  children,
  iconName = '',
  showIcon = true,
  iconPlacement = 'right',
  ...props
}: AccordionTriggerProps) {
  const IconComponent = iconName ? LucideIcons[iconName] as React.FC<React.SVGProps<SVGSVGElement>>: () => null;
  const spacement = iconPlacement === 'right' ? 'justify-between' : '';

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          className,
          spacement,
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {showIcon && iconName && <IconComponent width={16} height={16}></IconComponent>}
          {children}
        </div>
        {iconPlacement && (
          <LucideIcons.ChevronDownIcon
            className={cn(
              'text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200',
              iconPlacement === 'left' && 'order-first mr-2',
            )}
          />
        )}
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
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

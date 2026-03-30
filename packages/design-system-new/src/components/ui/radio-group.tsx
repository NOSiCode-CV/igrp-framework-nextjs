// IGRP CUSTOM: THIS COMPONENT IS CHANGED FROM THE ORIGINAL

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { CircleIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const radioItemVariants = cva(
  'group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary',
  {
    variants: {
      variant: {
        default: 'border-input dark:bg-input/30 shadow-xs',
        outline: 'border-2 border-primary/30 data-[state=checked]:border-primary shadow-none',
        soft: 'border-transparent bg-primary/10 data-[state=checked]:bg-primary/20 shadow-none',
      },
      size: {
        sm: 'size-3',
        md: 'size-4',
        lg: 'size-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid w-full gap-2', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  size = 'md',
  variant,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & VariantProps<typeof radioItemVariants>) {
  const indicatorSizes: Record<NonNullable<typeof size>, string> = {
    sm: 'size-1.5',
    md: 'size-2',
    lg: 'size-2.5',
  };

  const indicatorSize = size ? indicatorSizes[size] : 'size-2';

  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(radioItemVariants({ variant, size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className={cn('relative flex items-center justify-center')}
      >
        <CircleIcon
          className={cn(
            'fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            indicatorSize,
          )}
        />
        {/* <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" /> */}
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { RadioGroup, RadioGroupItem, radioItemVariants };

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CircleIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const radioItemVariants = cva(
  'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
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
      data-slot='radio-group'
      className={cn('grid gap-3', className)}
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
    lg: 'size-2.55',
  };

  const indicatorSize = size ? indicatorSizes[size] : 'size-2';

  return (
    <RadioGroupPrimitive.Item
      data-slot='radio-group-item'
      className={cn(radioItemVariants({ variant, size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot='radio-group-indicator'
        className='relative flex items-center justify-center'
      >
        <CircleIcon
          className={cn(
            'fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            indicatorSize,
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { RadioGroup, RadioGroupItem, radioItemVariants };

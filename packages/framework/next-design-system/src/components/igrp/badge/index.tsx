/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from 'class-variance-authority';
import { IGRPIcon } from '@/components/igrp/icon';
import { type IGRPColorRole, IGRPColors, type IGRPColorVariants } from '@/lib/colors';
import { cn } from '@/lib/utils';
import { type IGRPBaseAttributes } from '@/types/globals';

const igrpBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full shadow-none border px-4 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      size: {
        sm: 'text-xs [&>svg]:size-2.5',
        md: 'text-sm [&>svg]:size-3',
        lg: 'text-md [&>svg]:size-3.5',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
);

interface IGRPBadgeProps
  extends Omit<IGRPBaseAttributes, 'ref' | 'helperText'>,
    Omit<React.ComponentProps<'div'>, 'color' | 'className'>,
    VariantProps<typeof igrpBadgeVariants> {
  dot?: boolean;
  variant?: IGRPColorRole;
  color?: IGRPColorVariants;
  badgeClassName?: string;
}

function IGRPBadge({
  dot = false,
  variant = 'solid',
  color = 'primary',
  badgeClassName,
  size,
  showIcon = false,
  iconName = 'Info',
  iconPlacement = 'start',
  children,
  ...props
}: IGRPBadgeProps) {
  const colorClasses = IGRPColors[variant][color];
  const isIconOnly = (!children || children === '') && (showIcon || iconName);
  const isNumberOnly =
    typeof children === 'string' && children.length === 1 && !showIcon && !iconName && !dot;
  const isCircular = isIconOnly || isNumberOnly;

  const getCircularSizeClass = () => {
    if (size === 'sm') return 'h-5 w-5';
    if (size === 'lg') return 'h-7 w-7';
    return 'h-6 w-6';
  };

  return (
    <div
      data-slot='badge'
      className={cn(
        igrpBadgeVariants({ size }),
        colorClasses.bgBadge,
        colorClasses.textBadge,
        colorClasses.borderBadge,
        isCircular && 'aspect-square flex items-center justify-center',
        isCircular && getCircularSizeClass(),
        badgeClassName,
      )}
      {...props}
    >
      {dot && <div className={cn('size-1.5 rounded-full', colorClasses.bgForeground)} />}

      <div className='flex items-center gap-1'>
        {showIcon && (
          <IGRPIcon
            iconName={iconName}
            size={12}
            strokeWidth={2}
          />
        )}

        <div className={cn(iconPlacement === 'end' && 'order-first')}>{children}</div>
      </div>
    </div>
  );
}

export { IGRPBadge, type IGRPBadgeProps, igrpBadgeVariants };

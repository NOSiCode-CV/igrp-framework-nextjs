import { cva, type VariantProps } from 'class-variance-authority';
import { useId } from 'react';

import { type IGRPColorRole, IGRPColors, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { type IGRPBaseAttributes } from '../../types';
import { IGRPIcon } from './icon';

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

interface IGRPBadgeProps extends Omit<IGRPBaseAttributes, 'helperText'>,
    Omit<React.ComponentProps<'div'>, 'color'>,
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
  className,
  name,
  id,
  ...props
}: IGRPBadgeProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const colorClasses = IGRPColors[variant][color];
  const isIconOnly = (!children || children === '') && (showIcon || iconName);
  const isNumberOnly = typeof children === 'number' && !showIcon && !iconName && !dot;
  const isCircular = isIconOnly || isNumberOnly;

  const getCircularSizeClass = () => {
    if (size === 'sm') return 'size-5';
    if (size === 'lg') return 'size-7';
    return 'size-6';
  };

  return (
    <div
      data-slot="badge"
      id={ref}
      className={cn(
        igrpBadgeVariants({ size }),
        colorClasses.badge,
        isCircular && 'aspect-square flex items-center justify-center',
        isCircular && getCircularSizeClass(),
        className,
        badgeClassName,
      )}
      {...props}
    >
      {dot && <div className={cn('size-1.5 rounded-full', colorClasses.bgForeground)} />}

      <div className={cn('flex items-center', children && showIcon && 'gap-1')}>
        {showIcon && <IGRPIcon iconName={iconName} strokeWidth={2} />}

        <div className={cn(iconPlacement === 'end' && 'order-first')}>{children}</div>
      </div>
    </div>
  );
}

export { IGRPBadge, type IGRPBadgeProps, igrpBadgeVariants };

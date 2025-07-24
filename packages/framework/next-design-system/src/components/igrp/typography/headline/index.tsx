'use client';

import { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { IGRPIcon } from '@/components/igrp/icon';
import { type IGRPColorRole, type IGRPColorVariants, IGRPColors } from '@/lib/colors';
import { cn } from '@/lib/utils';
import type { IGRPBaseAttributes } from '@/types/globals';

const igrpHeadlineVariants = cva('scroll-m-20 font-bold tracking-tight text-balance', {
  variants: {
    variant: {
      h1: 'text-4xl font-extrabold lg:text-5xl',
      h2: 'text-3xl lg:text-4xl',
      h3: 'text-2xl lg:text-3xl',
      h4: 'text-xl lg:text-2xl ',
      h5: 'text-lg lg:text-xl',
      h6: 'text-base lg:text-lg',
    },
  },
  defaultVariants: {
    variant: 'h3',
  },
});

interface IGRPHeadlineProps
  extends VariantProps<typeof igrpHeadlineVariants>,
    Omit<React.ComponentProps<'div'>, 'title'>,
    Partial<IGRPBaseAttributes> {
  title: string;
  description?: string;
  roleColor?: IGRPColorRole;
  color?: IGRPColorVariants;
}

function IGRPHeadline({
  variant = 'h3',
  title,
  description,
  className,
  name,
  roleColor = 'solid',
  color = 'primary',
  iconName = 'Info',
  showIcon = false,
  iconClassName,
  iconPlacement = 'start',
  iconSize,
  ...props
}: IGRPHeadlineProps) {
  const id = useId();
  const ref = name || id;

  const Tag = variant as keyof React.JSX.IntrinsicElements;

  const colorClass = IGRPColors[roleColor][color];

  return (
    <div
      className={cn(
        'flex gap-2 items-start',
        colorClass.text,
        colorClass.textDark,
        iconPlacement === 'end' && 'flex-row-reverse justify-between',
        className,
      )}
      {...props}
      id={ref}
    >
      {showIcon && (
        <IGRPIcon
          iconName={iconName}
          size={iconSize}
          className={cn('mt-1', iconClassName)}
        />
      )}
      <div className='flex flex-col gap-1'>
        <Tag className={cn(igrpHeadlineVariants({ variant }))}>{title}</Tag>
        <p className='text-sm'>{description}</p>
      </div>
    </div>
  );
}

export {
  IGRPHeadline,
  type IGRPHeadlineProps,
  // eslint-disable-next-line react-refresh/only-export-components
  igrpHeadlineVariants,
};

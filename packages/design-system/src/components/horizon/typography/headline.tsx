'use client';

import { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { IGRPIcon } from '../icon';
import { type IGRPColorRole, type IGRPColorVariants, IGRPColors } from '../../../lib/colors';
import { cn } from '../../../lib/utils';
import type { IGRPBaseAttributes } from '../../../types';

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

/**
 * Props for the IGRPHeadline component.
 * @see IGRPHeadline
 */
interface IGRPHeadlineProps
  extends
    VariantProps<typeof igrpHeadlineVariants>,
    Omit<React.ComponentProps<'div'>, 'title'>,
    Partial<IGRPBaseAttributes> {
  /** Headline text. */
  title: string;
  /** Optional description below the title. */
  description?: string;
  /** Color role (solid, soft, outline). */
  roleColor?: IGRPColorRole;
  /** Color theme. */
  color?: IGRPColorVariants;
  /** HTML id attribute. */
  id?: string;
}

/**
 * Headline (h1–h6) with optional description and icon.
 */
function IGRPHeadline({
  variant = 'h3',
  title,
  description,
  className,
  name,
  id,
  roleColor = 'solid',
  color = 'primary',
  iconName = 'Info',
  showIcon = false,
  iconClassName,
  iconPlacement = 'start',
  iconSize,
  ...props
}: IGRPHeadlineProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const Tag = variant as keyof React.JSX.IntrinsicElements;

  const colorClass = IGRPColors[roleColor][color];

  return (
    <div
      id={ref}
      className={cn(
        'flex gap-2 items-start',
        colorClass.text,
        iconPlacement === 'end' && 'flex-row-reverse justify-between',
        className,
      )}
      {...props}
    >
      {showIcon && (
        <IGRPIcon iconName={iconName} size={iconSize} className={cn('mt-1', iconClassName)} />
      )}
      <div className={cn('flex flex-col gap-1')}>
        <Tag className={cn(igrpHeadlineVariants({ variant }))}>{title}</Tag>
        <p className={cn('text-sm')}>{description}</p>
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

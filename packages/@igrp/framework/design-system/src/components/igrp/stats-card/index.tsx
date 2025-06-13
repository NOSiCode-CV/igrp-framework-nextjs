/* eslint-disable react-refresh/only-export-components */
'use client';

import { useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { IGRPColors, type IGRPColorVariants } from '@/lib/colors';
import { cn } from '@/lib/utils';
import type { IGRPBaseAttributes } from '@/types/globals';
import Image from 'next/image';

// Card CVA
const igrpStatsCardVariants = cva(
  'flex items-center p-4 bg-card shadow-sm text-card-foreground transition-all overflow-hidden',
  {
    variants: {
      border: {
        none: '',
        'rounded-sm': 'rounded-sm border border-border',
        'rounded-md': 'rounded-md border border-border',
        'rounded-lg': 'rounded-lg border border-border',
        'rounded-xl': 'rounded-xl border border-border',
        'rounded-2xl': 'rounded-2xl border border-border',
        'rounded-3xl': 'rounded-3xl border border-border',
        'rounded-full': 'rounded-full border border-border',
        square: 'border border-border',
      },
      borderPosition: {
        none: '',
        top: 'border-t-4 border-l-0 border-r-0 border-b-0',
        bottom: 'border-b-4 border-l-0 border-r-0 border-t-0',
        left: 'border-l-4 border-t-0 border-r-0 border-b-0',
        right: 'border-r-4 border-t-0 border-l-0 border-b-0',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md',
        false: '',
      },
    },
    defaultVariants: {
      border: 'rounded-md',
      borderPosition: 'none',
      interactive: false,
    },
  },
);

// Title CVA
const igrpStatsCardTitleVariants = cva('font-medium tracking-tighter', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

// Value CVA
const igrpStatsCardValueVariants = cva('font-bold', {
  variants: {
    size: {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
  },
  defaultVariants: {
    size: '2xl',
  },
});

// Icon/Image CVA
const igrpStstaCardIconVariants = cva('flex items-center justify-center shrink-0', {
  variants: {
    size: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-14 w-14',
    },
    showBackground: {
      true: '',
      false: '',
    },
    background: {
      none: '',
      rounded: 'rounded-full',
      square: 'rounded-md',
    },
    backgroundBorder: {
      true: '',
      false: '',
    },
    variant: {
      none: '',
      primary: '',
      secondary: '',
      success: '',
      destructive: '',
      warning: '',
      info: '',
      indigo: '',
    },
  },
  compoundVariants: [
    // === Show Background + Rounded/Square ===
    {
      showBackground: true,
      background: ['rounded', 'square'],
      variant: 'primary',
      className: 'bg-primary/10 text-primary',
    },
    {
      showBackground: true,
      background: ['rounded', 'square'],
      variant: 'secondary',
      className: 'bg-gray-100 text-gray-600',
    },
    {
      showBackground: true,
      background: ['rounded', 'square'],
      variant: 'success',
      className: 'bg-green-100 text-green-500',
    },
    {
      showBackground: true,
      background: ['rounded', 'square'],
      variant: 'destructive',
      className: 'bg-red-100 text-red-500',
    },
    {
      showBackground: true,
      background: ['rounded', 'square'],
      variant: 'warning',
      className: 'bg-amber-100 text-amber-500',
    },
    {
      showBackground: true,
      background: ['rounded', 'square'],
      variant: 'info',
      className: 'bg-blue-100 text-blue-500',
    },
    {
      showBackground: true,
      background: ['rounded', 'square'],
      variant: 'indigo',
      className: 'bg-indigo-100 text-purple-500',
    },

    // === Border styles (independent of background) ===
    {
      backgroundBorder: true,
      variant: 'primary',
      className: 'border border-primary/20',
    },
    {
      backgroundBorder: true,
      variant: 'secondary',
      className: 'border border-gray-200',
    },
    {
      backgroundBorder: true,
      variant: 'success',
      className: 'border border-green-200',
    },
    {
      backgroundBorder: true,
      variant: 'destructive',
      className: 'border border-red-200',
    },
    {
      backgroundBorder: true,
      variant: 'warning',
      className: 'border border-amber-200',
    },
    {
      backgroundBorder: true,
      variant: 'info',
      className: 'border border-blue-200',
    },
    {
      backgroundBorder: true,
      variant: 'indigo',
      className: 'border border-purple-200',
    },

    // === No Background, Just Text Color ===
    {
      showBackground: false,
      background: 'none',
      variant: 'primary',
      className: 'text-primary',
    },
    {
      showBackground: false,
      background: 'none',
      variant: 'secondary',
      className: 'text-gray-500',
    },
    {
      showBackground: false,
      background: 'none',
      variant: 'success',
      className: 'text-green-500',
    },
    {
      showBackground: false,
      background: 'none',
      variant: 'destructive',
      className: 'text-red-500',
    },
    {
      showBackground: false,
      background: 'none',
      variant: 'warning',
      className: 'text-amber-500',
    },
    {
      showBackground: false,
      background: 'none',
      variant: 'info',
      className: 'text-blue-500',
    },
    {
      showBackground: false,
      background: 'none',
      variant: 'indigo',
      className: 'text-indigo-500',
    },
  ],
  defaultVariants: {
    size: 'md',
    showBackground: false,
    background: 'none',
    backgroundBorder: false,
    variant: 'none',
  },
});

interface IGRPStatsCardProps
  extends Omit<IGRPBaseAttributes, 'ref' | 'iconSize'>,
    React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  titleSize?: VariantProps<typeof igrpStatsCardTitleVariants>['size'];
  titleClassName?: string;
  titleColored?: boolean;
  value?: string | number;
  valueSize?: VariantProps<typeof igrpStatsCardValueVariants>['size'];
  valueClassName?: string;
  valueColored?: boolean;
  onClick?: () => void;
  image?: string;
  imageAlt?: string;
  cardBorder?: VariantProps<typeof igrpStatsCardVariants>['border'];
  cardBorderPosition?: VariantProps<typeof igrpStatsCardVariants>['borderPosition'];
  cardVariant?: IGRPColorVariants;
  showIconBackground?: boolean;
  iconBackground?: VariantProps<typeof igrpStstaCardIconVariants>['background'];
  showIconBorder?: boolean;
  iconVariant?: IGRPColorVariants;
  itemPlacement?: 'start' | 'end';
  iconSize?: VariantProps<typeof igrpStstaCardIconVariants>['size'];
}

function IGRPStatsCard({
  className,
  title,
  titleSize = 'sm',
  titleColored = false,
  titleClassName,
  value,
  valueSize = '2xl',
  valueColored = false,
  valueClassName,
  showIcon = true,
  iconName = 'Box',
  iconSize = 'md',
  iconPlacement = 'start',
  showIconBackground = false,
  iconBackground = 'none',
  showIconBorder = false,
  iconVariant = 'primary',
  iconClassName,
  image,
  imageAlt,
  cardBorder = 'rounded-xl',
  cardBorderPosition = 'none',
  cardVariant = 'primary',
  itemPlacement = 'start',
  onClick,
  ...props
}: IGRPStatsCardProps) {
  const isInteractive = !!onClick;
  const outlineColors = IGRPColors['outline'][cardVariant];
  const solidColors = IGRPColors['solid'][cardVariant];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isInteractive) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    [isInteractive, onClick],
  );

  return (
    <div
      className={cn(
        iconPlacement === 'start' ? 'flex-row-reverse' : 'flex-row',
        itemPlacement === 'end'
          ? 'justify-end text-right items-end'
          : 'justify-start text-left items-start',
        igrpStatsCardVariants({
          border: cardBorder,
          borderPosition: cardBorderPosition,
          interactive: isInteractive,
        }),
        cardBorderPosition !== 'none' && outlineColors.border,
        className,
      )}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : 'none'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className='flex flex-col flex-1 mx-4'>
        {title && (
          <p
            className={cn(
              igrpStatsCardTitleVariants({ size: titleSize }),
              titleColored && solidColors.text,
              titleClassName,
            )}
          >
            {title}
          </p>
        )}
        {value && (
          <div
            className={cn(
              igrpStatsCardValueVariants({ size: valueSize }),
              valueColored && solidColors.text,
              valueClassName,
            )}
          >
            {value}
          </div>
        )}
      </div>
      <IGRPStatsCardIcon
        showIcon={showIcon}
        iconName={iconName}
        iconSize={iconSize}
        showIconBackground={showIconBackground}
        iconBackground={iconBackground}
        showIconBorder={showIconBorder}
        iconVariant={iconVariant}
        iconClassName={iconClassName}
        image={image}
        imageAlt={imageAlt}
      />
    </div>
  );
}

interface IGRPStatsCardIconProps {
  showIcon: boolean;
  image?: string;
  imageAlt?: string;
  iconName: IGRPIconName | string;
  iconSize?: VariantProps<typeof igrpStstaCardIconVariants>['size'];
  showIconBackground: boolean;
  iconBackground?: VariantProps<typeof igrpStstaCardIconVariants>['background'];
  showIconBorder: boolean;
  iconVariant: IGRPColorVariants;
  iconClassName?: string;
}
function IGRPStatsCardIcon({
  showIcon,
  image,
  imageAlt,
  iconName,
  iconSize,
  showIconBackground,
  iconBackground,
  showIconBorder,
  iconVariant,
  iconClassName,
}: IGRPStatsCardIconProps) {
  if (!showIcon && !image) return null;

  const content = () => {
    if (image) {
      return (
        <Image
          src={image}
          alt={imageAlt || ''}
          className='h-full w-full object-cover'
        />
      );
    }
    if (showIcon && iconName) {
      return (
        <IGRPIcon
          iconName={iconName}
          className='h-6 w-6'
        />
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        igrpStstaCardIconVariants({
          size: iconSize as VariantProps<typeof igrpStstaCardIconVariants>['size'],
          showBackground: showIconBackground,
          background: iconBackground,
          backgroundBorder: showIconBorder,
          variant: iconVariant,
        }),
        iconClassName,
      )}
    >
      {content()}
    </div>
  );
}

export {
  IGRPStatsCard,
  type IGRPStatsCardProps,
  igrpStatsCardVariants,
  igrpStatsCardTitleVariants,
  igrpStatsCardValueVariants,
  igrpStstaCardIconVariants,
};

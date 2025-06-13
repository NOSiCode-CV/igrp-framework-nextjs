'use client';

import type { ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/horizon/button';
import { IGRPIcon } from '@/components/igrp/icon';
import { cn } from '@/lib/utils';
import type { IGRPBaseAttributes } from '@/types/globals';

interface IGRPButtonProps
  extends Omit<React.ComponentProps<'button'>, 'name'>,
    VariantProps<typeof buttonVariants>,
    Omit<IGRPBaseAttributes, 'ref'> {
  children?: ReactNode;
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  iconSpacing?: number;
  wrapperClassName?: string;
}

function IGRPButton({
  children,
  showIcon = false,
  iconName = 'ArrowLeft',
  iconPlacement = 'start',
  iconClassName,
  iconSize = 14,
  // iconSpacing = 2,
  className,
  loading = false,
  loadingText = 'Loading...',
  disabled,
  // wrapperClassName,
  type = 'button',
  ...props
}: IGRPButtonProps) {
  const { size } = props;

  const computedIconSize =
    iconSize || (size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'icon' ? 18 : 16);

  if (size === 'icon') {
    return (
      <Button
        {...props}
        className={className}
        disabled={disabled || loading}
        type={type}
      >
        {loading ? (
          <>
            <Loader2
              className='h-4 w-4 animate-spin'
              aria-hidden='true'
            />
            <span className='sr-only'>{loadingText}</span>
          </>
        ) : (
          <IGRPIcon
            iconName={iconName}
            className={iconClassName}
            size={computedIconSize}
            aria-hidden='true'
          />
        )}
      </Button>
    );
  }

  // const spacingClass = `space-x-${iconSpacing}`;

  return (
    <Button
      {...props}
      className={cn('relative', loading && 'cursor-wait', className)}
      disabled={disabled || loading}
      type={type}
    >
      {loading && iconPlacement === 'start' ? (
        <Loader2
          className='mr-2 h-4 w-4 animate-spin'
          aria-hidden='true'
        />
      ) : (
        showIcon &&
        iconPlacement === 'start' && (
          <IGRPIcon
            iconName={iconName}
            className={cn('mr-2', iconClassName)}
            size={computedIconSize}
            aria-hidden='true'
          />
        )
      )}

      {loading && loadingText ? loadingText : children}

      {!loading && showIcon && iconPlacement === 'end' && (
        <IGRPIcon
          iconName={iconName}
          className={cn('ml-2', iconClassName)}
          size={computedIconSize}
          aria-hidden='true'
        />
      )}

      {loading && iconPlacement === 'end' && (
        <Loader2
          className='ml-2 h-4 w-4 animate-spin'
          aria-hidden='true'
        />
      )}
    </Button>
  );
}

export { IGRPButton, type IGRPButtonProps };

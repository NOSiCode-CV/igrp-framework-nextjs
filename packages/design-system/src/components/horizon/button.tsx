'use client';

import { useId, type ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';

import { Button, buttonVariants } from '../primitives/button';
import { IGRPIcon } from './icon';
import { cn } from '../../lib/utils';
import type { IGRPBaseAttributes } from '../../types';

interface IGRPButtonProps extends Omit<React.ComponentProps<typeof Button>, 'name'>,
  VariantProps<typeof buttonVariants>, IGRPBaseAttributes {
    children?: ReactNode;
    asChild?: boolean;
    loading?: boolean;
    loadingText?: string;
}

function IGRPButton({
  children,
  showIcon = false,
  iconName = 'ArrowLeft',
  iconPlacement = 'start',
  iconClassName,
  iconSize = 14,
  className,
  loading = false,
  loadingText = 'Loading...',
  disabled,
  type = 'button',
  name,
  id,
  ...props
}: IGRPButtonProps) {
  const _id = useId();
  const ref = name ?? id ?? _id
  
  const { size } = props;

  const computedIconSize =
    iconSize || (size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'icon' ? 18 : 16);

  const LoadingIcon = (
    <IGRPIcon iconName="LoaderCircle" className="animate-spin" aria-hidden="true" />
  );

  if (size === 'icon' || size === 'icon-sm' || size === 'icon-lg') {
    return (
      <Button
        {...props}
        className={cn(loading && 'cursor-wait', className)}
        disabled={disabled || loading}
        type={type}
        id={ref}
      >
        {loading ? (
          <>
            {LoadingIcon}
            <span className="sr-only">{loadingText}</span>
          </>
        ) : (
          <IGRPIcon iconName={iconName} className={iconClassName} aria-hidden="true" />
        )}
      </Button>
    );
  }

  return (
    <Button
      {...props}
      className={cn('relative', loading && 'cursor-wait', className)}
      disabled={disabled || loading}
      type={type}
      id={ref}
    >
      {loading && iconPlacement === 'start'
        ? LoadingIcon
        : showIcon &&
          iconPlacement === 'start' && (
            <IGRPIcon
              iconName={iconName}
              className={iconClassName}
              size={computedIconSize}
              aria-hidden="true"
            />
          )}

      {loading && loadingText ? loadingText : children}

      {!loading && showIcon && iconPlacement === 'end' && (
        <IGRPIcon
          iconName={iconName}
          className={iconClassName}
          size={computedIconSize}
          aria-hidden="true"
        />
      )}

      {loading && iconPlacement === 'end' && LoadingIcon}
    </Button>
  );
}

export { IGRPButton, type IGRPButtonProps };

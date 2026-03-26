'use client';

import { useId, type ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';

import { Button, buttonVariants } from '../ui/button';
import { IGRPIcon } from './icon';
import { cn } from '../../lib/utils';
import type { IGRPBaseAttributes } from '../../types';

/**
 * Props for the IGRPButton component.
 * Extends button primitives with IGRP conventions: icons, loading state, and base attributes.
 * @see IGRPButton
 */
interface IGRPButtonProps
  extends
    Omit<React.ComponentProps<typeof Button>, 'name'>,
    VariantProps<typeof buttonVariants>,
    IGRPBaseAttributes {
  /** Button content. */
  children?: ReactNode;
  /** Render as child component (Radix composition). */
  asChild?: boolean;
  /** Show loading spinner and disable interaction. */
  loading?: boolean;
  /** Accessible text shown during loading state. */
  loadingText?: string;
}

/**
 * Horizon button with optional icon, loading state, and IGRP attributes.
 * Integrates with form context when used inside IGRPForm.
 */
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
  const ref = name ?? id ?? _id;

  const { size } = props;

  const computedIconSize =
    iconSize || (size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'icon' ? 18 : 16);

  const LoadingIcon = (
    <IGRPIcon iconName="LoaderCircle" className={cn('animate-spin')} aria-hidden="true" />
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
            <span className={cn('sr-only')}>{loadingText}</span>
          </>
        ) : (
          <IGRPIcon iconName={iconName} className={cn(iconClassName)} aria-hidden="true" />
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
              className={cn(iconClassName)}
              size={computedIconSize}
              aria-hidden="true"
            />
          )}

      {loading && loadingText ? loadingText : children}

      {!loading && showIcon && iconPlacement === 'end' && (
        <IGRPIcon
          iconName={iconName}
          className={cn(iconClassName)}
          size={computedIconSize}
          aria-hidden="true"
        />
      )}

      {loading && iconPlacement === 'end' && LoadingIcon}
    </Button>
  );
}

export { IGRPButton, type IGRPButtonProps };

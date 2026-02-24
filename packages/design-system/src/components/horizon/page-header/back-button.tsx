'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '../../primitives/button';
import { IGRPIcon, type IGRPIconName } from '../icon';
import { cn } from '../../../lib/utils';

type IGRPPageHeaderBackButtonPropsBase = Omit<
  React.ComponentProps<typeof Button>,
  'asChild' | 'onClick' | 'children'
> & {
  iconName?: IGRPIconName | string;
  ariaLabel?: string;
  showText?: boolean;
  text?: string;
  className?: string;
};

type IGRPPageHeaderBackButtonWithUrl = IGRPPageHeaderBackButtonPropsBase & {
  url?: string;
  useBrowserBack?: false;
  onClick?: never;
};

type IGRPPageHeaderBackButtonWithBrowserBack = IGRPPageHeaderBackButtonPropsBase & {
  url?: never;
  useBrowserBack: true;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

type IGRPPageHeaderBackButtonWithOnClick = IGRPPageHeaderBackButtonPropsBase & {
  url?: never;
  useBrowserBack?: false;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

type IGRPPageHeaderBackButtonProps =
  | IGRPPageHeaderBackButtonWithUrl
  | IGRPPageHeaderBackButtonWithBrowserBack
  | IGRPPageHeaderBackButtonWithOnClick;

function IGRPPageHeaderBackButton({
  url,
  iconName = 'ArrowLeft',
  ariaLabel = 'Go back',
  useBrowserBack = false,
  showText = false,
  text,
  variant = 'outline',
  size = 'icon',
  className,
  onClick,
  ...buttonProps
}: IGRPPageHeaderBackButtonProps) {
  const router = useRouter();

  const handleBrowserBack = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        router.back();
      }
    },
    [router, onClick],
  );

  const iconElement = (
    <IGRPIcon iconName={iconName} aria-hidden="true" className={cn('shrink-0')} />
  );

  const textElement = showText ? (
    <span className={cn(size === 'icon' && 'sr-only', 'ml-2')}>{text || ariaLabel}</span>
  ) : null;

  const buttonSize = showText && size === 'icon' ? 'default' : size;
  const buttonClassName = cn(showText && 'gap-2', className);

  // Browser back navigation
  if (useBrowserBack) {
    return (
      <Button
        variant={variant}
        size={buttonSize}
        aria-label={ariaLabel}
        onClick={handleBrowserBack}
        className={buttonClassName}
        {...buttonProps}
      >
        {iconElement}
        {textElement}
      </Button>
    );
  }

  // Custom onClick handler
  if (onClick) {
    return (
      <Button
        variant={variant}
        size={buttonSize}
        aria-label={ariaLabel}
        onClick={onClick}
        className={buttonClassName}
        {...buttonProps}
      >
        {iconElement}
        {textElement}
      </Button>
    );
  }

  // Link navigation (url may be undefined, falls back to browser back if not provided)
  if (url) {
    return (
      <Button
        variant={variant}
        size={buttonSize}
        asChild
        className={buttonClassName}
        {...buttonProps}
      >
        <Link href={url} aria-label={ariaLabel}>
          {iconElement}
          {textElement}
        </Link>
      </Button>
    );
  }

  // Fallback: if no url provided, use browser back
  return (
    <Button
      variant={variant}
      size={buttonSize}
      aria-label={ariaLabel}
      onClick={handleBrowserBack}
      className={buttonClassName}
      {...buttonProps}
    >
      {iconElement}
      {textElement}
    </Button>
  );
}

export { IGRPPageHeaderBackButton, type IGRPPageHeaderBackButtonProps };

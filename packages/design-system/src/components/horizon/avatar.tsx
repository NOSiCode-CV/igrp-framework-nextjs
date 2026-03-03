'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { useId } from 'react';

import { IGRPColors, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import type { IGRPBaseAttributes } from '../../types';
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';
import { IGRPBadge } from './badge';
import { IGRPIcon, type IGRPIconName } from './icon';

function convertFallback(fallback?: string) {
  return fallback
    ? fallback
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
    : '?';
}

const avatarVariants = cva('', {
  variants: {
    size: {
      sm: 'size-8 text-xs',
      md: 'size-12 text-sm',
      lg: 'size-16 text-base',
      xl: 'size-24 text-lg',
    },
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      '4xl': 'rounded-4xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    size: 'md',
    rounded: 'full',
  },
});

const iconVariants = cva(
  'absolute flex items-center justify-center rounded-full border-2 border-background bg-background',
  {
    variants: {
      size: {
        sm: 'size-4 -bottom-0.5 -right-0.5',
        md: 'size-5 -bottom-1 -right-1',
        lg: 'size-6 -bottom-1 -right-1',
        xl: 'size-7 -bottom-1 -right-1',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const statusVariants = cva('absolute bottom-0 right-0 rounded-full border-2 border-background', {
  variants: {
    size: {
      sm: 'size-2',
      md: 'size-3',
      lg: 'size-4',
      xl: 'size-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const badgeVariants = cva(
  'absolute flex items-center justify-center rounded-full border-2 text-xs px-0',
  {
    variants: {
      size: {
        sm: 'size-4 -top-1 -right-1',
        md: 'size-5 -top-1.5 -right-1.5',
        lg: 'size-6 -top-2 -right-2',
        xl: 'size-7 -top-2 -right-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

/**
 * Props for the IGRPAvatar component.
 * @see IGRPAvatar
 */
interface IGRPAvatarProps
  extends
    React.ComponentProps<typeof Avatar>,
    IGRPBaseAttributes,
    VariantProps<typeof avatarVariants> {
  /** Image URL for the avatar. */
  src?: string;
  /** Alt text for the image. */
  alt?: string;
  /** Fallback text (e.g. initials) when image fails to load. */
  fallback?: string;
  /** CSS classes for the fallback element. */
  fallbackClassName?: string;
  /** Icon name for fallback when hasFallbackIcon is true. */
  fallbackIcon?: IGRPIconName | string;
  /** Show icon instead of initials in fallback. */
  hasFallbackIcon?: boolean;
  /** Show status indicator dot. */
  hasStatus?: boolean;
  /** Color of the status indicator. */
  status: IGRPColorVariants;
  /** Show icon overlay (e.g. checkmark). */
  showIcon?: boolean;
  /** Icon name for the overlay. */
  iconName?: IGRPIconName | string;
  /** Show badge overlay with number or icon. */
  showBadge?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** Badge content (number). */
  badgeNumber?: number;
  /** Badge content (icon label). */
  iconNumber?: string;
  /** Badge color theme. */
  badgeColor: IGRPColorVariants;
  /** Icon color (hex). */
  iconColor: string;
  /** Show icon inside the badge. */
  badgeShowIcon?: boolean;
  /** Icon name for the badge. */
  badgeIconName?: string;
}

/**
 * Avatar with image, fallback, optional status indicator, icon overlay, or badge.
 * Supports size and rounded variants.
 */
function IGRPAvatar({
  src,
  alt = 'avatar',
  size = 'md',
  rounded = 'full',
  fallback,
  fallbackIcon = 'User',
  hasFallbackIcon = false,
  fallbackClassName,
  hasStatus = false,
  status = 'primary',
  showBadge = false,
  badgeColor = 'primary',
  badgeNumber = 6,
  badgeShowIcon = false,
  badgeIconName = 'Info',
  showIcon = false,
  iconName = 'Check',
  className,
  iconClassName,
  iconColor = '#000000',
  name,
  id,
  ...avatarProps
}: IGRPAvatarProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const colorClasses = IGRPColors['solid'][status];
  const upperFallBack = convertFallback(fallback);

  return (
    <div className={cn('relative', avatarVariants({ size, rounded }), className)} id={ref}>
      <Avatar className={cn('size-full')} {...avatarProps}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className={cn('text-sm font-medium', fallbackClassName)}>
          {hasFallbackIcon ? <IGRPIcon iconName={fallbackIcon} /> : upperFallBack}
        </AvatarFallback>
      </Avatar>

      {hasStatus && status && (
        <span
          className={cn(statusVariants({ size }), colorClasses.bgForeground)}
          aria-label={`Status: ${status}`}
        />
      )}

      {showIcon && iconName && (
        <span className={cn(iconVariants({ size }), iconClassName)} aria-label="Icon indicator">
          <IGRPIcon iconName={iconName} color={iconColor} />
        </span>
      )}

      {showBadge && badgeColor && (
        <IGRPBadge
          badgeClassName={cn(badgeVariants({ size }))}
          color={badgeColor}
          variant="solid"
          showIcon={badgeShowIcon}
          iconName={badgeIconName}
        >
          {badgeNumber}
        </IGRPBadge>
      )}
    </div>
  );
}

export { IGRPAvatar, type IGRPAvatarProps };

import { cva } from 'class-variance-authority';
import { IGRPBadge } from './badge';
import { IGRPIcon, type IGRPIconName } from './icon';
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';
import { IGRPColors, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import type { IGRPBaseAttributes,IGRPSize, IGRPRoundSize } from '../../types';

function convertFallback(fallback?: string) {
  const upperFallback = fallback
    ? fallback
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
    : 'AA';
  return upperFallback;
}

const avatarVariants = cva('', {
  variants: {
    size: {
      sm: 'size-8 text-xs',
      md: 'size-12 text-sm',
      lg: 'size-16 text-base',
      xl: 'size-24 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const avatarRounded = cva('', {
  variants: {
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
    rounded: 'md',
  },
});

const iconVariants = cva(
  'absolute flex items-center justify-center rounded-full border-2 border-background bg-background', 
  {
    variants: {
      size: {
        sm: 'size-4 -bottom-0.5 -right-0.5',
        md: 'size-5 -bottom-1 -right-1',
        lg: 'size-6 -bottom-1 -right-1"',
        xl: 'size-8 -bottom-1.5 -right-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
});

const statusVariants = cva('absolute rounded-full border-2 border-background',{
  variants: {
    size: {
      sm: 'size-2 bottom-0 right-0',
      md: 'size-3 bottom-0 right-0',
      lg: 'size-4 bottom-0 right-0',
      xl: 'size-5 bottom-0.5 right-0.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const badgeVariants = cva(
  "absolute flex items-center justify-center rounded-full border-2 text-[10px] font-medium px-0",
  {
    variants: {
      size: {
        sm: "size-4 -top-1 -right-1",
        md: "size-5 -top-1.5 -right-1.5",
        lg: "size-6 -top-2 -right-2",
        xl: "size-8 -top-2 -right-2",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

interface IGRPAvatarProps extends IGRPBaseAttributes {
  src?: string;
  size?: IGRPSize;
  alt?: string;
  fallback?: string;
  fallbackClassName?: string;
  fallbackIcon?: IGRPIconName | string;
  hasFallbackIcon?: boolean;
  hasStatus?: boolean;
  status: IGRPColorVariants;
  showIcon?: boolean;
  iconName?: IGRPIconName;
  showBadge?: boolean;
  className?: string;
  badgeNumber?: number;
  iconNumber?: string;
  badgeColor: IGRPColorVariants;
  iconColor: string
  badgeShowIcon?: boolean;
  badgeIconName?: string;
  roundedSize?: IGRPRoundSize;
}
function IGRPAvatar({
  src = 'igrp',
  alt = 'avatar',
  fallback,
  hasStatus = false,
  showBadge = false,
  status = 'primary',
  showIcon = false,
  iconName = 'Check',
  className,
  iconClassName,
  size = "md",
  fallbackIcon = 'User',
  hasFallbackIcon = false,
  fallbackClassName,
  badgeColor = 'primary',
  badgeNumber = 6,
  badgeShowIcon = false,
  badgeIconName = 'Info',
  roundedSize = 'full',
  iconColor = '#000000',
}: IGRPAvatarProps) {
  const colorClasses = IGRPColors['solid'][status]
  const upperFallBack = convertFallback(fallback);
  
  return (
    <div className="relative inline-block">
      <Avatar 
        className={cn(
          avatarVariants({ size }), 
          avatarRounded({ rounded: roundedSize }), 
          className
        )}
      >
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback 
          className={cn(
            avatarRounded({ rounded: roundedSize }), 
            'p-2', 
            fallbackClassName
          )}
        >
          {hasFallbackIcon 
            ? <IGRPIcon iconName={fallbackIcon} className={cn(avatarVariants({ size }))} />
            : upperFallBack
          }
        </AvatarFallback>
      </Avatar>
        {hasStatus && (
          <span 
            className={cn(statusVariants({ size }), colorClasses.bgForeground)}
            aria-label="Status indicator"
          />          
        )}
        {showIcon && (
          <span className={cn(iconVariants({ size }), iconClassName)} aria-label="Icon indicator">
            <IGRPIcon
              iconName={iconName}
              color={iconColor}   
            />
          </span>
        )}
        {showBadge && (
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

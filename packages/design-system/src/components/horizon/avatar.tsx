import { cva } from 'class-variance-authority';
import { IGRPBadge } from './badge';
import { IGRPIcon, type IGRPIconName } from './icon';
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';
import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import type { IGRPBaseAttributes,IGRPSize, IGRPRoundSize } from '../../types';
import { igrpRoundedSizeMapping } from '../../lib/constants';

function convertFallback(fallback?: string) {
  const upperFallback = fallback
    ? fallback
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
    : ' ';
  return upperFallback;
}

const sizeClasses = cva('',{
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-12 w-12 text-sm',
      lg: 'h-16 w-16 text-base',
      xl: 'h-24 w-24 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const iconSize = cva('',{
  variants: {
    size: {
      sm: 'h-3 w-3 text-xs',
      md: 'h-5 w-5 text-sm',
      lg: 'h-6 w-6 text-base',
      xl: 'h-10 w-10 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const iconPosition = cva('',{
  variants: {
    size: {
      sm: '-top-1 left-5',
      md: '-top-1 left-8',
      lg: '-top-3 left-11',
      xl: '-top-4 left-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const statusPosition = cva('',{
  variants: {
    size: {
      sm: 'left-5',
      md: 'left-8',
      lg: 'left-11',
      xl: '-end-2.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface IGRPAvatarProps extends IGRPBaseAttributes {
  src?: string;
  size?: IGRPSize;
  alt?: string;
  fallback?: string;
  fallbackClassName?: string;
  fallbackIcon?: IGRPIconName;
  hasFallbackIcon?: boolean;
  hasStatus?: boolean;
  status: IGRPColorVariants;
  showIcon?: boolean;
  iconName?: IGRPIconName;
  showBadge?: boolean;
  className?: string;
  badgeNumber?: number;
  iconNumber?: string;
  multiple?: number;
  badgeColor: IGRPColorVariants;
  iconColor: string
  badgeVariant?: IGRPColorRole;
  badgeShowIcon?: boolean;
  badgeIconName?: string;
  borderRadius?: IGRPRoundSize;
}
function IGRPAvatar({
  src = 'igrp',
  alt = 'avatar',
  fallback,
  hasStatus = false,
  showBadge = false,
  status = 'primary',
  showIcon,
  iconName = 'Check',
  className,
  iconClassName,
  size = "md",
  fallbackIcon = 'User',
  hasFallbackIcon = false,
  fallbackClassName,
  badgeColor = 'primary',
  badgeVariant = 'solid',
  badgeNumber = 6,
  badgeShowIcon = false,
  badgeIconName = 'Info',
  borderRadius = 'full',
  iconColor = '#000000',
}: IGRPAvatarProps) {
  const colorClasses = IGRPColors['solid'][status];
  const upperFallBack = convertFallback(fallback);
  const br = igrpRoundedSizeMapping[borderRadius];
  
  return (
    <div className={cn('flex items-center justify-center rounded-full p-1 w-10 h-10')}>
      <Avatar className={cn('overflow-visible', className, sizeClasses({ size }))}>
        <AvatarImage src={src} className={cn(' ', br)} alt={alt} />
        <AvatarFallback className={cn('', br)}>
          {hasFallbackIcon && (
            <IGRPIcon iconName={fallbackIcon} className={cn(sizeClasses({ size }), fallbackClassName)} />
          )}
          {!hasFallbackIcon && upperFallBack}
        </AvatarFallback>
        {hasStatus && (
          <span
            className={cn(
              'border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2',
              statusPosition({ size }),
              iconSize({ size }),
              colorClasses.bgForeground ? colorClasses.bgForeground : '',
            )}
          >
            <span className="sr-only"></span>
          </span>
        )}
        {showIcon && (
          <div className={cn('absolute border-2 bg-white',iconSize({ size }), iconPosition({ size }), iconClassName)}>
            <IGRPIcon
              iconName={iconName}
              color={iconColor}
              size={iconSize({ size })}
              className={cn(iconClassName)}
            />
          </div>
        )}
        {showBadge && !showIcon && (
          <IGRPBadge
            badgeClassName={cn('absolute -top-2 left-full min-w-5 -translate-x-3 px-1',iconPosition({ size }), iconSize({ size }))}
            color={badgeColor}
            variant={badgeVariant}
            showIcon={badgeShowIcon}
            iconName={badgeIconName}
          >
            {badgeNumber}
          </IGRPBadge>
        )}
      </Avatar>
    </div>
  );
}
export { IGRPAvatar, type IGRPAvatarProps };

// import { Badge } from 'lucide-react';
import type { IGRPBaseAttributes } from '../../types';
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';
import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { IGRPIcon } from './icon';
import { Button } from '../primitives/button';
import {  IGRPBadge } from './badge';

interface IGRPAvatarProps extends IGRPBaseAttributes  {
  src?: string;
  size?:string;
  alt?: string;
  fallback?: string;
  fallbackClassName?: string;
  fallbackIcon?: string;
  hasFallbackIcon?: boolean;
  hasStatus?: boolean;
  status: IGRPColorVariants;
  showIcon?: boolean;
  iconName?: string;
  showBadge?: boolean;
  className?: string,
  badgeNumber?: number;
  iconNumber?: string;
  multiple?: number;
  badgeColor: IGRPColorVariants;
  badgeVariant?: IGRPColorRole;
  badgeShowIcon?: boolean;
  badgeIconName ?: string;
  differentRadius?: string;
}
function IGRPAvatar({
  src ="igrp",
  fallback,
  hasStatus = false,
  showBadge = false,
  status = 'primary',
  showIcon,
  iconName = 'Check',
  className,
  iconClassName,
  size ='md',
  fallbackIcon = 'User',
  hasFallbackIcon = false,
  fallbackClassName,
  badgeColor = 'primary',
  badgeVariant = 'solid',
  badgeNumber =  6,
  badgeShowIcon = false,
  badgeIconName = 'Info',
  differentRadius = 'rounded-full',
}: IGRPAvatarProps) {
  const colorClasses = IGRPColors['solid'][status];
  const upperFallBack = fallback ?  
    fallback.split(" ")
    .slice(0,2)                  
    .map(word => word.charAt(0))
    .join("")        
    .toUpperCase() : " " ; 

    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-12 w-12 text-sm',
      lg: 'h-16 w-16 text-base',
      xl: 'h-24 w-24 text-lg',
    }[size]
  
    const iconSize = {
      sm: 'h-3 w-3',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-10 w-10',
    }[size]

    const iconPosition ={
       sm: '-top-1 left-5',
       md: '-top-1 left-8',
       lg: '-top-3 left-11',
       xl: '-top-4 left-16',
    }[size]

    const statusPosition ={
       sm: '-top-1 left-5',
       md: '-top-1 left-8',
       lg: '-top-3 left-11',
       xl: '-top-4 -end-2.5',
    }[size]

  
  return (
    <div className={cn('flex items-center justify-center rounded-full p-1 w-10 h-10')}>
      <Avatar className={cn('overflow-visible', className,sizeClasses)}>
        <AvatarImage src={src} className={cn(' ',differentRadius)} alt="avatar"  />
        <AvatarFallback 
        //  style={{ '--size': `${size}px` } as React.CSSProperties}
           className={cn('',differentRadius)}
        >
          {hasFallbackIcon && (
          <IGRPIcon iconName={fallbackIcon}    
            // style={{ '--size': `${size}px` } as React.CSSProperties}
            className={cn(sizeClasses,fallbackClassName)} //'top-[calc(var(size)*0.05)] left-[calc(var(size)*0.05)]'
 
            />)}
            {!hasFallbackIcon && upperFallBack}
        </AvatarFallback>
        {hasStatus && (
          <span
            className={cn(
              'border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500',
              colorClasses.bgForeground ? colorClasses.bgForeground : '',iconSize
            )}
          >
            <span className="sr-only"></span>
          </span>
        )}
        {showIcon && (
          <div className={cn('absolute border-2 bg-white',iconPosition,iconClassName)}>
            <IGRPIcon iconName={iconName} className={cn(iconSize,iconClassName  )}
              style={{ '--size': `${size}px` } as React.CSSProperties}
            />
          </div>
        )}  
        {showBadge && !showIcon && (
          <IGRPBadge
              badgeClassName={cn('absolute -top-2 left-full min-w-5 -translate-x-3 px-1',iconSize)}
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
export { IGRPAvatar, type IGRPAvatarProps ,Button};

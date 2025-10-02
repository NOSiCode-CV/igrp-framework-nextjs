// import { Badge } from 'lucide-react';
import type { IGRPBaseAttributes } from '../../types';
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';
import { IGRPColors, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { IGRPIcon } from './icon';
import { Button } from '../primitives/button';

interface IGRPAvatarProps extends IGRPBaseAttributes  {
  src?: string;
  size?:number;
  alt?: string;
  fallback?: string;
  fallbackIcon?: string;
  hasFallbackIcon?: boolean;
  hasStatus?: boolean;
  status: IGRPColorVariants;
  showIcon?: boolean;
  iconName?: string;
  showBadge?: boolean;
  className?: string,
  imageClassName?: string,
  badgeNumber?: number;
  iconNumber?: number;
  multiple?: number;
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
  imageClassName,
  badgeNumber =  6,
  size = 32,
  fallbackIcon = 'User',
  hasFallbackIcon = false,
  iconSize = 16
}: IGRPAvatarProps) {
  const colorClasses = IGRPColors['solid'][status];
 // const positionIcon = iconPlacement === 'start' ? 'start-0' : 'end-0 pe-3';
  const upperFallBack = fallback ?  
    fallback.split(" ")
    .slice(0,2)                  
    .map(word => word.charAt(0))
    .join("")        
    .toUpperCase() : " " ; 
  
  //const positionParentIcon = iconPlacement === 'start' ? 'ps-9' : 'pe-9';
  return (
    <div className='flex items-center justify-center  p-1 w-10 h-10'>
      <Avatar className={cn('overflow-visible', className)}  
        style={{
          height:size,
          width:size,
        }} >
        <AvatarImage src={src} className={cn('', imageClassName)} alt="avatar"  />
        <AvatarFallback>
          {hasFallbackIcon && (
          <IGRPIcon iconName={fallbackIcon}   
              style={{
                height:size * 0.625,
                width:size * 0.625,
                top: `${size * 0.05}px`,   // 5% from top
                left: `${size * 0.05}px`,  // 5% from left
              }} 
            />)}
            {!hasFallbackIcon && upperFallBack}
        </AvatarFallback>
        {hasStatus && (
          <span
            style={{
              height:size * 0.375,
              width: size * 0.375,
            }} 
            className={cn(
              'border-background absolute -end-0.5 -bottom-0.5 size-3  border-2 bg-emerald-500',
              colorClasses.bgForeground ? colorClasses.bgForeground : '',
            )}
          >
            <span className="sr-only"></span>
          </span>
        )}
        {showIcon && (
          <div className={cn('absolute -top-2 left-5   border-2 bg-white')}>
          <IGRPIcon iconName={iconName} className={iconClassName}  
              style={{
                height: iconSize, //size * 0.625,
                width:iconSize, //,size * 0.625,
                top: `${size * 0.05}px`,   // 5% from top
                left: `${size * 0.05}px`,  // 5% from left
              }} 
            />
          </div>
        )}
        {showBadge && !showIcon && (
          <div className={cn('inline-flex items-center justify-center  border text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] leading-normal bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-background absolute -top-2 left-full min-w-5 -translate-x-3 px-1')}>
            {badgeNumber}
          </div>
        )}
      </Avatar>
    </div>
  );
}
export { IGRPAvatar, type IGRPAvatarProps ,Button};

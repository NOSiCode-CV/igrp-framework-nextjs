'use client';

import { IGRPStatsCard, type IGRPStatsCardProps } from '@/components/igrp/stats-card';
import type { IGRPColorVariants } from '@/lib/colors';
import { IGRPColors } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface StatsCardMiniProps
  extends Omit<
    IGRPStatsCardProps,
    | 'cardBorder'
    | 'cardBorderPosition'
    | 'cardVariant'
    | 'iconShowBackground'
    | 'iconBackground'
    | 'iconBackgroundBorder'
    | 'iconVariant'
    | 'titleColor'
    | 'valueColor'
  > {
  variant?: IGRPColorVariants;
}

function StatsCardMini({
  title,
  titleSize = 'sm',
  titleClassName,
  value,
  valueSize = '2xl',
  valueClassName,
  iconName,
  image,
  imageAlt,
  iconClassName,
  className,
  onClick,
  variant = 'primary',
  ...props
}: StatsCardMiniProps) {
  const color = IGRPColors.outline[variant];

  return (
    <IGRPStatsCard
      {...props}
      className={className}
      onClick={onClick}
      title={title}
      titleSize={titleSize}
      titleClassName={titleClassName}
      value={value}
      valueSize={valueSize}
      valueClassName={cn('font-semibold', color.text, valueClassName)}
      iconName={iconName}
      image={image}
      imageAlt={imageAlt}
      showIconBackground={false}
      iconPlacement='start'
      iconBackground='square'
      showIconBorder={true}
      iconVariant='primary'
      iconClassName={cn('border', 'border-solid', 'rounded-md', color.text, iconClassName)}
      cardBorder='rounded-xl'
      cardBorderPosition='none'
      cardVariant='primary'
    />
  );
}

export { StatsCardMini, type StatsCardMiniProps };

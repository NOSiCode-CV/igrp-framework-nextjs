'use client';

import { useId } from 'react';

import { IGRPColors, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { IGRPStatsCard, type IGRPStatsCardProps } from '../horizon/stats-card';

interface StatsCardMiniProps extends Omit<
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
  name,
  id,
  ...props
}: StatsCardMiniProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const color = IGRPColors.outline[variant];

  return (
    <IGRPStatsCard
      {...props}
      id={ref}
      className={cn(className)}
      onClick={onClick}
      title={title}
      titleSize={titleSize}
      titleClassName={cn(titleClassName)}
      value={value}
      valueSize={valueSize}
      valueClassName={cn('font-semibold', color.text, valueClassName)}
      iconName={iconName}
      image={image}
      imageAlt={imageAlt}
      showIconBackground={false}
      iconPlacement="start"
      iconBackground="square"
      showIconBorder={true}
      iconVariant="primary"
      iconClassName={cn('border', 'border-solid', 'rounded-md', color.text, iconClassName)}
      cardBorder="rounded-xl"
      cardBorderPosition="none"
      cardVariant="primary"
    />
  );
}

export { StatsCardMini, type StatsCardMiniProps };

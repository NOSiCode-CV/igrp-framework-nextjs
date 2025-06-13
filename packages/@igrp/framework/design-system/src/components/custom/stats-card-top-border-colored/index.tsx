import { IGRPStatsCard, type IGRPStatsCardProps } from '@/components/igrp';

function IGRPStatsCardTopBorderColored({
  cardVariant,
  title,
  value,
  className,
  iconClassName,
  iconName,
}: Pick<
  IGRPStatsCardProps,
  'cardVariant' | 'title' | 'value' | 'className' | 'iconClassName' | 'iconName'
>) {
  return (
    <IGRPStatsCard
      title={title}
      value={value}
      iconVariant={cardVariant}
      className={className}
      iconClassName={iconClassName}
      iconName={iconName}
      cardBorder='rounded-lg'
      cardBorderPosition='top'
      cardVariant={cardVariant}
      iconPlacement='end'
      itemPlacement='start'
      iconBackground='rounded'
      showIconBackground={true}
      iconSize='sm'
      titleClassName='text-muted-foreground'
      titleSize='xs'
      valueSize='2xl'
    />
  );
}

export { IGRPStatsCardTopBorderColored };

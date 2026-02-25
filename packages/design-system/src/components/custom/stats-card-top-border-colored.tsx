import { useId } from 'react';
import { IGRPStatsCard, type IGRPStatsCardProps } from '../horizon/stats-card';
import { cn } from '../../lib/utils';

function IGRPStatsCardTopBorderColored({
  cardVariant,
  title,
  value,
  className,
  iconClassName,
  iconName,
  name,
  id,
}: Pick<
  IGRPStatsCardProps,
  'cardVariant' | 'title' | 'value' | 'className' | 'iconClassName' | 'iconName' | 'name' | 'id'
>) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  return (
    <IGRPStatsCard
      title={title}
      value={value}
      iconVariant={cardVariant}
      className={cn(className)}
      iconClassName={cn(iconClassName)}
      iconName={iconName}
      cardBorder="rounded-lg"
      cardBorderPosition="top"
      cardVariant={cardVariant}
      iconPlacement="end"
      itemPlacement="start"
      iconBackground="rounded"
      showIconBackground={true}
      iconSize="sm"
      titleClassName={cn('text-muted-foreground')}
      titleSize="xs"
      valueSize="2xl"
      id={ref}
    />
  );
}

export { IGRPStatsCardTopBorderColored };

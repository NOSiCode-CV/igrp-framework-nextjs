'use client';

import { Fragment, useId } from 'react';

import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { IGRPIcon, type IGRPIconName } from './icon';

/**
 * Single info field (label + value).
 * @see IGRPInfoCard
 */
interface IGRPInfoItem {
  /** Field label. */
  label: string;
  /** Field value. */
  text: string;
  /** Icon name. */
  icon?: IGRPIconName | string;
  /** CSS classes for the icon. */
  iconClassName?: string;
  /** Whether to show the icon. */
  showIcon?: boolean;
  /** Color variant for the item. */
  variantItem?: IGRPColorRole;
  /** Color theme for the item. */
  colorItem?: IGRPColorVariants;
}

/**
 * Section grouping multiple info items.
 * @see IGRPInfoCard
 */
interface IGRPInfoSection {
  /** Items in this section. */
  items: IGRPInfoItem[];
}

/**
 * Props for the IGRPInfoCard component.
 * @see IGRPInfoCard
 */
interface IGRPInfoCardProps {
  /** Card title. */
  title?: string;
  /** CSS classes for the title. */
  titleClassName?: string;
  /** Additional CSS classes. */
  className?: string;
  /** CSS classes for the content area. */
  contentClassName?: string;
  /** Sections of info items. */
  sections: IGRPInfoSection[];
  /** Color variant for sections. */
  variantSection?: IGRPColorRole;
  /** Color theme for sections. */
  colorSection?: IGRPColorVariants;
  /** Layout orientation. */
  orientation?: 'horizontal' | 'vertical';
  /** HTML id attribute. */
  id?: string;
}

/**
 * Card displaying labeled info sections with optional icons.
 */
function IGRPInfoCard({
  title,
  titleClassName,
  className,
  contentClassName,
  sections,
  variantSection = 'outline',
  colorSection = 'primary',
  // orientation = 'vertical',
  id,
}: IGRPInfoCardProps) {
  const _id = useId();
  const ref = id ?? _id;

  const infoCardClass = IGRPColors[variantSection][colorSection];

  return (
    <Card className={cn(infoCardClass.bg, className)} id={ref}>
      <CardHeader>
        <CardTitle
          className={cn('text-2xl font-semibold leading-none tracking-tight', titleClassName)}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('flex flex-col gap-4', contentClassName)}>
        {sections.map((section, sectionIndex) => (
          <Fragment key={sectionIndex}>
            {section.items.map((item, itemIndex) => (
              <IGRPInfoField key={itemIndex} item={item} />
            ))}
            {sectionIndex < sections.length - 1 && <Separator />}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Props for the internal IGRPInfoField component.
 */
interface IGRPInfoFieldProps {
  /** Info item to render. */
  item: IGRPInfoItem;
}

/** Renders a single info field (label + value). */
function IGRPInfoField({ item }: IGRPInfoFieldProps) {
  // const colorClass = IGRPColors[item.variantItem || 'solid'][item.colorItem || 'primary'];

  return (
    <div className={cn('flex flex-col gap-0.5' /*, colorClass.text*/)}>
      <span className={cn('text-sm font-medium')}>{item.label}</span>
      <div className={cn('flex items-center gap-2')}>
        {item.showIcon && item.icon && (
          <div className={cn('flex items-center gap-2')}>
            <IGRPIcon iconName={item.icon} className={cn(item.iconClassName)} />
          </div>
        )}
        <span>{item.text}</span>
      </div>
    </div>
  );
}

export { IGRPInfoCard, type IGRPInfoCardProps, type IGRPInfoItem, type IGRPInfoSection };

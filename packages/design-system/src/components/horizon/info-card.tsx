import { Fragment } from 'react';

import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../primitives/card';
import { Separator } from '../primitives/separator';
import { IGRPIcon, type IGRPIconName } from './icon';

interface IGRPInfoItem {
  label: string;
  text: string;
  icon?: IGRPIconName | string;
  iconClassName?: string;
  showIcon?: boolean;
  variantItem?: IGRPColorRole;
  colorItem?: IGRPColorVariants;
}

interface IGRPInfoSection {
  items: IGRPInfoItem[];
}

interface IGRPInfoCardProps {
  title?: string;
  titleClassName?: string;
  className?: string;
  sections: IGRPInfoSection[];
  variantSection?: IGRPColorRole;
  colorSection?: IGRPColorVariants;
  orientation?: 'horizontal' | 'vertical';
}

function IGRPInfoCard({
  title,
  titleClassName,
  className,
  sections,
  variantSection = 'solid',
  colorSection = 'primary',
  orientation = 'vertical',
}: IGRPInfoCardProps) {
  const infoCardClass = IGRPColors[variantSection][colorSection];

  return (
    <Card className={cn(infoCardClass, className)}>
      <CardHeader>
        <CardTitle
          className={cn('text-2xl font-semibold leading-none tracking-tight', titleClassName)}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent 
        className={cn(
          "flex gap-4",
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        )}
      >
        {sections.map((section, sectionIndex) => (
          <Fragment key={sectionIndex}>
            {section.items.map((item, itemIndex) => (
              <IGRPInfoField
                key={itemIndex}
                item={item}                
              />
            ))}
            {sectionIndex < sections.length - 1 && <Separator />}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
}

interface IGRPInfoFieldProps {
  item: IGRPInfoItem;
}

function IGRPInfoField({
  item,  
}: IGRPInfoFieldProps) {
  const colorClass = IGRPColors[item.variantItem || 'solid'][item.colorItem || 'primary'];

  return (
    <div className={cn('flex flex-col gap-0.5', colorClass.text)}>
      <span className="text-sm font-medium">{item.label}</span>
      <div className="flex items-center gap-2">
        {item.showIcon && item.icon && (
          <div className="flex items-center gap-2">
            <IGRPIcon iconName={item.icon} className={item.iconClassName} />
          </div>
        )}
        <span>{item.text}</span>
      </div>
    </div>
  );
}

export { 
  IGRPInfoCard, 
  type IGRPInfoCardProps, 
  type IGRPInfoItem, 
  type IGRPInfoSection 
};
import { Fragment } from 'react';
// import { cva, type VariantProps } from "class-variance-authority"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/horizon/card';
import { Separator } from '@/components/primitives/separator';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '@/lib/colors';
import { cn } from '@/lib/utils';

// const igrpInfoCardVariants = cva('', {
//   variants: {
//     size: {
//       sm: 'text-sm leading-5',
//       default: 'text-base leading-6',
//       lg: 'text-lg leading-7',
//       xl: 'text-xl leading-8',
//     },
//     weight: {
//       light: 'font-light',
//       normal: 'font-normal',
//       medium: 'font-medium',
//       semibold: 'font-semibold',
//       bold: 'font-bold',
//     },
//     spacing: {
//       tight: 'mb-2',
//       normal: 'mb-4',
//       loose: 'mb-6',
//       none: 'mb-0',
//     },
//   },
//   defaultVariants: {
//     size: 'default',
//     weight: 'normal',
//     spacing: 'tight',
//   },
// });

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

interface IGRPInfoCardProps /*extends VariantProps<typeof igrpInfoCardVariants>*/ {
  title?: string;
  titleClassName?: string;
  className?: string;
  sections: IGRPInfoSection[];
  variantSection?: IGRPColorRole;
  colorSection?: IGRPColorVariants;
}

function IGRPInfoCard({
  title,
  titleClassName,
  className,
  sections,
  variantSection = 'solid',
  colorSection = 'primary',
  // size,
  // weight,
  // spacing
}: IGRPInfoCardProps) {
  const infoCardClass = IGRPColors[variantSection][colorSection];

  return (
    <Card className={cn('py-6', infoCardClass, className)}>
      <CardHeader>
        <CardTitle
          className={cn('text-2xl font-semibold leading-none tracking-tight', titleClassName)}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {sections.map((section, sectionIndex) => (
          <Fragment key={sectionIndex}>
            {section.items.map((item, itemIndex) => (
              <IGRPInfoField
                key={itemIndex}
                item={item}
                // size={size}
                // weight={weight}
                // spacing={spacing}
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
  // size: VariantProps<typeof igrpInfoCardVariants>['size'],
  // weight: VariantProps<typeof igrpInfoCardVariants>['weight'],
  // spacing: VariantProps<typeof igrpInfoCardVariants>['spacing'],
}

function IGRPInfoField({
  item,
  // size,
  // weight,
  // spacing
}: IGRPInfoFieldProps) {
  const colorClass = IGRPColors[item.variantItem || 'solid'][item.colorItem || 'primary'];

  return (
    <div
      className={cn(
        'flex flex-col space-y-0.5',
        colorClass.text,
        // igrpInfoCardVariants({ size, weight, spacing }),
      )}
    >
      <span className='text-sm font-medium'>{item.label}</span>
      <div className='flex items-center gap-2'>
        {item.showIcon && item.icon && (
          <div className='flex items-center gap-2'>
            <IGRPIcon
              iconName={item.icon}
              className={item.iconClassName}
            />
          </div>
        )}
        <span>{item.text}</span>
      </div>
    </div>
  );
}

export { IGRPInfoCard, type IGRPInfoCardProps, type IGRPInfoItem, type IGRPInfoSection };

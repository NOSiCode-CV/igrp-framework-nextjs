/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFieldArray, useWatch, type FieldArrayWithId } from 'react-hook-form';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/primitives/accordion';
import { Button } from '@/components/horizon/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/horizon/card';
import { IGRPBadge, type IGRPBadgeProps } from '@/components/igrp/badge';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { type IGRPBaseAttributes } from '@/types/globals';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface IGRPFormListProps<TItem>
  extends Omit<IGRPBaseAttributes, 'name' | 'iconPlacement' | 'helperText'>,
    Partial<IGRPBadgeProps> {
  id: string;
  name: string;
  defaultItem: TItem;
  description?: string;
  renderItem: (item: TItem, index: number) => React.ReactNode;
  computeLabel?: (item: TItem, index: number) => string;
  badgeValue?: string;
  className?: string;
  addButtonLabel?: string;
  addButtonIconName?: IGRPIconName | string;
  badgeClassName?: string;
}

function IGRPFormList<TItem>({
  id,
  ref,
  name,
  defaultItem,
  description,
  renderItem,
  computeLabel,
  badgeValue,
  className,
  label,
  labelClassName,
  iconName = 'ChevronDown',
  iconClassName,
  iconSize,
  showIcon = true,
  dot = false,
  variant,
  color,
  badgeClassName,
  addButtonLabel = 'Adicionar',
  addButtonIconName = 'Plus',
}: IGRPFormListProps<TItem>) {
  const [openItem, setOpenItem] = useState<string | undefined>('item-0');
  const { fields, append, remove } = useFieldArray({ name });
  const values = useWatch({ name }) ?? [];

  useEffect(() => {
    if (fields.length === 0) {
      append(defaultItem);
      setOpenItem('item-0');
    }
  }, [append, defaultItem, fields.length]);

  return (
    <Card
      className={cn('shadow-sm gap-0 rounded-md', className)}
      ref={ref}
      id={id}
    >
      <CardHeader className='py-3 px-4 border-b flex flex-row items-center justify-between'>
        <div className='flex items-center gap-2'>
          {showIcon && (
            <IGRPIcon
              iconName={iconName}
              size={iconSize}
              className={cn('h-4 w-4 text-muted-foreground', iconClassName)}
            />
          )}
          <div>
            <CardTitle className={cn('text-sm font-medium', labelClassName)}>{label}</CardTitle>
            {description && <CardDescription className='text-xs'>{description}</CardDescription>}
          </div>
        </div>
        {badgeValue && (
          <IGRPBadge
            variant={variant}
            color={color}
            dot={dot}
            badgeClassName={badgeClassName}
          >
            {badgeValue}
          </IGRPBadge>
        )}
      </CardHeader>

      <CardContent className='p-4'>
        <Accordion
          type='single'
          collapsible
          value={openItem}
          onValueChange={setOpenItem}
          className='w-full'
        >
          {fields.map((field: FieldArrayWithId<any, any>, index: number) => (
            <AccordionItem
              key={field.id}
              value={`item-${index}`}
              className='border last:border-b rounded-sm mb-4'
            >
              <div className='flex justify-between items-center px-4'>
                <div className='flex-1'>
                  <AccordionTrigger className='hover:no-underline'>
                    <span className='font-medium text-sm'>
                      {computeLabel?.(values[index] ?? defaultItem, index) ??
                        `${label} ${index + 1}`}
                    </span>
                  </AccordionTrigger>
                </div>

                {fields.length > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    className='h-7 w-7 p-0 ml-2 shrink-0'
                  >
                    <IGRPIcon
                      iconName='Trash2'
                      className='h-4 w-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                      strokeWidth={2}
                    />
                  </Button>
                )}
              </div>

              <AccordionContent className='px-4 pb-4'>
                {renderItem(values[index] ?? defaultItem, index)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button
          type='button'
          variant='outline'
          onClick={() => {
            append(defaultItem);
            setOpenItem(`item-${fields.length}`);
          }}
          className='w-full'
        >
          <IGRPIcon
            iconName={addButtonIconName}
            className='h-4 w-4 mr-1'
            strokeWidth={2}
          />
          <span>
            {addButtonLabel} {label}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}

export { IGRPFormList, type IGRPFormListProps };

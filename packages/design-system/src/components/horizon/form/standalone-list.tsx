'use client';

import { useCallback, useEffect, useId, useState } from 'react';

import { cn } from '../../../lib/utils';
import { type IGRPBaseAttributes } from '../../../types';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../primitives/accordion';
import { Button } from '../../primitives/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../primitives/card';
import { IGRPBadge, type IGRPBadgeProps } from '../badge';
import { IGRPIcon, type IGRPIconName } from '../icon';

interface IGRPStandaloneListProps<TItem>
  extends Omit<IGRPBaseAttributes, 'iconPlacement' | 'helperText'>,
    Partial<Pick<IGRPBadgeProps, 'variant' | 'color' | 'dot' | 'badgeClassName'>> {
  id: string;
  defaultItem: TItem;
  description?: string;
  renderItem: (item: TItem, index: number, onChange: (item: TItem) => void) => React.ReactNode;
  computeLabel?: (item: TItem, index: number) => string;
  badgeValue?: string;
  className?: string;
  addButtonLabel?: string;
  addButtonIconName?: IGRPIconName | string;
  badgeClassName?: string;
  value?: TItem[];
  defaultValue?: TItem[];
  onChange?: (items: TItem[]) => void;
}

function IGRPStandaloneList<TItem>({
  id,
  defaultItem,
  description,
  renderItem,
  computeLabel,
  badgeValue,
  className,
  label,
  labelClassName,
  iconName = '',
  iconClassName,
  iconSize,
  showIcon = true,
  dot = false,
  variant,
  color,
  badgeClassName,
  addButtonLabel = 'Adicionar',
  addButtonIconName = 'Plus',
  value,
  defaultValue,
  onChange,
}: IGRPStandaloneListProps<TItem>) {
  const _id = useId();
  const groupId = id ?? _id;

  const [items, setItems] = useState<TItem[]>(defaultValue ?? []);
  const [openItem, setOpenItem] = useState<string | undefined>(
    items.length > 0 ? 'item-0' : undefined,
  );

  // Sync with controlled value prop
  useEffect(() => {
    if (value !== undefined) {
      setItems(value);
    }
  }, [value]);

  // Initialize with default item if empty (only when value is undefined)
  useEffect(() => {
    if (items.length === 0 && value === undefined) {
      setItems([defaultItem]);
      setOpenItem('item-0');
      onChange?.([defaultItem]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update open item when items change (safety net for edge cases)
  useEffect(() => {
    if (items.length > 0) {
      if (openItem) {
        const itemIndex = parseInt(openItem.replace('item-', ''), 10);
        if (itemIndex >= items.length) {
          setOpenItem('item-0');
        }
      }
      // Allow openItem to be undefined when user collapses the accordion
    } else {
      setOpenItem(undefined);
    }
  }, [items.length, openItem]);

  const handleItemChange = useCallback(
    (index: number, updatedItem: TItem) => {
      const newItems = [...items];
      newItems[index] = updatedItem;
      setItems(newItems);
      onChange?.(newItems);
    },
    [items, onChange],
  );

  const handleAdd = useCallback(() => {
    const newItems = [...items, defaultItem];
    setItems(newItems);
    setOpenItem(`item-${items.length}`);
    onChange?.(newItems);
  }, [items, defaultItem, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      if (items.length > 1) {
        const wasOpen = openItem === `item-${index}`;

        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onChange?.(newItems);

        if (wasOpen) {
          // After removal, we'll have at least one item (since length > 1 check)
          const newIndex = Math.max(0, index - 1);
          setOpenItem(`item-${newIndex}`);
        } else if (openItem) {
          const currentIndex = parseInt(openItem.replace('item-', ''), 10);
          if (index < currentIndex && currentIndex > 0) {
            setOpenItem(`item-${currentIndex - 1}`);
          }
        }
      }
    },
    [items, onChange, openItem],
  );

  return (
    <Card className={cn('shadow-sm gap-0 rounded-lg py-0', className)} id={groupId}>
      <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {showIcon && iconName && (
            <IGRPIcon
              iconName={iconName}
              size={iconSize}
              className={cn('size-4 text-muted-foreground', iconClassName)}
            />
          )}
          <div>
            <CardTitle className={cn('text-sm font-medium', labelClassName)}>{label}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
        </div>
        {badgeValue && (
          <IGRPBadge variant={variant} color={color} dot={dot} badgeClassName={badgeClassName}>
            {badgeValue}
          </IGRPBadge>
        )}
      </CardHeader>

      <CardContent className="p-4">
        <Accordion
          type="single"
          collapsible
          value={openItem}
          onValueChange={setOpenItem}
          className="w-full"
        >
          {items.map((item, index) => (
            <AccordionItem
              key={`item-${index}`}
              value={`item-${index}`}
              className="border last:border-b rounded-sm mb-4"
            >
              <div className="flex justify-between items-center px-4">
                <div className="flex-1">
                  <AccordionTrigger
                    className={cn('hover:no-underline', computeLabel ? 'py-4' : 'py-2')}
                    showIcon
                    iconPlacement="end"
                  >
                    <span className="font-medium text-sm">
                      {computeLabel?.(item ?? defaultItem, index) ?? ''}
                    </span>
                  </AccordionTrigger>
                </div>

                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="h-7 w-7 p-0 ml-2 shrink-0"
                    aria-label={`Remover item ${index + 1}`}
                  >
                    <IGRPIcon
                      iconName="Trash2"
                      className="h-4 w-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      strokeWidth={2}
                    />
                  </Button>
                )}
              </div>

              <AccordionContent className="px-4 pb-4">
                {renderItem(item ?? defaultItem, index, (updatedItem) =>
                  handleItemChange(index, updatedItem),
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button type="button" variant="outline" onClick={handleAdd} className="w-full">
          <IGRPIcon iconName={addButtonIconName} className="h-4 w-4 mr-1" strokeWidth={2} />
          <span>
            {addButtonLabel} {label}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}

export { IGRPStandaloneList, type IGRPStandaloneListProps };

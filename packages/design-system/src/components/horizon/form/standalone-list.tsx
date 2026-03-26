'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';
import { type IGRPBaseAttributes } from '../../../types';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../ui/accordion';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { IGRPBadge, type IGRPBadgeProps } from '../badge';
import { IGRPIcon, type IGRPIconName } from '../icon';

/** @internal Named component for list item content — receives pre-rendered content to avoid inline render function. */
function StandaloneListItemContent({ content }: { content: React.ReactNode }) {
  return <>{content}</>;
}

/**
 * Props for the IGRPStandaloneList component.
 * @see IGRPStandaloneList
 */
interface IGRPStandaloneListProps<TItem>
  extends
    Omit<IGRPBaseAttributes, 'iconPlacement' | 'helperText'>,
    Partial<Pick<IGRPBadgeProps, 'variant' | 'color' | 'dot' | 'badgeClassName'>> {
  /** Unique id. */
  id: string;
  /** Default item for new entries. */
  defaultItem: TItem;
  /** Card description. */
  description?: string;
  /** Render function for each item. */
  renderItem: (item: TItem, index: number, onChange: (item: TItem) => void) => React.ReactNode;
  /** Compute accordion label from item. */
  computeLabel?: (item: TItem, index: number) => string;
  /** Badge content. */
  badgeValue?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Add button label. */
  addButtonLabel?: string;
  /** Add button icon. */
  addButtonIconName?: IGRPIconName | string;
  /** Badge CSS classes. */
  badgeClassName?: string;
  /** Controlled value. */
  value?: TItem[];
  /** Uncontrolled default value. */
  defaultValue?: TItem[];
  /** Called when items change. */
  onChange?: (items: TItem[]) => void;
}

/**
 * Standalone dynamic list (no form). Use IGRPFormList when inside IGRPForm.
 */
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

  const [internalItems, setInternalItems] = useState<TItem[]>(() =>
    value === undefined && (defaultValue === undefined || defaultValue.length === 0)
      ? [defaultItem]
      : defaultValue ?? [],
  );
  const [itemKeys, setItemKeys] = useState<string[]>(() => {
    const initial =
      value === undefined && (defaultValue === undefined || defaultValue.length === 0)
        ? [defaultItem]
        : (defaultValue ?? []);
    return initial.map(() => crypto.randomUUID());
  });
  const [userOpenItem, setUserOpenItem] = useState<string | undefined>(undefined);
  const [controlledKeys, setControlledKeys] = useState<string[]>(() =>
    value !== undefined && value.length > 0 ? value.map(() => crypto.randomUUID()) : [],
  );

  const items = value ?? internalItems;

  // Sync controlledKeys to value.length during render (avoids setState in effect)
  if (value !== undefined && value.length !== controlledKeys.length) {
    setControlledKeys((prev) => {
      const next = [...prev];
      while (next.length < value.length) {
        next.push(crypto.randomUUID());
      }
      return next.slice(0, value.length);
    });
  }

  const stableItemKeys = value !== undefined ? controlledKeys : itemKeys;

  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (
      !bootstrappedRef.current &&
      value === undefined &&
      (defaultValue === undefined || defaultValue.length === 0)
    ) {
      bootstrappedRef.current = true;
      onChange?.([defaultItem]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveOpenItem = useMemo(() => {
    if (items.length === 0) return undefined;
    if (!userOpenItem) return stableItemKeys[0];
    const idx = stableItemKeys.indexOf(userOpenItem);
    return idx >= 0 && idx < items.length ? userOpenItem : stableItemKeys[0];
  }, [items.length, stableItemKeys, userOpenItem]);

  const handleItemChange = useCallback(
    (index: number, updatedItem: TItem) => {
      const newItems = [...items];
      newItems[index] = updatedItem;
      if (value === undefined) setInternalItems(newItems);
      onChange?.(newItems);
    },
    [items, value, onChange],
  );

  const handleAdd = useCallback(() => {
    const newItems = [...items, defaultItem];
    if (value === undefined) {
      const newKey = crypto.randomUUID();
      setInternalItems(newItems);
      setItemKeys((prev) => [...prev, newKey]);
      setUserOpenItem(newKey);
    }
    onChange?.(newItems);
  }, [items, defaultItem, value, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      if (items.length > 1) {
        const removedKey = stableItemKeys[index];
        const wasOpen = userOpenItem === removedKey;

        const newItems = items.filter((_, i) => i !== index);
        if (value === undefined) {
          setInternalItems(newItems);
          setItemKeys((prev) => prev.filter((_, i) => i !== index));
        }
        if (wasOpen) {
          const newIndex = Math.max(0, index - 1);
          setUserOpenItem(stableItemKeys[newIndex]);
        } else if (userOpenItem) {
          const currentIdx = stableItemKeys.indexOf(userOpenItem);
          if (index < currentIdx && currentIdx > 0) {
            setUserOpenItem(stableItemKeys[currentIdx - 1]);
          }
        }
        onChange?.(newItems);
      }
    },
    [items, value, onChange, userOpenItem, stableItemKeys],
  );

  return (
    <Card className={cn('shadow-sm gap-0 rounded-lg py-0', className)} id={groupId}>
      <CardHeader className={cn('py-3 border-b flex flex-row items-center justify-between')}>
        <div className={cn('flex items-center gap-2')}>
          {showIcon && iconName && (
            <IGRPIcon
              iconName={iconName}
              size={iconSize}
              className={cn('size-4 text-muted-foreground', iconClassName)}
            />
          )}
          <div>
            <CardTitle className={cn('text-sm font-medium', labelClassName)}>{label}</CardTitle>
            {description && (
              <CardDescription className={cn('text-xs')}>{description}</CardDescription>
            )}
          </div>
        </div>
        {badgeValue && (
          <IGRPBadge variant={variant} color={color} dot={dot} badgeClassName={badgeClassName}>
            {badgeValue}
          </IGRPBadge>
        )}
      </CardHeader>

      <CardContent className={cn('p-4')}>
        <Accordion
          type="single"
          collapsible
          value={effectiveOpenItem}
          onValueChange={setUserOpenItem}
          className={cn('w-full')}
        >
          {items.map((item, index) => (
            <AccordionItem
              key={stableItemKeys[index] ?? `item-${index}`}
              value={stableItemKeys[index] ?? `item-${index}`}
              className={cn('border last:border-b rounded-sm mb-4')}
            >
              <div className={cn('flex justify-between items-center px-4')}>
                <div className={cn('flex-1')}>
                  <AccordionTrigger
                    className={cn('hover:no-underline', computeLabel ? 'py-4' : 'py-2')}
                    showIcon
                    iconPlacement="end"
                  >
                    <span className={cn('font-medium text-sm')}>
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
                    className={cn('h-7 w-7 p-0 ml-2 shrink-0')}
                    aria-label={`Remover item ${index + 1}`}
                  >
                    <IGRPIcon
                      iconName="Trash2"
                      className={cn(
                        'h-4 w-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                      )}
                      strokeWidth={2}
                    />
                  </Button>
                )}
              </div>

              <AccordionContent className={cn('px-4 pb-4')}>
                <StandaloneListItemContent
                  content={renderItem(
                    item ?? defaultItem,
                    index,
                    (updatedItem) => handleItemChange(index, updatedItem),
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button type="button" variant="outline" onClick={handleAdd} className={cn('w-full')}>
          <IGRPIcon iconName={addButtonIconName} className={cn('h-4 w-4 mr-1')} strokeWidth={2} />
          <span>
            {addButtonLabel} {label}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}

export { IGRPStandaloneList, type IGRPStandaloneListProps };

'use client';

import { useCallback, useContext, useEffect, useId, useState } from 'react';
import { useFieldArray, useWatch, type FieldArrayWithId } from 'react-hook-form';

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
import { IGRPFormContext } from './form-context';

interface IGRPFormListProps<TItem>
  extends Omit<IGRPBaseAttributes, 'iconPlacement' | 'helperText'>,
    Partial<Pick<IGRPBadgeProps, 'variant' | 'color' | 'dot' | 'badgeClassName'>> {
  id: string;
  defaultItem: TItem;
  description?: string;
  renderItem: (item: TItem, index: number, onChange?: (item: TItem) => void) => React.ReactNode;
  computeLabel?: (item: TItem, index: number) => string;
  badgeValue?: string;
  className?: string;
  addButtonLabel?: string;
  addButtonIconName?: IGRPIconName | string;
  badgeClassName?: string;
  // Standalone mode props
  value?: TItem[];
  defaultValue?: TItem[];
  onChange?: (items: TItem[]) => void;
  // Ref prop (React 19+)
  ref?: React.Ref<HTMLDivElement>;
}

function IGRPFormList<TItem>({
  id,
  name,
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
  // Standalone mode props
  value,
  defaultValue,
  onChange,
  ref,
}: IGRPFormListProps<TItem>) {
  const _id = useId();
  const groupId = name ?? id ?? _id;

  // Check if we're in form context
  const formContext = useContext(IGRPFormContext);
  const isFormMode = !!formContext;

  // If in form mode, render form version, otherwise standalone
  if (isFormMode) {
    return (
      <FormListFormMode
        groupId={groupId}
        defaultItem={defaultItem}
        description={description}
        renderItem={renderItem}
        computeLabel={computeLabel}
        badgeValue={badgeValue}
        className={className}
        label={label}
        labelClassName={labelClassName}
        iconName={iconName}
        iconClassName={iconClassName}
        iconSize={iconSize}
        showIcon={showIcon}
        dot={dot}
        variant={variant}
        color={color}
        badgeClassName={badgeClassName}
        addButtonLabel={addButtonLabel}
        addButtonIconName={addButtonIconName}
        ref={ref}
      />
    );
  }

  return (
    <FormListStandaloneMode
      groupId={groupId}
      defaultItem={defaultItem}
      description={description}
      renderItem={renderItem}
      computeLabel={computeLabel}
      badgeValue={badgeValue}
      className={className}
      label={label}
      labelClassName={labelClassName}
      iconName={iconName}
      iconClassName={iconClassName}
      iconSize={iconSize}
      showIcon={showIcon}
      dot={dot}
      variant={variant}
      color={color}
      badgeClassName={badgeClassName}
      addButtonLabel={addButtonLabel}
      addButtonIconName={addButtonIconName}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      ref={ref}
    />
  );
}

// Form mode component (uses react-hook-form)
function FormListFormMode<TItem>({
  groupId,
  defaultItem,
  description,
  renderItem,
  computeLabel,
  badgeValue,
  className,
  label,
  labelClassName,
  iconName,
  iconClassName,
  iconSize,
  showIcon,
  dot,
  variant,
  color,
  badgeClassName,
  addButtonLabel,
  addButtonIconName,
  ref,
}: Omit<IGRPFormListProps<TItem>, 'value' | 'defaultValue' | 'onChange' | 'id' | 'name'> & {
  groupId: string;
}) {
  const { fields, append, remove } = useFieldArray({ name: groupId });
  const values = useWatch({ name: groupId }) ?? [];
  const [openItem, setOpenItem] = useState<string | undefined>(
    fields.length > 0 ? 'item-0' : undefined,
  );

  useEffect(() => {
    if (fields.length === 0) {
      append(defaultItem);
      setOpenItem('item-0');
    }
  }, [append, defaultItem, fields.length]);

  useEffect(() => {
    if (fields.length > 0) {
      if (openItem) {
        const itemIndex = parseInt(openItem.replace('item-', ''), 10);
        if (itemIndex >= fields.length) {
          setOpenItem('item-0');
        }
      }
    } else {
      setOpenItem(undefined);
    }
  }, [fields.length, openItem]);

  const handleRemove = useCallback(
    (index: number) => {
      const wasOpen = openItem === `item-${index}`;
      const willHaveItems = fields.length > 1;

      remove(index);

      if (wasOpen) {
        if (willHaveItems) {
          const newIndex = Math.max(0, index - 1);
          setOpenItem(`item-${newIndex}`);
        } else {
          setOpenItem(undefined);
        }
      } else if (openItem) {
        const currentIndex = parseInt(openItem.replace('item-', ''), 10);
        if (index < currentIndex && currentIndex > 0) {
          setOpenItem(`item-${currentIndex - 1}`);
        }
      }
    },
    [remove, openItem, fields.length],
  );

  return (
    <Card className={cn('shadow-sm gap-0 rounded-lg py-0', className)} id={groupId} ref={ref}>
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
          {fields.map((field: FieldArrayWithId<Record<string, any>, string>, index: number) => (
            <AccordionItem
              key={field.id}
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
                      {computeLabel?.(values[index] ?? defaultItem, index) ?? ''}
                    </span>
                  </AccordionTrigger>
                </div>

                {fields.length > 1 && (
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
                {renderItem(values[index] ?? defaultItem, index)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            append(defaultItem);
            setOpenItem(`item-${fields.length}`);
          }}
          className="w-full"
        >
          <IGRPIcon
            iconName={addButtonIconName ?? 'Plus'}
            className="h-4 w-4 mr-1"
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

// Standalone mode component (uses local state)
function FormListStandaloneMode<TItem>({
  groupId,
  defaultItem,
  description,
  renderItem,
  computeLabel,
  badgeValue,
  className,
  label,
  labelClassName,
  iconName,
  iconClassName,
  iconSize,
  showIcon,
  dot,
  variant,
  color,
  badgeClassName,
  addButtonLabel,
  addButtonIconName,
  value,
  defaultValue,
  onChange,
  ref,
}: Omit<IGRPFormListProps<TItem>, 'name' | 'id'> & {
  groupId: string;
}) {
  const [items, setItems] = useState<any[]>(defaultValue ?? []);
  const [openItem, setOpenItem] = useState<string | undefined>(
    items.length > 0 ? 'item-0' : undefined,
  );

  // Sync with controlled value prop
  useEffect(() => {
    if (value !== undefined) {
      setItems(value);
    }
  }, [value]);

  // Initialize with default item if empty
  useEffect(() => {
    if (items.length === 0 && value === undefined) {
      setItems([defaultItem]);
      setOpenItem('item-0');
      onChange?.([defaultItem]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update open item when items change
  useEffect(() => {
    if (items.length > 0) {
      if (openItem) {
        const itemIndex = parseInt(openItem.replace('item-', ''), 10);
        if (itemIndex >= items.length) {
          setOpenItem('item-0');
        }
      }
    } else {
      setOpenItem(undefined);
    }
  }, [items.length, openItem]);

  const handleItemChange = useCallback(
    (index: number, updatedItem: any) => {
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
    <Card className={cn('shadow-sm gap-0 rounded-lg py-0', className)} id={groupId} ref={ref}>
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
          <IGRPIcon
            iconName={addButtonIconName ?? 'Plus'}
            className="h-4 w-4 mr-1"
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

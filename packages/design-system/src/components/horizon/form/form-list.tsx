'use client';

import { useCallback, useContext, useEffect, useId, useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

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
  extends
    Omit<IGRPBaseAttributes, 'iconPlacement' | 'helperText'>,
    Partial<Pick<IGRPBadgeProps, 'variant' | 'color' | 'dot' | 'badgeClassName'>> {
  id: string;
  defaultItem?: TItem;
  description?: string;
  renderItem: (item: TItem, index: number, onChange?: (item: TItem) => void) => React.ReactNode;
  computeLabel?: (item: TItem, index: number) => string;
  badgeValue?: string;
  className?: string;
  addButtonLabel?: string;
  addButtonIconName?: IGRPIconName | string;
  badgeClassName?: string;
  allowEmpty?: boolean;

  value?: TItem[];
  defaultValue?: TItem[];
  onChange?: (items: TItem[]) => void;

  ref?: React.Ref<HTMLDivElement>;
}

type FormListLayoutProps<TItem> = {
  groupId: string;
  className?: string;
  label?: string;
  labelClassName?: string;
  description?: string;
  showIcon?: boolean;
  iconName?: IGRPIconName | string;
  iconClassName?: string;
  iconSize?: IGRPBaseAttributes['iconSize'];
  badgeValue?: string;
  variant?: IGRPBadgeProps['variant'];
  color?: IGRPBadgeProps['color'];
  dot?: boolean;
  badgeClassName?: string;
  items: TItem[];
  itemKeys?: string[];
  computeLabel?: (item: TItem, index: number) => string;
  renderItem: (item: TItem, index: number, onChange?: (item: TItem) => void) => React.ReactNode;
  allowEmpty: boolean;
  onRemove?: (index: number) => void;
  openItem?: string;
  onOpenChange: (value: string | undefined) => void;
  addButtonLabel: string;
  addButtonIconName?: IGRPIconName | string;
  onAdd?: () => void;
  addDisabled?: boolean;
  onItemChangeFactory?: (index: number) => ((item: TItem) => void) | undefined;
  ref?: React.Ref<HTMLDivElement>;
};

function FormListHeader({
  label,
  labelClassName,
  description,
  showIcon,
  iconName,
  iconClassName,
  iconSize,
  badgeValue,
  variant,
  color,
  dot,
  badgeClassName,
}: Pick<
  FormListLayoutProps<unknown>,
  | 'label'
  | 'labelClassName'
  | 'description'
  | 'showIcon'
  | 'iconName'
  | 'iconClassName'
  | 'iconSize'
  | 'badgeValue'
  | 'variant'
  | 'color'
  | 'dot'
  | 'badgeClassName'
>) {
  return (
    <CardHeader className="px-0 p-4 border-b [.border-b]:pb-4 flex flex-row items-center justify-between">
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
  );
}

function FormListAddButton({
  onAdd,
  disabled,
  addButtonIconName,
  addButtonLabel,
}: Pick<FormListLayoutProps<unknown>, 'onAdd' | 'addButtonIconName' | 'addButtonLabel'> & {
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="outline" onClick={onAdd} disabled={disabled} className="w-full">
      <IGRPIcon iconName={addButtonIconName ?? 'Plus'} className="h-4 w-4 mr-1" strokeWidth={2} />
      <span>{addButtonLabel}</span>
    </Button>
  );
}

function FormListLayout<TItem>({
  groupId,
  className,
  label,
  labelClassName,
  description,
  showIcon,
  iconName,
  iconClassName,
  iconSize,
  badgeValue,
  variant,
  color,
  dot,
  badgeClassName,
  items,
  itemKeys,
  computeLabel,
  renderItem,
  allowEmpty,
  onRemove,
  openItem,
  onOpenChange,
  addButtonLabel,
  addButtonIconName,
  onAdd,
  addDisabled,
  onItemChangeFactory,
  ref,
}: FormListLayoutProps<TItem>) {
  const canRemove = (items.length > 1 || allowEmpty) && !!onRemove;
  const getItemKey = (index: number) => itemKeys?.[index] ?? `item-${index}`;

  return (
    <Card className={cn('shadow-sm gap-0 rounded-lg py-0', className)} id={groupId} ref={ref}>
      <FormListHeader
        label={label}
        labelClassName={labelClassName}
        description={description}
        showIcon={showIcon}
        iconName={iconName}
        iconClassName={iconClassName}
        iconSize={iconSize}
        badgeValue={badgeValue}
        variant={variant}
        color={color}
        dot={dot}
        badgeClassName={badgeClassName}
      />

      <CardContent className="p-4">
        <Accordion
          type="single"
          collapsible
          value={openItem ?? ''}
          onValueChange={(value) => onOpenChange(value || undefined)}
          className="w-full"
        >
          {items.map((item, index) => {
            const accordionValue = `item-${index}`;
            const itemKey = getItemKey(index);
            const labelValue = computeLabel?.(item, index) ?? '';
            const onItemRemove = onRemove ? () => onRemove(index) : undefined;
            const onItemChange = onItemChangeFactory?.(index);
            const normalizedOnItemChange = onItemChange as ((item: TItem) => void) | undefined;

            return (
              <AccordionItem
                key={itemKey}
                value={accordionValue}
                className="border last:border-b rounded-sm mb-4"
              >
                <div className="flex justify-between items-center px-4 gap-2">
                  <div className="flex-1">
                    <AccordionTrigger
                      className={cn('hover:no-underline', computeLabel ? 'py-4' : 'py-2')}
                      showIcon
                      iconPlacement="end"
                    >
                      <span className="font-medium text-sm">{labelValue}</span>
                    </AccordionTrigger>
                  </div>

                  {canRemove && onItemRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemRemove();
                      }}
                      className="h-7 w-7 p-0 shrink-0 hover:text-destructive"
                      aria-label={`Remover item ${index + 1}`}
                    >
                      <IGRPIcon iconName="Trash2" />
                    </Button>
                  )}
                </div>

                <AccordionContent className="px-4 pb-4">
                  {renderItem(item, index, normalizedOnItemChange)}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <FormListAddButton
          onAdd={onAdd}
          disabled={addDisabled ?? !onAdd}
          addButtonIconName={addButtonIconName}
          addButtonLabel={addButtonLabel}
        />
      </CardContent>
    </Card>
  );
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
  allowEmpty = false,
  value,
  defaultValue,
  onChange,
  ref,
}: IGRPFormListProps<TItem>) {
  const _id = useId();
  const groupId = name ?? id ?? _id;

  const formContext = useContext(IGRPFormContext);
  const isFormMode = !!formContext;

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
        allowEmpty={allowEmpty}
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
      allowEmpty={allowEmpty}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      ref={ref}
    />
  );
}

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
  addButtonLabel = 'Adicionar',
  addButtonIconName = 'Plus',
  allowEmpty = false,
  ref,
}: Omit<IGRPFormListProps<TItem>, 'value' | 'defaultValue' | 'onChange' | 'id' | 'name'> & {
  groupId: string;
}) {
  const { fields, append, remove } = useFieldArray({ name: groupId });
  const values = useWatch({ name: groupId }) ?? [];
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const [pendingNewItem, setPendingNewItem] = useState(false);

  useEffect(() => {
    if (fields.length === 0 && defaultItem !== undefined && !allowEmpty) {
      append(defaultItem);
    }
  }, [append, defaultItem, fields.length, allowEmpty]);

  useEffect(() => {
    if (pendingNewItem && fields.length > 0) {
      setOpenItem(`item-${fields.length - 1}`);
      setPendingNewItem(false);
    }
  }, [fields.length, pendingNewItem]);

  useEffect(() => {
    if (fields.length > 0) {
      if (openItem) {
        const itemIndex = parseInt(openItem.replace('item-', ''), 10);
        if (itemIndex >= fields.length) {
          setOpenItem('item-0');
        }
      } else {
        setOpenItem('item-0');
      }
    } else {
      setOpenItem(undefined);
    }
  }, [fields.length, openItem]);

  const handleRemove = useCallback(
    (index: number) => {
      if (fields.length <= 1 && !allowEmpty) {
        return;
      }

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
    [remove, openItem, fields.length, allowEmpty],
  );

  return (
    <FormListLayout
      groupId={groupId}
      className={className}
      label={label}
      labelClassName={labelClassName}
      description={description}
      showIcon={showIcon}
      iconName={iconName}
      iconClassName={iconClassName}
      iconSize={iconSize}
      badgeValue={badgeValue}
      variant={variant}
      color={color}
      dot={dot}
      badgeClassName={badgeClassName}
      items={fields.map((_, index) => values[index] ?? defaultItem!)}
      itemKeys={fields.map((field) => field.id)}
      computeLabel={(item, index) => computeLabel?.(item, index) ?? ''}
      renderItem={(item, index) => renderItem(item, index)}
      allowEmpty={allowEmpty}
      onRemove={handleRemove}
      openItem={openItem}
      onOpenChange={setOpenItem}
      addButtonLabel={addButtonLabel}
      addButtonIconName={addButtonIconName}
      onAdd={
        defaultItem !== undefined
          ? () => {
              setPendingNewItem(true);
              append(defaultItem);
            }
          : undefined
      }
      addDisabled={defaultItem === undefined}
      ref={ref}
    />
  );
}

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
  addButtonLabel = 'Adicionar',
  addButtonIconName = 'Plus',
  allowEmpty = false,
  value,
  defaultValue,
  onChange,
  ref,
}: Omit<IGRPFormListProps<TItem>, 'name' | 'id'> & {
  groupId: string;
}) {
  const [items, setItems] = useState<TItem[]>(defaultValue ?? []);
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (value !== undefined) {
      setItems(value);
    }
  }, [value]);

  useEffect(() => {
    if (
      items.length === 0 &&
      value === undefined &&
      defaultValue === undefined &&
      defaultItem !== undefined &&
      !allowEmpty
    ) {
      const initialItems = [defaultItem];
      setItems(initialItems);
      onChange?.(initialItems);
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      if (openItem) {
        const itemIndex = parseInt(openItem.replace('item-', ''), 10);
        if (itemIndex >= items.length) {
          setOpenItem('item-0');
        }
      } else {
        setOpenItem('item-0');
      }
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
    if (defaultItem !== undefined) {
      const newItems = [...items, defaultItem];
      setItems(newItems);
      setOpenItem(`item-${items.length}`);
      onChange?.(newItems);
    }
  }, [items, defaultItem, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      if (items.length > 1 || allowEmpty) {
        const wasOpen = openItem === `item-${index}`;

        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onChange?.(newItems);

        if (wasOpen) {
          if (newItems.length > 0) {
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
      }
    },
    [items, onChange, openItem, allowEmpty],
  );

  return (
    <FormListLayout
      groupId={groupId}
      className={className}
      label={label}
      labelClassName={labelClassName}
      description={description}
      showIcon={showIcon}
      iconName={iconName}
      iconClassName={iconClassName}
      iconSize={iconSize}
      badgeValue={badgeValue}
      variant={variant}
      color={color}
      dot={dot}
      badgeClassName={badgeClassName}
      items={items.map((item) => (item ?? defaultItem!) as TItem)}
      computeLabel={(item, index) => computeLabel?.(item, index) ?? ''}
      renderItem={(item, index, onChange?: (value: TItem) => void) =>
        renderItem(item, index, onChange)
      }
      allowEmpty={allowEmpty}
      onRemove={handleRemove}
      openItem={openItem}
      onOpenChange={setOpenItem}
      addButtonLabel={addButtonLabel}
      addButtonIconName={addButtonIconName}
      onAdd={handleAdd}
      addDisabled={defaultItem === undefined}
      onItemChangeFactory={
        defaultItem !== undefined
          ? (index) => (updatedItem: TItem) => handleItemChange(index, updatedItem)
          : undefined
      }
      ref={ref}
    />
  );
}

export { IGRPFormList, type IGRPFormListProps };

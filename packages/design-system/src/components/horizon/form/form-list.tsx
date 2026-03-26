'use client';

import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

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
import { IGRPFormContext } from './form-context';

const ACCORDION_ITEM_PREFIX = 'item-';
const getRemoveItemAriaLabel = (index: number) => `Remover item ${index + 1}`;
type RemoveBehavior = 'direct' | 'confirm';

const getAccordionValue = (index: number) => `${ACCORDION_ITEM_PREFIX}${index}`;
const parseAccordionIndex = (value: string) =>
  parseInt(value.replace(ACCORDION_ITEM_PREFIX, ''), 10);

/** Map openItems after an item is removed at removedIndex */
const mapOpenItemsAfterRemove = (openItems: string[], removedIndex: number): string[] =>
  openItems
    .filter((v) => parseAccordionIndex(v) !== removedIndex)
    .map((v) => {
      const idx = parseAccordionIndex(v);
      return idx > removedIndex ? getAccordionValue(idx - 1) : v;
    });

/**
 * Props for the IGRPFormList component.
 * Works in form mode (inside IGRPForm) or standalone mode (controlled value/onChange).
 * @see IGRPFormList
 */
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
  cardHeaderClassName?: string;
  cardContentClassName?: string;
  addButtonLabel?: string;
  addButtonIconName?: IGRPIconName | string;
  addButtonClassName?: string;
  badgeClassName?: string;
  allowEmpty?: boolean;
  /** When true, multiple items can be expanded at once. When false, opening one closes the others (default). */
  allowMultipleOpen?: boolean;
  renderRemoveAction?: (params: {
    index: number;
    ariaLabel: string;
    onRemove: () => void;
    onTriggerClick: (e: React.MouseEvent<HTMLElement>) => void;
  }) => React.ReactNode;
  /** Called when an item is removed. */
  onItemRemove?: (item: TItem, index: number) => void;

  value?: TItem[];
  defaultValue?: TItem[];
  onChange?: (items: TItem[]) => void;
}

/** @internal Layout props for FormListLayout. */
type FormListLayoutProps<TItem> = {
  groupId: string;
  className?: string;
  cardHeaderClassName?: string;
  cardContentClassName?: string;
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
  allowMultipleOpen?: boolean;
  removeBehavior?: RemoveBehavior;
  removeDialogTitle?: string;
  removeDialogDescription?: string;
  removeDialogCancelLabel?: string;
  removeDialogConfirmLabel?: string;
  renderRemoveAction?: (params: {
    index: number;
    ariaLabel: string;
    onRemove: () => void;
    onTriggerClick: (e: React.MouseEvent<HTMLElement>) => void;
  }) => React.ReactNode;
  onRemove?: (index: number) => void;
  openItem?: string;
  openItems?: string[];
  onOpenChange: (value: string | undefined) => void;
  onOpenItemsChange?: (value: string[]) => void;
  addButtonLabel: string;
  addButtonIconName?: IGRPIconName | string;
  addButtonClassName?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
  onItemChangeFactory?: (index: number) => ((item: TItem) => void) | undefined;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

/** @internal Card header for form list. */
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
  cardHeaderClassName,
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
  | 'cardHeaderClassName'
>) {
  return (
    <CardHeader
      className={cn(
        'px-0 p-4 border-b [.border-b]:pb-4 flex flex-row items-center justify-between',
        cardHeaderClassName,
      )}
    >
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
  );
}

/** @internal Wrapper to avoid inline render in render. */
function FormListItemContent<TItem>({
  item,
  index,
  renderItem,
  onItemChange,
}: {
  item: TItem;
  index: number;
  renderItem: (item: TItem, index: number, onChange?: (item: TItem) => void) => React.ReactNode;
  onItemChange?: (item: TItem) => void;
}) {
  return <>{renderItem(item, index, onItemChange)}</>;
}

/** @internal Add item button. */
function FormListAddButton({
  onAdd,
  disabled,
  addButtonIconName,
  addButtonLabel,
  addButtonClassName,
}: Pick<
  FormListLayoutProps<unknown>,
  'onAdd' | 'addButtonIconName' | 'addButtonLabel' | 'addButtonClassName'
> & {
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        disabled={disabled}
        className={addButtonClassName}
      >
        <IGRPIcon
          iconName={addButtonIconName ?? 'Plus'}
          className={cn('size-4 mr-1')}
          strokeWidth={2}
        />
        <span>{addButtonLabel}</span>
      </Button>
    </div>
  );
}

function FormListLayout<TItem>({
  groupId,
  className,
  cardHeaderClassName,
  cardContentClassName,
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
  allowMultipleOpen = false,
  renderRemoveAction,
  onRemove,
  openItem,
  openItems,
  onOpenChange,
  onOpenItemsChange,
  addButtonLabel,
  addButtonIconName,
  addButtonClassName,
  onAdd,
  addDisabled,
  onItemChangeFactory,
  disabled,
  ref,
}: FormListLayoutProps<TItem>) {
  const canRemove = (items.length > 0 || allowEmpty) && !!onRemove && !disabled;
  const getItemKey = (index: number) => itemKeys?.[index] ?? `${ACCORDION_ITEM_PREFIX}${index}`;

  const accordionItems = items.map((item, index) => {
    const accordionValue = getAccordionValue(index);
    const itemKey = getItemKey(index);
    const labelValue = computeLabel?.(item, index) ?? '';
    const onItemRemove = onRemove ? () => onRemove(index) : undefined;
    const removeAriaLabel = getRemoveItemAriaLabel(index);
    const onRemoveTriggerClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
    };
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

          {canRemove &&
            onItemRemove &&
            (renderRemoveAction ? (
              renderRemoveAction({
                index,
                ariaLabel: removeAriaLabel,
                onRemove: onItemRemove,
                onTriggerClick: onRemoveTriggerClick,
              })
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  onRemoveTriggerClick(e);
                  onItemRemove();
                }}
                className="size-7 p-0 shrink-0 hover:text-destructive"
                aria-label={removeAriaLabel}
              >
                <IGRPIcon iconName="Trash2" />
              </Button>
            ))}
        </div>

        <AccordionContent className={cn('p-4')}>
          <FormListItemContent
            item={item}
            index={index}
            renderItem={renderItem}
            onItemChange={normalizedOnItemChange}
          />
        </AccordionContent>
      </AccordionItem>
    );
  });

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
        cardHeaderClassName={cardHeaderClassName}
      />

      <CardContent className={cn('p-4', cardContentClassName)}>
        {allowMultipleOpen ? (
          <Accordion
            type="multiple"
            value={openItems ?? []}
            onValueChange={(value) => onOpenItemsChange?.(value)}
            className="w-full"
          >
            {accordionItems}
          </Accordion>
        ) : (
          <Accordion
            type="single"
            collapsible
            value={openItem ?? ''}
            onValueChange={(value) => onOpenChange(value || undefined)}
            className="w-full"
          >
            {accordionItems}
          </Accordion>
        )}

        <FormListAddButton
          onAdd={onAdd}
          disabled={addDisabled ?? disabled ?? !onAdd}
          addButtonIconName={addButtonIconName}
          addButtonLabel={addButtonLabel}
          addButtonClassName={addButtonClassName}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Dynamic list of items with add/remove, accordion UI, and optional form integration.
 * Use inside IGRPForm for form mode, or with value/onChange for standalone.
 */
const IGRPFormListInner = <TItem,>(
  {
    id,
    name,
    defaultItem,
    description,
    renderItem,
    computeLabel,
    badgeValue,
    className,
    cardHeaderClassName,
    cardContentClassName,
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
    addButtonClassName,
    allowEmpty = false,
    allowMultipleOpen = false,
    renderRemoveAction,
    onItemRemove,
    value,
    defaultValue,
    onChange,
  }: IGRPFormListProps<TItem>,
  ref: React.Ref<HTMLDivElement>,
) => {
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
        cardHeaderClassName={cardHeaderClassName}
        cardContentClassName={cardContentClassName}
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
        addButtonClassName={addButtonClassName}
        allowEmpty={allowEmpty}
        allowMultipleOpen={allowMultipleOpen}
        renderRemoveAction={renderRemoveAction}
        onItemRemove={onItemRemove}
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
      cardHeaderClassName={cardHeaderClassName}
      cardContentClassName={cardContentClassName}
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
      addButtonClassName={addButtonClassName}
      allowEmpty={allowEmpty}
      allowMultipleOpen={allowMultipleOpen}
      renderRemoveAction={renderRemoveAction}
      onItemRemove={onItemRemove}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      ref={ref}
    />
  );
};

/** @internal Form list when used inside IGRPForm (useFieldArray). */
function FormListFormMode<TItem>({
  groupId,
  defaultItem,
  description,
  renderItem,
  computeLabel,
  badgeValue,
  className,
  cardHeaderClassName,
  cardContentClassName,
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
  addButtonClassName,
  allowEmpty = false,
  allowMultipleOpen = false,
  renderRemoveAction,
  onItemRemove,
  ref,
}: Omit<IGRPFormListProps<TItem>, 'value' | 'defaultValue' | 'onChange' | 'id' | 'name'> & {
  groupId: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const formContext = useContext(IGRPFormContext);
  const disabled = formContext?.disabled;

  const { fields, append, remove } = useFieldArray({ name: groupId });
  const appendRef = useRef(append);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const values = useWatch({ name: groupId }) ?? [];

  const [userOpenItem, setUserOpenItem] = useState<string | undefined>(undefined);
  const [userOpenItems, setUserOpenItems] = useState<string[]>([]);

  useEffect(() => {
    appendRef.current = append;
  });

  useEffect(() => {
    if (fields.length === 0 && defaultItem !== undefined && !allowEmpty) {
      appendRef.current(defaultItem);
    }
  }, [defaultItem, fields.length, allowEmpty]);

  // Derive effective open state from user selection + fields.length
  const openItem = useMemo(() => {
    if (fields.length === 0) return undefined;
    if (!userOpenItem) return getAccordionValue(0);
    const idx = parseAccordionIndex(userOpenItem);
    return idx >= fields.length ? getAccordionValue(0) : userOpenItem;
  }, [fields.length, userOpenItem]);

  const openItems = useMemo(() => {
    if (fields.length === 0) return [];
    const valid = userOpenItems.filter((v) => parseAccordionIndex(v) < fields.length);
    return valid.length > 0 ? valid : [getAccordionValue(0)];
  }, [fields.length, userOpenItems]);

  const handleRemove = useCallback(
    (index: number) => {
      if (fields.length <= 1 && !allowEmpty) {
        return;
      }

      const removedValue = getAccordionValue(index);
      const wasOpen = allowMultipleOpen
        ? openItems.includes(removedValue)
        : openItem === removedValue;
      const willHaveItems = fields.length > 1;
      const removedItem = (values[index] ?? defaultItem ?? ({} as TItem)) as TItem;

      const cb = onItemRemove;
      if (cb) {
        try {
          cb(removedItem, index);
        } catch (error) {
          console.error('IGRPFormList onItemRemove callback failed:', error);
          return;
        }
      }

      remove(index);

      if (allowMultipleOpen) {
        setUserOpenItems((prev) => mapOpenItemsAfterRemove(prev, index));
      } else if (wasOpen) {
        if (willHaveItems) {
          const newIndex = Math.max(0, index - 1);
          setUserOpenItem(getAccordionValue(newIndex));
        } else {
          setUserOpenItem(undefined);
        }
      } else if (userOpenItem) {
        const currentIndex = parseAccordionIndex(userOpenItem);
        if (index < currentIndex && currentIndex > 0) {
          setUserOpenItem(getAccordionValue(currentIndex - 1));
        }
      }
    },
    [
      remove,
      openItem,
      openItems,
      userOpenItem,
      fields.length,
      allowEmpty,
      allowMultipleOpen,
      values,
      defaultItem,
      onItemRemove,
    ],
  );

  return (
    <FormListLayout
      groupId={groupId}
      className={className}
      cardHeaderClassName={cardHeaderClassName}
      cardContentClassName={cardContentClassName}
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
      items={fields.map((_, index) => (values[index] ?? defaultItem ?? ({} as TItem)) as TItem)}
      itemKeys={fields.map((field) => field.id)}
      computeLabel={(item, index) => computeLabel?.(item, index) ?? ''}
      renderItem={(item, index) => renderItem(item, index)}
      allowEmpty={allowEmpty}
      allowMultipleOpen={allowMultipleOpen}
      renderRemoveAction={renderRemoveAction}
      onRemove={handleRemove}
      openItem={allowMultipleOpen ? undefined : openItem}
      openItems={allowMultipleOpen ? openItems : undefined}
      onOpenChange={setUserOpenItem}
      onOpenItemsChange={setUserOpenItems}
      addButtonLabel={addButtonLabel}
      addButtonIconName={addButtonIconName}
      addButtonClassName={addButtonClassName}
      onAdd={
        defaultItem !== undefined
          ? () => {
              append(defaultItem);
              setUserOpenItem(getAccordionValue(fields.length));
              if (allowMultipleOpen) {
                setUserOpenItems((prev) => {
                  const newVal = getAccordionValue(fields.length);
                  return prev.includes(newVal) ? prev : [...prev, newVal];
                });
              }
            }
          : undefined
      }
      addDisabled={defaultItem === undefined}
      disabled={disabled}
      ref={ref}
    />
  );
}

/** @internal Form list in standalone mode (controlled value/onChange). */
function FormListStandaloneMode<TItem>({
  groupId,
  defaultItem,
  description,
  renderItem,
  computeLabel,
  badgeValue,
  className,
  cardHeaderClassName,
  cardContentClassName,
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
  addButtonClassName,
  allowEmpty = false,
  allowMultipleOpen = false,
  renderRemoveAction,
  onItemRemove,
  value,
  defaultValue,
  onChange,
  ref,
}: Omit<IGRPFormListProps<TItem>, 'name' | 'id'> & {
  groupId: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const [internalItems, setInternalItems] = useState<TItem[]>(() => {
    if (value !== undefined) return [];
    if (defaultValue !== undefined && defaultValue.length > 0) return defaultValue;
    if (defaultItem !== undefined && !allowEmpty) return [defaultItem];
    return [];
  });
  const [userOpenItem, setUserOpenItem] = useState<string | undefined>(undefined);
  const [userOpenItems, setUserOpenItems] = useState<string[]>([]);

  // Controlled: use value. Uncontrolled: use internalItems.
  const items = value ?? internalItems;

  // Bootstrap: notify parent of initial items when we seeded from defaultItem (no setState)
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (value !== undefined) return;
    if (defaultValue !== undefined && defaultValue.length > 0) return;
    if (defaultItem === undefined || allowEmpty) return;
    if (items.length === 0) return;
    bootstrappedRef.current = true;
    onChange?.([defaultItem]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run only on mount for initial bootstrap
  }, []);

  // Derive effective open state (no setState in effect)
  const openItem = useMemo(() => {
    if (items.length === 0) return undefined;
    if (!userOpenItem) return getAccordionValue(0);
    const idx = parseAccordionIndex(userOpenItem);
    return idx >= items.length ? getAccordionValue(0) : userOpenItem;
  }, [items.length, userOpenItem]);

  const openItems = useMemo(() => {
    if (items.length === 0) return [];
    const valid = userOpenItems.filter((v) => parseAccordionIndex(v) < items.length);
    return valid.length > 0 ? valid : [getAccordionValue(0)];
  }, [items.length, userOpenItems]);

  const handleItemChange = useCallback(
    (index: number, updatedItem: TItem) => {
      const newItems = [...items];
      newItems[index] = updatedItem;
      if (value === undefined) {
        setInternalItems(newItems);
      }
      onChange?.(newItems);
    },
    [items, value, onChange],
  );

  const handleAdd = useCallback(() => {
    if (defaultItem !== undefined) {
      const newItems = [...items, defaultItem];
      if (value === undefined) {
        setInternalItems(newItems);
      }
      const newValue = getAccordionValue(items.length);
      if (allowMultipleOpen) {
        setUserOpenItems((prev) => (prev.includes(newValue) ? prev : [...prev, newValue]));
      } else {
        setUserOpenItem(newValue);
      }
      onChange?.(newItems);
    }
  }, [items, defaultItem, value, onChange, allowMultipleOpen]);

  const handleRemove = useCallback(
    (index: number) => {
      if (items.length > 1 || allowEmpty) {
        const removedValue = getAccordionValue(index);
        const wasOpen = allowMultipleOpen
          ? openItems.includes(removedValue)
          : openItem === removedValue;
        const removedItem = items[index];

        const cb = onItemRemove;
        if (removedItem !== undefined && cb) {
          try {
            cb(removedItem, index);
          } catch (error) {
            console.error('IGRPFormList onItemRemove callback failed:', error);
            return;
          }
        }

        const newItems = items.filter((_, i) => i !== index);
        if (value === undefined) {
          setInternalItems(newItems);
        }
        onChange?.(newItems);

        if (allowMultipleOpen) {
          setUserOpenItems((prev) => mapOpenItemsAfterRemove(prev, index));
        } else if (wasOpen) {
          if (newItems.length > 0) {
            const newIndex = Math.max(0, index - 1);
            setUserOpenItem(getAccordionValue(newIndex));
          } else {
            setUserOpenItem(undefined);
          }
        } else if (userOpenItem) {
          const currentIndex = parseAccordionIndex(userOpenItem);
          if (index < currentIndex && currentIndex > 0) {
            setUserOpenItem(getAccordionValue(currentIndex - 1));
          }
        }
      }
    },
    [items, value, onChange, openItem, openItems, userOpenItem, allowEmpty, allowMultipleOpen, onItemRemove],
  );

  return (
    <FormListLayout
      groupId={groupId}
      className={className}
      cardHeaderClassName={cardHeaderClassName}
      cardContentClassName={cardContentClassName}
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
      items={items.map((item) => (item ?? defaultItem ?? ({} as TItem)) as TItem)}
      computeLabel={(item, index) => computeLabel?.(item, index) ?? ''}
      renderItem={(item, index, onChange?: (value: TItem) => void) =>
        renderItem(item, index, onChange)
      }
      allowEmpty={allowEmpty}
      allowMultipleOpen={allowMultipleOpen}
      renderRemoveAction={renderRemoveAction}
      onRemove={handleRemove}
      openItem={allowMultipleOpen ? undefined : openItem}
      openItems={allowMultipleOpen ? openItems : undefined}
      onOpenChange={setUserOpenItem}
      onOpenItemsChange={setUserOpenItems}
      addButtonLabel={addButtonLabel}
      addButtonIconName={addButtonIconName}
      addButtonClassName={addButtonClassName}
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

const IGRPFormList = forwardRef(IGRPFormListInner) as <TItem>(
  props: IGRPFormListProps<TItem> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;

Object.assign(IGRPFormList, { displayName: 'IGRPFormList' });

export { IGRPFormList, type IGRPFormListProps };

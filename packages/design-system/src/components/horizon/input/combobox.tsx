'use client';

import { useId, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { igrpColorText } from '../../../lib/colors';
import { cn } from '../../../lib/utils';
import type { IGRPInputProps, IGRPOptionsProps } from '../../../types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../../primitives/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover';
import { IGRPButton } from '../button';
import { IGRPFieldDescription } from '../field-description';
import { IGRPFormField } from '../form/form-field';
import { IGRPLabel } from '../label';
import { IGRPIcon } from '../icon';
import { IGRPCircleFull } from '../icon/custom';

/** @internal Options list for combobox dropdown. */
function ComboboxOptionsList({
  groupedOptions,
  showGroup,
  showStatus,
  showIcon,
  currentValue,
  onSelectHandler,
  isSelected,
  iconName = 'CornerDownRight',
}: {
  groupedOptions: Record<string, IGRPOptionsProps[]>;
  showGroup?: boolean;
  showStatus?: boolean;
  showIcon?: boolean;
  currentValue: string | string[];
  onSelectHandler: (value: string) => void;
  isSelected: (optValue: string, currentValue: string | string[]) => boolean;
  iconName?: string;
}) {
  return (
    <>
      {Object.entries(groupedOptions).map(([groupName, groupOptions], index) => (
        <div key={groupName}>
          {showGroup && index > 0 && <CommandSeparator />}
          <CommandGroup heading={showGroup ? groupName : ''}>
            {groupOptions.map(({ label, value, status, icon }) => (
              <CommandItem
                key={`${groupName}-${value}`}
                onSelect={() => onSelectHandler(value)}
                className={cn('flex items-center justify-between cursor-pointer')}
              >
                <div className={cn('flex items-center gap-2')}>
                  {showStatus && status && <IGRPCircleFull className={igrpColorText(status)} />}
                  {showIcon && <IGRPIcon iconName={icon ?? iconName} />}
                  {label}
                </div>
                <IGRPIcon
                  iconName="Check"
                  className={cn(
                    'ml-auto w-4 h-4 opacity-0',
                    isSelected(value, currentValue) && 'opacity-100',
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </div>
      ))}
    </>
  );
}

/** @internal Combobox trigger + popover field. */
function ComboboxField({
  fieldName,
  listId,
  open,
  setOpen,
  currentValue,
  onChangeHandler,
  setSelectValue,
  groupedOptions,
  showGroup,
  showStatus,
  showIcon,
  showSearch,
  searchText,
  selectLabel,
  selectClassName,
  disabled,
  className,
  onOptionsChangeHandler,
  isSelected,
  iconName = 'CornerDownRight',
}: {
  fieldName: string;
  listId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  currentValue: string | string[];
  onChangeHandler: (value: string | string[]) => void;
  setSelectValue: (val: string | string[], handler?: (v: string | string[]) => void) => React.ReactNode;
  groupedOptions: Record<string, IGRPOptionsProps[]>;
  showGroup?: boolean;
  showStatus?: boolean;
  showIcon?: boolean;
  showSearch?: boolean;
  searchText?: string;
  selectLabel?: string;
  selectClassName?: string;
  disabled?: boolean;
  className?: string;
  onOptionsChangeHandler: (
    selectedValue: string,
    currentValue: string | string[],
    onChangeHandler: (value: string | string[]) => void,
  ) => void;
  isSelected: (optValue: string, currentValue: string | string[]) => boolean;
  iconName?: string;
}) {
  return (
    <div className={cn('w-full min-w-0 max-w-full')}>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <IGRPButton
            name={fieldName}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            className={cn(
              'w-full justify-between overflow-hidden text-left max-w-full',
              className,
              disabled && 'cursor-not-allowed pointer-events-none opacity-50',
            )}
            iconName="ChevronsUpDown"
            iconPlacement="end"
            iconClassName="ml-2 h-4 w-4 shrink-0 opacity-50"
            showIcon
          >
            {setSelectValue(currentValue, onChangeHandler)}
          </IGRPButton>
        </PopoverTrigger>
        <PopoverContent
          className={cn('p-0 max-w-[calc(100vw-2rem)]', selectClassName)}
          align="start"
          side="bottom"
        >
          <Command>
            {showSearch && (
              <div className={cn('relative p-2')}>
                <CommandInput placeholder={searchText} className={cn('h-8')} />
                <CommandEmpty>{selectLabel}</CommandEmpty>
              </div>
            )}
            <CommandList id={listId}>
              <ComboboxOptionsList
                groupedOptions={groupedOptions}
                showGroup={showGroup}
                showStatus={showStatus}
                showIcon={showIcon}
                currentValue={currentValue}
                onSelectHandler={(selectedValue) =>
                  onOptionsChangeHandler(selectedValue, currentValue, onChangeHandler)
                }
                isSelected={isSelected}
                iconName={iconName}
              />
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Props for the IGRPCombobox component.
 * @see IGRPCombobox
 */
interface IGRPComboboxProps extends Omit<IGRPInputProps, 'onChange'> {
  /** Single or multiple selection. */
  variant?: 'single' | 'multiple';
  /** Options to display. */
  options: IGRPOptionsProps[];
  /** Selected value(s). */
  value?: string | string[];
  /** Called when selection changes. */
  onChange?: (selected: string | string[]) => void;
  /** CSS classes for the wrapper. */
  className?: string;
  /** Placeholder when nothing selected. */
  placeholder?: string;
  /** Disable the combobox. */
  disabled?: boolean;
  /** Whether the field is required. */
  required?: boolean;
  /** CSS classes for the select trigger. */
  selectClassName?: string;
  /** CSS classes for the label. */
  labelClassName?: string;
  /** Text when no items found. */
  selectLabel?: string;
  /** Validation error message. */
  errorText?: string;
  /** Show search input. */
  showSearch?: boolean;
  /** Search input placeholder. */
  searchText?: string;
  /** Group options. */
  showGroup?: boolean;
  /** Show status indicator. */
  showStatus?: boolean;
  /** Show icon in options. */
  showIcon?: boolean;
  /** Input id. */
  id?: string;
}

/**
 * Combobox with search and single/multiple selection. Integrates with react-hook-form.
 */
function IGRPCombobox({
  variant = 'single',
  options,
  value = '',
  onChange,
  placeholder = 'Select items...',
  className,
  disabled = false,
  label,
  required = false,
  name,
  id,
  selectClassName,
  labelClassName,
  errorText,
  helperText,
  selectLabel = 'No Item found.',
  showSearch = true,
  searchText = 'Search...',
  showGroup,
  showStatus,
  showIcon = false,
  iconName = 'CornerDownRight',
}: IGRPComboboxProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;
  const listId = useId();

  const formContext = useFormContext();
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<string | string[]>(
    () => (variant === 'single' ? '' : []),
  );
  const displayValue = value !== undefined ? value : localValue;

  const setSelectValue = (
    currentValue: string | string[],
    onChangeHandler?: (value: string | string[]) => void,
  ) => {
    if (variant === 'single') {
      const selected = options?.find((opt) => opt.value === currentValue);
      const labelValue = selected?.label ?? placeholder;
      const iconValue = selected?.icon ?? iconName;

      return (
        <span
          className={cn('flex items-center gap-2 min-w-0 flex-1 overflow-hidden', selected?.color)}
          style={{ maxWidth: '100%' }}
        >
          {showStatus && selected?.status && (
            <IGRPCircleFull className={cn('shrink-0', igrpColorText(selected.status))} />
          )}

          {showIcon && <IGRPIcon iconName={iconValue} className={cn('shrink-0')} />}

          <span className={cn('truncate min-w-0 flex-1 block')}>{labelValue}</span>
        </span>
      );
    }

    if (!Array.isArray(currentValue) || currentValue.length === 0) {
      return placeholder;
    }

    const removeValue = (valueToRemove: string) => {
      const currentValues = currentValue as string[];
      const updatedValues = currentValues.filter((val) => val !== valueToRemove);

      if (!formContext && !onChangeHandler) {
        setLocalValue(updatedValues);
      }
      if (onChangeHandler) {
        onChangeHandler(updatedValues);
      } else {
        onChange?.(updatedValues);
      }
    };

    return (
      <div className={cn('flex gap-1 flex-wrap')}>
        {currentValue.map((val) => {
          const selected = options?.find((opt) => opt.value === val);
          if (!selected) return null;

          return (
            <span
              key={val}
              className={cn('flex items-center bg-gray-100 px-2 py-1 rounded-md gap-1')}
            >
              {showStatus && selected.status && (
                <IGRPCircleFull className={igrpColorText(selected.status)} />
              )}

              {showIcon && <IGRPIcon iconName={selected.icon ?? iconName} />}

              <span className={selected.color}>{selected.label}</span>

              <IGRPButton
                className={cn('ml-1 text-gray-400 hover:text-red-400 rounded-full size-5')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    removeValue(val);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => removeValue(val)}
                iconName="X"
                iconSize={12}
                size="icon"
                showIcon
                variant="outline"
              />
            </span>
          );
        })}
      </div>
    );
  };

  const isSelected = (optValue: string, currentValue: string | string[]) => {
    if (variant === 'single') return currentValue === optValue;

    return Array.isArray(currentValue) && currentValue.includes(optValue);
  };

  const groupedOptions = useMemo(() => {
    if (!showGroup) return { Options: options };

    return options.reduce<Record<string, IGRPOptionsProps[]>>((acc, option) => {
      const groupName = option.group || 'Other';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(option);
      return acc;
    }, {});
  }, [showGroup, options]);

  const onOptionsChangeHandler = (
    selectedValue: string,
    currentValue: string | string[],
    onChangeHandler: (value: string | string[]) => void,
  ) => {
    if (variant === 'single') {
      const newValue = selectedValue === currentValue ? '' : selectedValue;
      onChangeHandler(newValue);
      setOpen(false);
    } else {
      const currentValues = Array.isArray(currentValue) ? currentValue : [];
      const updatedValues = currentValues.includes(selectedValue)
        ? currentValues.filter((val) => val !== selectedValue)
        : [...currentValues, selectedValue];
      onChangeHandler(updatedValues);
    }
  };

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        required={required}
        control={formContext.control}
      >
        {(field) => (
          <div className={cn('relative w-full min-w-0 max-w-full')}>
            <ComboboxField
              fieldName={fieldName}
              listId={listId}
              open={open}
              setOpen={setOpen}
              currentValue={field.value}
              onChangeHandler={(val) => {
                field.onChange(val);
                onChange?.(val);
              }}
              setSelectValue={setSelectValue}
              groupedOptions={groupedOptions}
              showGroup={showGroup}
              showStatus={showStatus}
              showIcon={showIcon}
              showSearch={showSearch}
              searchText={searchText}
              selectLabel={selectLabel}
              selectClassName={selectClassName}
              disabled={disabled}
              className={className}
              onOptionsChangeHandler={onOptionsChangeHandler}
              isSelected={isSelected}
              iconName={iconName}
            />
          </div>
        )}
      </IGRPFormField>
    );
  }

  return (
    <div className={cn('*:not-first:mt-2 w-full min-w-0 max-w-full')} id={name}>
      {label && (
        <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />
      )}

      <ComboboxField
        fieldName={fieldName}
        listId={listId}
        open={open}
        setOpen={setOpen}
        currentValue={displayValue}
        onChangeHandler={(newValue) => {
          if (value === undefined) setLocalValue(newValue);
          onChange?.(newValue);
        }}
        setSelectValue={setSelectValue}
        groupedOptions={groupedOptions}
        showGroup={showGroup}
        showStatus={showStatus}
        showIcon={showIcon}
        showSearch={showSearch}
        searchText={searchText}
        selectLabel={selectLabel}
        selectClassName={selectClassName}
        disabled={disabled}
        className={className}
        onOptionsChangeHandler={onOptionsChangeHandler}
        isSelected={isSelected}
        iconName={iconName}
      />

      <IGRPFieldDescription error={errorText} helperText={helperText} />
    </div>
  );
}

export { IGRPCombobox, type IGRPComboboxProps };

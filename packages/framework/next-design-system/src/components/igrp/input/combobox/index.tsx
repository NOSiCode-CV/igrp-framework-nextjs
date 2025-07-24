'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/primitives/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/popover';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPFieldDescription } from '@/components/igrp/field-description';
import { IGRPFormField } from '@/components/igrp/form';
import { IGRPLabel } from '@/components/igrp/label';
import { IGRPIcon } from '@/components/igrp/icon';
import { IGRPCircleFull } from '@/components/igrp/icon/custom';
import { igrpGridSizeClasses } from '@/lib/constants';
import { cn, igrpColorText } from '@/lib/utils';
import type { IGRPBaseAttributes, IGRPOptionsProps, IGRPGridSize } from '@/types/globals';

interface IGRPComboboxProps extends IGRPBaseAttributes {
  variant?: 'single' | 'multiple';
  options: IGRPOptionsProps[];
  value?: string | string[];
  onChange?: (selected: string | string[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  selectClassName?: string;
  labelClassName?: string;
  selectLabel?: string;
  errorText?: string;
  showSearch?: boolean;
  searchText?: string;
  showGroup?: boolean;
  showStatus?: boolean;
  showIcon?: boolean;
  gridSize?: IGRPGridSize;
}

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
  gridSize = 'default',
}: IGRPComboboxProps) {
  const id = useId();
  const fieldName = name ?? id;
  const formContext = useFormContext();
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<string | string[]>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const removeValue = (valueToRemove: string) => {
    const currentValues = localValue as string[];
    const updatedValues = currentValues.filter((val) => val !== valueToRemove);

    if (!formContext) setLocalValue(updatedValues);
    onChange?.(updatedValues);
  };

  const setSelectValue = (currentValue: string | string[]) => {
    if (variant === 'single') {
      const selected = options?.find((opt) => opt.value === currentValue);
      const labelValue = selected?.label ?? placeholder;
      const iconValue = selected?.icon ?? iconName;

      return (
        <span className={cn('flex items-center gap-2 truncate', selected?.color)}>
          {showStatus && selected?.status && (
            <IGRPCircleFull className={cn('mr-1', igrpColorText(selected.status))} />
          )}

          {showIcon && <IGRPIcon iconName={iconValue} />}

          {labelValue}
        </span>
      );
    }

    if (!Array.isArray(currentValue) || currentValue.length === 0) {
      return placeholder;
    }

    return (
      <div className='flex gap-1 flex-wrap'>
        {currentValue.map((val) => {
          const selected = options?.find((opt) => opt.value === val);
          if (!selected) return null;

          return (
            <span
              key={val}
              className='flex items-center bg-gray-100 px-2 py-1 rounded-md gap-1'
            >
              {showStatus && selected.status && (
                <IGRPCircleFull className={igrpColorText(selected.status)} />
              )}

              {showIcon && <IGRPIcon iconName={selected.icon ?? iconName} />}

              <span className={selected.color}>{selected.label}</span>

              <IGRPButton
                className='ml-1 text-gray-400 hover:text-red-400 rounded-full size-5'
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
                iconName='X'
                iconSize={12}
                size='icon'
                showIcon
                variant='outline'
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

  const renderOptionsList = (
    currentValue: string | string[],
    onSelectHandler: (value: string) => void,
  ) =>
    Object.entries(groupedOptions).map(([groupName, groupOptions], index) => (
      <div key={groupName}>
        {showGroup && index > 0 && <CommandSeparator />}

        <CommandGroup heading={showGroup ? groupName : ''}>
          {groupOptions.map(({ label, value, status, icon }) => (
            <CommandItem
              key={`${groupName}-${value}`}
              onSelect={() => onSelectHandler(value)}
              className='flex items-center justify-between cursor-pointer'
            >
              <div className='flex items-center gap-2'>
                {showStatus && status && <IGRPCircleFull className={igrpColorText(status)} />}

                {showIcon && <IGRPIcon iconName={icon ?? 'CornerDownRight'} />}

                {label}
              </div>

              <IGRPIcon
                iconName='Check'
                className={cn(
                  'ml-auto w-4 h-4 opacity-0',
                  isSelected(value, currentValue) && 'opacity-100',
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </div>
    ));

  const renderCombobox = (
    currentValue: string | string[],
    onChangeHandler: (value: string | string[]) => void,
  ) => (
    <Popover
      open={open}
      onOpenChange={setOpen}
      modal
    >
      <PopoverTrigger
        asChild
        className='w-full'
      >
        <IGRPButton
          name={fieldName}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            className,
            disabled && 'cursor-not-allowed pointer-events-none opacity-50',
          )}
          iconName='ChevronsUpDown'
          iconPlacement='end'
          iconClassName='ml-2 h-4 w-4 shrink-0 opacity-50'
          showIcon
        >
          {setSelectValue(currentValue)}
        </IGRPButton>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0', selectClassName)}
        align='start'
      >
        <Command>
          {showSearch && (
            <div className='relative p-2'>
              <CommandInput
                placeholder={searchText}
                className='h-8'
              />
              <CommandEmpty>{selectLabel}</CommandEmpty>
            </div>
          )}
          <CommandList>
            {renderOptionsList(currentValue, (selectedValue) => {
              onOptionsChangeHandler(selectedValue, currentValue, onChangeHandler);
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        size={igrpGridSizeClasses[gridSize]}
        required={required}
        control={formContext.control}
      >
        {(field) => (
          <div className='relative'>
            {renderCombobox(field.value, (val) => {
              field.onChange(val);
              onChange?.(val);
            })}
          </div>
        )}
      </IGRPFormField>
    );
  }

  return (
    <div
      className='*:not-first:mt-2'
      id={name}
    >
      {label && (
        <IGRPLabel
          label={label}
          className={labelClassName}
          required={required}
          id={fieldName}
        />
      )}

      {renderCombobox(localValue, (newValue) => {
        setLocalValue(newValue);
        onChange?.(newValue);
      })}

      <IGRPFieldDescription
        error={errorText}
        helperText={helperText}
      />
    </div>
  );
}

export { IGRPCombobox, type IGRPComboboxProps };

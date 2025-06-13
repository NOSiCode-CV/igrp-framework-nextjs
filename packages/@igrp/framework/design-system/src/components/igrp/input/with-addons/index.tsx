'use client';

import { useEffect, useId, useMemo } from 'react';
import { Input } from '@/components/horizon/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { IGRPLabel } from '@/components/igrp/label';
import { cn } from '@/lib/utils';
import type { IGRPInputProps, IGRPOptionsProps } from '@/types/globals';

interface IGRPInputAddOnProps
  extends Omit<
    IGRPInputProps,
    'showIcon' | 'iconName' | 'iconSize' | 'iconPlacement' | 'iconClassName'
  > {
  options: IGRPOptionsProps[];
  optionLabel?: string;
  selectValue?: string;
  onSelectValueChange(value: string): void;
  classNameLabel?: string;
}

function IGRPInputAddOn({
  optionLabel,
  options,
  selectValue,
  onSelectValueChange,
  label,
  className: classNameGlobal,
  classNameLabel,
  name,
  ...props
}: IGRPInputAddOnProps) {
  const id = useId();
  const ref = name ? name : `input-addon-${id}`;

  const defaultValue = useMemo(() => options?.[0]?.value, [options]);

  useEffect(() => {
    if (defaultValue && !selectValue) {
      onSelectValueChange(defaultValue);
    }
  }, [defaultValue, selectValue, onSelectValueChange]);

  return (
    <div
      className={cn('*:not-first:mt-2', classNameGlobal)}
      id={ref}
    >
      {label && (
        <IGRPLabel
          label={label}
          className={classNameLabel}
          id={ref}
        />
      )}

      <div className='flex rounded-md border overflow-hidden'>
        <Select
          value={selectValue}
          onValueChange={onSelectValueChange}
        >
          <SelectTrigger className='border-0 border-r rounded-none min-w-[80px] px-3 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none cursor-pointer'>
            <SelectValue>
              {selectValue && (
                <span
                  className={cn(
                    'font-semibold',
                    options.find((color) => color.value === selectValue)?.color,
                  )}
                >
                  {options.find((color) => color.value === selectValue)?.label}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {optionLabel && (
                <SelectLabel className='font-light text-sm'>{optionLabel}</SelectLabel>
              )}
              {options?.map((option, index) => (
                <SelectItem
                  key={index}
                  value={option.value}
                  className={cn('cursor-pointer font-semibold', option.color)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          id={ref}
          className={cn(
            'border-0 rounded-none flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 shadow-none',
          )}
          {...props}
        />
      </div>
    </div>
  );
}

export { IGRPInputAddOn, type IGRPInputAddOnProps };

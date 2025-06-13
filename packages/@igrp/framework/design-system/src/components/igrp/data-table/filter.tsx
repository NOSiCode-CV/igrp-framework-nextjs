import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { type Column, type Table } from '@tanstack/react-table';
import { type DateRange } from 'react-day-picker';
import { Checkbox } from '@/components/horizon/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { Separator } from '@/components/primitives/separator';
import { IGRPBadge } from '@/components/igrp/badge';
import { IGRPIcon } from '@/components/igrp/icon';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPDatePickerRange } from '@/components/igrp/input/date-picker/date-picker-range';
import { IGRPInputText } from '@/components/igrp/input/text';
import type { IGRPInputProps, IGRPOptionsProps } from '@/types/globals';
import { cn } from '@/lib/utils';

interface IGRPDataTableFilterProps<TData> {
  column?: Column<TData, unknown>;
  placeholder?: string;
  clearDates?: boolean;
  options?: IGRPOptionsProps[];
  className?: string;
  placeholderMax?: string;
  disabled?: boolean;
}

// TODO: Replace for igrp/date-picker
function IGRPDataTableFilterDate<TData>({
  column,
  // placeholder = 'Selecionar datas...', // TODO : Add this to DateRangePicker
  clearDates, // TODO: review how to implement it
  className,
}: Omit<IGRPDataTableFilterProps<TData>, 'options' | 'placeholderMax'>) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const setFilterValue = useCallback(
    (value: DateRange | undefined) => column?.setFilterValue(value),
    [column],
  );

  useEffect(() => {
    if (clearDates) {
      setDateRange(undefined);
      setFilterValue(undefined);
    }
  }, [clearDates, setFilterValue]);

  useEffect(() => {
    setFilterValue(dateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  return (
    <IGRPDatePickerRange
      date={dateRange}
      onDateChange={setDateRange}
      className={cn(className)}
    />
  );
}

interface IGRPDataTableFilterDropdownProps<TData>
  extends Omit<IGRPDataTableFilterProps<TData>, 'clearDates' | 'placeholderMax' | 'target'> {
  showFilter?: boolean;
  notFoundText?: string;
}

function IGRPDataTableFilterDropdown<TData>({
  column,
  placeholder = 'Filtrar...',
  options,
  className,
  disabled,
  showFilter = false,
  notFoundText = 'No Item found.',
}: IGRPDataTableFilterDropdownProps<TData>) {
  const id = useId();
  const selectedValue = column?.getFilterValue() as string | undefined;
  const selectedLabel = useMemo(
    () => options?.find((opt) => opt.value === selectedValue)?.label || placeholder,
    [selectedValue, options, placeholder],
  );

  const handleSelect = useCallback(
    (value: string) => {
      column?.setFilterValue(value);
    },
    [column],
  );

  return (
    <div id={`dropdown-${id}`}>
      <Popover>
        <PopoverTrigger asChild>
          <IGRPButton
            variant='outline'
            role='combobox'
            size='sm'
            className={cn(
              'w-full justify-between',
              className,
              disabled && 'cursor-not-allowed pointer-events-none opacity-50',
            )}
          >
            <span>{selectedLabel}</span>
            <IGRPIcon iconName='ChevronsUpDown' />
          </IGRPButton>
        </PopoverTrigger>
        <PopoverContent
          align='start'
          className={cn('p-0', className)}
        >
          <Command>
            {showFilter && (
              <CommandInput
                placeholder={placeholder}
                className='h-8'
              />
            )}
            <CommandList>
              <CommandEmpty>{notFoundText}</CommandEmpty>
              <CommandGroup>
                {options?.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value.toString()}
                    onSelect={(currentValue) => handleSelect(currentValue)}
                  >
                    <span className={opt.color}>{opt.label}</span>
                    <IGRPIcon
                      iconName='Check'
                      className={cn(
                        'ml-auto w-4 h-4',
                        selectedValue === opt.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface IGRPDataTableFilterFacetedProps<TData>
  extends Omit<IGRPDataTableFilterProps<TData>, 'clearDates' | 'placeholderMax' | 'target'> {
  labelFilter?: string;
  labelSearchField?: string;
  table?: Table<TData>;
  showFilter?: boolean;
}

function IGRPDataTableFilterFaceted<TData>({
  column,
  placeholder = 'Selecionar...',
  options,
  className,
  labelFilter = 'Limpar Filtro',
  labelSearchField = 'Nenhum resultado encontrado.',
  showFilter = false,
}: IGRPDataTableFilterFacetedProps<TData>) {
  const id = useId();
  const facets = column?.getFacetedUniqueValues();
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    useMemo(() => new Set(column?.getFilterValue() as string[]), [column]),
  );

  const handleSelect = useCallback(
    (value: string) => {
      if (selectedValues.has(value)) {
        selectedValues.delete(value);
      } else {
        selectedValues.add(value);
      }
      const filterValues = Array.from(selectedValues);
      column?.setFilterValue(filterValues.length ? filterValues : undefined);
    },
    [column, selectedValues],
  );

  const handleClear = useCallback(() => {
    column?.setFilterValue(undefined);
    setSelectedValues(new Set());
  }, [column]);

  return (
    <div id={`faceted-${id}`}>
      <Popover>
        <PopoverTrigger asChild>
          <IGRPButton
            variant='outline'
            className={cn(className)}
            iconName='Plus'
            iconClassName='-ms-1 opacity-60 rounded-full border border-muted-foreground p-0.5'
            showIcon
          >
            {placeholder}
            {selectedValues?.size > 0 && (
              <>
                <Separator
                  orientation='vertical'
                  className='mx-2 h-4'
                />
                <IGRPBadge
                  variant='soft'
                  color='secondary'
                  badgeClassName='rounded-sm px-1 font-normal lg:hidden'
                >
                  {selectedValues.size}
                </IGRPBadge>
                <div className='hidden space-x-1 lg:flex'>
                  {selectedValues.size > 2 ? (
                    <IGRPBadge
                      variant='soft'
                      color='secondary'
                      badgeClassName='rounded-sm px-1 font-normal'
                    >
                      {selectedValues.size} selected
                    </IGRPBadge>
                  ) : (
                    options
                      ?.filter((option) => selectedValues.has(option.value))
                      .map((option) => (
                        <IGRPBadge
                          variant='soft'
                          color='secondary'
                          key={option.value}
                          badgeClassName='rounded-sm px-1 font-normal'
                        >
                          {option.label}
                        </IGRPBadge>
                      ))
                  )}
                </div>
              </>
            )}
          </IGRPButton>
        </PopoverTrigger>
        <PopoverContent
          className='max-w-52 p-0'
          align='start'
        >
          <Command>
            {showFilter && (
              <CommandInput
                placeholder={placeholder}
                className='h-8'
              />
            )}
            <CommandEmpty>{labelSearchField}</CommandEmpty>
            <CommandGroup>
              {options?.map((option, i) => {
                return (
                  <CommandItem
                    className={cn('justify-between', className)}
                    key={option.value}
                  >
                    <div className='flex items-center gap-2 cursor-pointer text-foreground'>
                      <Checkbox
                        id={`${id}-${i}`}
                        checked={selectedValues.has(option.value)}
                        onCheckedChange={() => handleSelect(option.value)}
                        className='cursor-pointer'
                      />
                    </div>

                    <span>{option.label}</span>

                    <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                      {facets?.get(option.value) || 0}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className='cursor-pointer'
                  >
                    <IGRPIcon iconName='X' />
                    {labelFilter}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type IGRPDataTableFilterInputProps<TData> = IGRPInputProps &
  Omit<IGRPDataTableFilterProps<TData>, 'options' | 'clearDates' | 'placeholderMax' | 'target'>;

function IGRPDataTableFilterInput<TData>({
  column,
  placeholder = 'Pesquisar...',
  className,
  inputClassName,
}: IGRPDataTableFilterInputProps<TData>) {
  const id = useId();

  return (
    <IGRPInputText
      placeholder={placeholder}
      value={(column?.getFilterValue() as string) ?? ''}
      onChange={(e) => column?.setFilterValue(e.target.value)}
      className={className}
      inputClassName={inputClassName}
      name={`text-${id}`}
    />
  );
}

// TODO: input number

function IGRPDataTableFilterMinMax<TData>({
  column,
  placeholder: placeholderMin = 'Min',
  placeholderMax = 'Max',
}: Omit<IGRPDataTableFilterProps<TData>, 'options' | 'clearDates' | 'target'>) {
  const id = useId();
  const columnFilterValue = column?.getFilterValue() as [number, number];
  const columnHeader = typeof column?.columnDef.header === 'string' ? column.columnDef.header : '';

  return (
    <div className='flex gap-2'>
      <IGRPInputText
        id={`${id}-min`}
        className='flex-1 rounded-e-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
        value={columnFilterValue?.[0] ?? ''}
        onChange={(e) =>
          column?.setFilterValue((old: [number, number]) => [
            e.target.value ? Number(e.target.value) : undefined,
            old?.[1],
          ])
        }
        placeholder={placeholderMin}
        type='number'
        aria-label={`${columnHeader} min`}
      />
      <IGRPInputText
        id={`${id}-range-2`}
        className='-ms-px flex-1 rounded-s-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
        value={(columnFilterValue as [number, number])?.[1] ?? ''}
        onChange={(e) =>
          column?.setFilterValue((old: [number, number]) => [
            old?.[0],
            e.target.value ? Number(e.target.value) : undefined,
          ])
        }
        placeholder={placeholderMax}
        type='number'
        aria-label={`${columnHeader} max`}
      />
    </div>
  );
}

function IGRPDataTableFilterSelect<TData>({
  column,
  options,
  placeholder = 'Selecionar...',
  className,
}: Omit<IGRPDataTableFilterProps<TData>, 'clearDates' | 'placeholderMax' | 'target'>) {
  const id = useId();
  const columnFilterValue = column?.getFilterValue();

  return (
    <Select
      value={columnFilterValue?.toString() ?? placeholder}
      onValueChange={(value) => {
        column?.setFilterValue(value === 'all' ? undefined : value);
      }}
    >
      <SelectTrigger
        id={`${id}-select`}
        className={cn(className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={cn(className)}>
        <SelectItem value='all'>{placeholder}</SelectItem>
        {options?.map((value) => (
          <SelectItem
            key={String(value)}
            value={String(value)}
          >
            {String(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export {
  IGRPDataTableFilterDate,
  IGRPDataTableFilterDropdown,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableFilterMinMax,
  IGRPDataTableFilterSelect,
};

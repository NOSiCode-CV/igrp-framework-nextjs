'use client';

import { useId, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useFormContext } from 'react-hook-form';
import { type DateRange } from 'react-day-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/primitives/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/popover';
import { IGRPButton } from '@/components/igrp/button';
import {
  IGRPCalendarRange,
  type IGRPCalendarRangeProps,
} from '@/components/igrp/input/date-picker/calendar/calendar-range';
import { IGRPLabel } from '@/components/igrp/label';
import { igrpGridSizeClasses } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { type IGRPDatePickerBaseProps } from './types';

type IGRPDatePickerRangeProps = IGRPCalendarRangeProps & IGRPDatePickerBaseProps;

function IGRPDatePickerRange({
  name,
  date,
  onDateChange,
  label,
  labelClassName,
  helperText,
  className,
  error,
  required = false,
  disabledPicker = false,
  disabled,
  gridSize = 'default',
  dateFormat = 'dd/MM/yyyy',
  placeholder = 'Pick a date',
  ...props
}: IGRPDatePickerRangeProps) {
  const id = useId();
  const fieldName = name ?? id;
  const [localDate, setLocalDate] = useState<DateRange | undefined>(date);
  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext) setLocalDate(date);
  }, [date, formContext]);

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePickerRange in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const getDisplayDate = (value: DateRange | undefined) => {
    if (!value?.from) return placeholder;
    const from = format(value.from, dateFormat);
    const to = value.to ? format(value.to, dateFormat) : '';
    return `${from} - ${to}`;
  };

  const DateButton = (value: DateRange | undefined) => (
    <div
      className={cn(
        'flex gap-2 items-center relative',
        'group bg-background hover:bg-background border border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] h-10 rounded-md',
        !value && 'text-muted-foreground',
        error && 'border-destructive focus-visible:ring-destructive/20',
        disabledPicker && 'opacity-50 cursor-not-allowed',
      )}
    >
      <IGRPButton
        id={fieldName}
        variant='link'
        className='underline-offset-0 hover:no-underline'
        disabled={disabledPicker}
        iconName='Calendar'
        iconClassName='text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors'
        showIcon={localDate ? false : true}
        iconPlacement='end'
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {getDisplayDate(value)}
        </span>
      </IGRPButton>
    </div>
  );

  const renderPicker = (
    fieldValue?: DateRange,
    onChange?: (val: DateRange | undefined) => void,
  ) => (
    <>
      <Popover>
        <PopoverTrigger asChild>{DateButton(fieldValue)}</PopoverTrigger>
        <PopoverContent className='p-0 w-auto bg-popover'>
          <IGRPCalendarRange
            {...props}
            id={id}
            date={fieldValue}
            onDateChange={(val) => {
              setLocalDate(val);
              onDateChange?.(val);
              onChange?.(val);
            }}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>

      {localDate && (
        <IGRPButton
          onClick={() => {
            setLocalDate(undefined);
            onDateChange?.(undefined);
          }}
          variant='link'
          className='size-2 absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground z-100'
          size='icon'
          iconName='X'
          iconSize={10}
          disabled={disabledPicker}
          showIcon={localDate ? true : false}
        />
      )}
    </>
  );

  if (formContext) {
    return (
      <FormField
        control={formContext.control}
        name={fieldName}
        render={({ field, fieldState }) => (
          <FormItem className={cn(igrpGridSizeClasses[gridSize], className)}>
            {label && (
              <FormLabel
                className={cn(
                  labelClassName,
                  required && 'after:content-["*"] after:text-destructive',
                )}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>{renderPicker(field.value, field.onChange)}</FormControl>
            {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className={cn('*:not-first:mt-2', igrpGridSizeClasses[gridSize], className)}>
      {label && (
        <IGRPLabel
          label={label}
          required={required}
          id={name}
          className={labelClassName}
        />
      )}
      <div className='relative'>{renderPicker(localDate, onDateChange)}</div>
      {helperText && !error && <p className='text-sm text-muted-foreground mt-1'>{helperText}</p>}
      {error && <p className='text-sm text-destructive mt-1'>{error}</p>}
    </div>
  );
}

export { IGRPDatePickerRange, type IGRPDatePickerRangeProps };

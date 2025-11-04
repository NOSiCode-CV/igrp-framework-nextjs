'use client';

import { useId, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useFormContext } from 'react-hook-form';

import { cn } from '../../../../lib/utils';
import { type IGRPDatePickerBaseProps } from '../../../../types';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../primitives/form';
import { Popover, PopoverContent, PopoverTrigger } from '../../../primitives/popover';
import { IGRPButton } from '../../button';
import { IGRPCalendarSingle, type IGRPCalendarSingleProps } from '../../calendar/single';
import { IGRPLabel } from '../../label';
import { DD_MM_YYYY } from '../../../../lib/constants';

type IGRPDatePickerSingleProps = IGRPCalendarSingleProps & IGRPDatePickerBaseProps;

function IGRPDatePickerSingle({
  name,
  date,
  onDateChange,
  label,
  labelClassName,
  helperText,
  className,
  required = false,
  disabledPicker = false,
  disabled,
  dateFormat = DD_MM_YYYY,
  placeholder = 'Pick a date',
  ...calendarProps
}: IGRPDatePickerSingleProps) {
  const id = useId();
  const fieldName = name ?? id;
  const [localDate, setLocalDate] = useState<Date | undefined>(date);
  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext) setLocalDate(date);
  }, [date, formContext]);

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const getDisplayDate = (date: Date | undefined) => {
    return date ? format(date, dateFormat) : placeholder;
  };

  const DateButton = (value: Date | undefined) => (
    <div
      className={cn(
        'flex gap-2 items-center relative',
        'group bg-background hover:bg-accent border border-input hover:text-accent-foreground',
        'w-full justify-between outline-offset-0 outline-none focus-visible:outline-2',
        'rounded-md shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        !value && 'text-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <IGRPButton
        id={fieldName}
        variant="outline"
        className="underline-offset-0 hover:no-underline border-0 bg-transparent hover:bg-transparent shadow-none"
        disabled={disabledPicker}
        iconName="ChevronDown"
        iconClassName="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
        showIcon={localDate ? false : true}
        iconPlacement="end"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {getDisplayDate(value)}
        </span>
      </IGRPButton>
    </div>
  );

  const renderPicker = (
    fieldValue: Date | undefined,
    onChange: (date: Date | undefined) => void,
  ) => (
    <>
      <Popover>
        <PopoverTrigger asChild>{DateButton(fieldValue)}</PopoverTrigger>
        <PopoverContent className="p-0 w-auto shadow-none" align="start">
          <IGRPCalendarSingle
            id={fieldName}
            date={fieldValue}
            onDateChange={onChange}
            captionLayout="dropdown"
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
      {localDate && (
        <IGRPButton
          onClick={() => {
            setLocalDate(undefined);
            onDateChange?.(undefined);
          }}
          variant="link"
          className="size-2 absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground z-100"
          size="icon"
          iconName="X"
          iconSize={10}
          disabled={disabledPicker}
          showIcon={localDate ? true : false}
        />
      )}
    </>
  );

  if (formContext) {
    return (
      <div className={cn('*:not-first:mt-2', className)}>
        <FormField
          control={formContext.control}
          name={fieldName}
          render={({ field, fieldState }) => (
            <FormItem>
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
              <FormControl>
                {renderPicker(field.value, (val) => {
                  field.onChange(val);
                  onDateChange?.(val);
                })}
              </FormControl>

              {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('*:not-first:mt-2', className)}>
      {label && (
        <IGRPLabel label={label} className={labelClassName} required={required} id={name} />
      )}
      <div className="relative">
        {renderPicker(localDate, (val) => {
          setLocalDate(val);
          onDateChange?.(val);
        })}
      </div>

      {helperText && (
        <p
          id={`${fieldName}-helper`}
          className="text-muted-foreground mt-2 text-xs"
          role="region"
          aria-live="polite"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export { IGRPDatePickerSingle, type IGRPDatePickerSingleProps };

'use client'

import { useId, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useFormContext } from 'react-hook-form';

import { cn } from '../../../../lib/utils';
import type { IGRPInputProps } from '../../../../types';
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
import { IGRPCalendar, type IGRPCalendarProps } from '../../calendar/calendar';
import { IGRPLabel } from '../../label';

/**
 * Base props for date picker components (label, helper, format, etc.).
 * @see IGRPDatePicker
 */
export type IGRPDatePickerBaseProps = {
  /** Validation error message. */
  error?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Disable the calendar popover. */
  disabledPicker?: boolean;
  /** date-fns format string. */
  dateFormat?: string;
  /** Placeholder when no date selected. */
  placeholder?: string;
} & Pick<IGRPInputProps, 'label' | 'helperText' | 'labelClassName' | 'name' | 'gridSize'>;

/**
 * Props for the IGRPDatePicker component (deprecated).
 * @see IGRPDatePicker
 */
type IGRPDatePickerProps = IGRPCalendarProps & IGRPDatePickerBaseProps;

/**
 * Single-date picker (deprecated). Use IGRPDatePickerSingle instead.
 * @deprecated This component will be deprecated in the next release.
 * Please migrate to the standard IGRPDatePickerSingle component from `@igrp/igrp-framework-react-design-system`.
 *
 * @example
 * // Instead of:
 * // <IGRPDatePicker id="my-calendar" date={date} onDateChange={setDate} />
 *
 * // Use:
 * // <IGRPDatePickerSingle id="my-calendar" date={date} onDateChange={setDate} {..props} />
 */
function IGRPDatePicker({
  name,
  id,
  date,
  onDateChange,
  startDate = new Date(1850, 0),
  endDate = new Date(2150, 11),
  label,
  labelClassName,
  helperText,
  className,
  error,
  required = false,
  disabledPicker = false,
  disabled,
  dateFormat = 'dd/MM/yyyy',
  placeholder = 'Pick a date',
}: IGRPDatePickerProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;
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
        'group bg-background hover:bg-accent border border-input hover:text-accent-foreground w-full justify-between font-normal outline-offset-0 outline-none focus-visible:outline-[3px] rounded-md shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        !value && 'text-muted-foreground',
        error && 'border-destructive focus-visible:ring-destructive/20',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <IGRPButton
        id={fieldName}
        variant="outline"
        className={cn(
          'underline-offset-0 hover:no-underline border-0 bg-transparent hover:bg-transparent shadow-none',
        )}
        disabled={disabledPicker}
        iconName="Calendar"
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
  ) => {
    // Use fieldValue for form context, localDate for standalone
    const displayDate = formContext ? fieldValue : localDate;

    return (
      <>
        <Popover>
          <PopoverTrigger asChild>{DateButton(displayDate)}</PopoverTrigger>
          <PopoverContent className={cn('w-auto p-2')} align="start">
            <IGRPCalendar
              id={fieldName}
              date={displayDate}
              onDateChange={onChange}
              startDate={startDate}
              endDate={endDate}
              mode="single"
            />
          </PopoverContent>
        </Popover>
        {displayDate && (
          <IGRPButton
            onClick={() => {
              setLocalDate(undefined);
              onChange(undefined);
              onDateChange?.(undefined);
            }}
            variant="link"
            className={cn(
              'size-2 absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground z-100',
            )}
            size="icon"
            iconName="X"
            iconSize={10}
            disabled={disabledPicker}
            showIcon={displayDate ? true : false}
          />
        )}
      </>
    );
  };

  if (formContext) {
    return (
      <div className={cn('*:not-first:mt-2', className)}>
        <FormField
          control={formContext.control}
          name={fieldName}
          render={({ field, fieldState }) => {
            // Sync local state when field value changes externally
            useEffect(() => {
              if (field.value !== localDate) {
                setLocalDate(field.value);
              }
            }, [field.value]);

            return (
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
                <FormMessage className={cn('text-xs')} />
              </FormItem>
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('*:not-first:mt-2', className)}>
      {label && (
        <IGRPLabel label={label} className={labelClassName} required={required} id={name} />
      )}
      <div className={cn('relative')}>
        {renderPicker(localDate, (val) => {
          setLocalDate(val);
          onDateChange?.(val);
        })}
      </div>

      {helperText && !error && (
        <p
          id={`${fieldName}-helper`}
          className={cn('text-muted-foreground mt-2 text-xs')}
          role="region"
          aria-live="polite"
        >
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${fieldName}-helper`} className={cn('text-destructive mt-2 text-xs')} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { IGRPDatePicker, type IGRPDatePickerProps };

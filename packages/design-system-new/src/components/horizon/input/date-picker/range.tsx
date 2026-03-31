'use client';

import { useId, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useFormContext } from 'react-hook-form';
import { type DateRange } from 'react-day-picker';

import { cn } from '../../../../lib/utils';
import type { IGRPDatePickerBaseProps } from '../../../../types';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import { IGRPButton } from '../../button';
import { IGRPLabel } from '../../label';
import { IGRPCalendarRange, type IGRPCalendarRangeProps } from '../../calendar/range';
import { DD_MM_YYYY } from '../../../../lib/constants';

/** @internal Trigger button showing the selected date range. */
function DatePickerRangeTrigger({
  value,
  fieldName,
  placeholder,
  dateFormat,
  disabledPicker,
}: {
  value: DateRange | undefined;
  fieldName: string;
  placeholder: string;
  dateFormat: string;
  disabledPicker?: boolean;
}) {
  const displayText = value?.from
    ? `${format(value.from, dateFormat)}${value.to ? ` - ${format(value.to, dateFormat)}` : ''}`
    : placeholder;
  return (
    <div
      className={cn(
        'flex gap-2 items-center relative',
        'group bg-background hover:bg-background border border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] h-10 rounded-md',
        !value && 'text-muted-foreground',
        disabledPicker && 'opacity-50 cursor-not-allowed',
      )}
    >
      <IGRPButton
        id={fieldName}
        variant="link"
        className={cn('underline-offset-0 hover:no-underline')}
        disabled={disabledPicker}
        iconName="Calendar"
        iconClassName="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
        showIcon={!value?.from}
        iconPlacement="end"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>{displayText}</span>
      </IGRPButton>
    </div>
  );
}

/** @internal Popover + calendar + clear button for date range. */
function DatePickerRangeField({
  value,
  onChange,
  fieldName,
  calendarProps,
  placeholder,
  dateFormat,
  disabled,
  disabledPicker,
}: {
  value: DateRange | undefined;
  onChange: (date: DateRange | undefined) => void;
  fieldName: string;
  calendarProps: Omit<IGRPCalendarRangeProps, 'date' | 'onDateChange' | 'id'>;
  placeholder: string;
  dateFormat: string;
  disabled?: IGRPCalendarRangeProps['disabled'];
  disabledPicker?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative')}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <DatePickerRangeTrigger
            value={value}
            fieldName={fieldName}
            placeholder={placeholder}
            dateFormat={dateFormat}
            disabledPicker={disabledPicker}
          />
        </PopoverTrigger>
        <PopoverContent className={cn('p-0 w-auto shadow-none')} align="start">
          <IGRPCalendarRange
            {...calendarProps}
            id={fieldName}
            date={value}
            onDateChange={(val) => {
              onChange(val);
              setOpen(false);
            }}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
      {value?.from && (
        <IGRPButton
          onClick={() => onChange(undefined)}
          variant="link"
          className={cn(
            'size-2 absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground z-100',
          )}
          size="icon"
          iconName="X"
          iconSize={10}
          disabled={disabledPicker}
          showIcon
        />
      )}
    </div>
  );
}

/**
 * Props for the IGRPDatePickerRange component.
 * @see IGRPDatePickerRange
 */
type IGRPDatePickerRangeProps = IGRPCalendarRangeProps & IGRPDatePickerBaseProps;

/**
 * Date range picker with popover calendar. Integrates with react-hook-form.
 */
function IGRPDatePickerRange({
  name,
  id,
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
  ...props
}: IGRPDatePickerRangeProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const [localDate, setLocalDate] = useState<DateRange | undefined>(undefined);
  const displayDate = date ?? localDate;
  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePickerRange in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const fieldProps = {
    fieldName,
    calendarProps: props,
    placeholder,
    dateFormat,
    disabled,
    disabledPicker,
  };

  if (formContext) {
    return (
      <FormField
        control={formContext.control}
        name={fieldName}
        render={({ field, fieldState }) => (
          <FormItem className={className}>
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
              <DatePickerRangeField
                {...fieldProps}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  onDateChange?.(val);
                }}
              />
            </FormControl>

            {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className={cn('*:not-first:mt-2', className)}>
      {label && (
        <IGRPLabel label={label} required={required} id={name} className={labelClassName} />
      )}

      <DatePickerRangeField
        {...fieldProps}
        value={displayDate}
        onChange={(val) => {
          setLocalDate(val);
          onDateChange?.(val);
        }}
      />

      {helperText && <p className={cn('text-sm text-muted-foreground mt-1')}>{helperText}</p>}
    </div>
  );
}

export { IGRPDatePickerRange, type IGRPDatePickerRangeProps };

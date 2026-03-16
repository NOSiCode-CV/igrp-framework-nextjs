'use client';

import { useId, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useFormContext } from 'react-hook-form';

import { cn } from '../../../../lib/utils';
import type { IGRPDatePickerBaseProps } from '../../../../types';
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
import { IGRPLabel } from '../../label';
import { IGRPCalendarMultiple, type IGRPCalendarMultipleProps } from '../../calendar/multiple';
import { DD_MM_YYYY } from '../../../../lib/constants';

/** @internal Trigger button showing the selected date(s). */
function DatePickerMultipleTrigger({
  value,
  fieldName,
  placeholder,
  dateFormat,
  disabledPicker,
}: {
  value: Date[] | undefined;
  fieldName: string;
  placeholder: string;
  dateFormat: string;
  disabledPicker?: boolean;
}) {
  const displayText = !value?.length
    ? placeholder
    : value.length === 1
      ? format(value[0]!, dateFormat)
      : value.length === 2
        ? `${format(value[0]!, dateFormat)} - ${format(value[1]!, dateFormat)}`
        : `${format(value[0]!, dateFormat)} - ${format(value[value.length - 1]!, dateFormat)}`;

  return (
    <div
      className={cn(
        'flex gap-2 items-center relative',
        'group bg-background hover:bg-background border border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] h-10 rounded-md',
        !value?.length && 'text-muted-foreground',
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
        showIcon={!value?.length}
        iconPlacement="end"
      >
        <span className={cn('truncate', !value?.length && 'text-muted-foreground')}>
          {displayText}
        </span>
      </IGRPButton>
    </div>
  );
}

/** @internal Popover + calendar + clear button for multiple dates. */
function DatePickerMultipleField({
  value,
  onChange,
  fieldName,
  calendarProps,
  placeholder,
  dateFormat,
  disabled,
  disabledPicker,
}: {
  value: Date[] | undefined;
  onChange: (date: Date[] | undefined) => void;
  fieldName: string;
  calendarProps: Omit<IGRPCalendarMultipleProps, 'date' | 'onDateChange' | 'id'>;
  placeholder: string;
  dateFormat: string;
  disabled?: IGRPCalendarMultipleProps['disabled'];
  disabledPicker?: boolean;
}) {
  return (
    <div className={cn('relative')}>
      <Popover>
        <PopoverTrigger asChild>
          <DatePickerMultipleTrigger
            value={value}
            fieldName={fieldName}
            placeholder={placeholder}
            dateFormat={dateFormat}
            disabledPicker={disabledPicker}
          />
        </PopoverTrigger>
        <PopoverContent className={cn('p-0 w-auto shadow-none')} align="start">
          <IGRPCalendarMultiple
            {...calendarProps}
            id={fieldName}
            date={value}
            onDateChange={onChange}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
      {value?.length && (
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
 * Props for the IGRPDatePickerMultiple component.
 * @see IGRPDatePickerMultiple
 */
type IGRPDatePickerMultipleProps = IGRPCalendarMultipleProps & IGRPDatePickerBaseProps;

/**
 * Multi-date picker with popover calendar. Integrates with react-hook-form.
 */
function IGRPDatePickerMultiple({
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
}: IGRPDatePickerMultipleProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const [localDate, setLocalDate] = useState<Date[] | undefined>(undefined);
  const displayDate = date ?? localDate;
  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePickerMultiple in standalone mode requires `onDateChange`');
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
              <DatePickerMultipleField
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

      <DatePickerMultipleField
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

export { IGRPDatePickerMultiple, type IGRPDatePickerMultipleProps };

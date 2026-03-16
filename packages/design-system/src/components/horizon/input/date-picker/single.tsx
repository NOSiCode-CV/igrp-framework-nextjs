'use client';

import { useId, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useFormContext } from 'react-hook-form';

import { DD_MM_YYYY } from '../../../../lib/constants';
import { cn } from '../../../../lib/utils';
import { type IGRPDatePickerBaseProps, type IGRPInputProps } from '../../../../types';
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

/** @internal Trigger button showing the selected date. */
function DatePickerTrigger({
  value,
  fieldName,
  placeholder,
  dateFormat,
  disabled,
  disabledPicker,
}: {
  value: Date | undefined;
  fieldName: string;
  placeholder: string;
  dateFormat: string;
  disabled?: boolean;
  disabledPicker?: boolean;
}) {
  const displayText = value ? format(value, dateFormat) : placeholder;
  return (
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
        className={cn(
          'underline-offset-0 hover:no-underline border-0 bg-transparent hover:bg-transparent shadow-none justify-between w-full',
        )}
        disabled={disabledPicker}
        iconName="Calendar"
        iconClassName="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
        showIcon={value ? false : true}
        iconPlacement="end"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>{displayText}</span>
      </IGRPButton>
    </div>
  );
}

/** @internal Popover + calendar + clear button. */
function DatePickerSingleField({
  value,
  onChange,
  fieldName,
  calendarProps,
  placeholder,
  dateFormat,
  disabled,
  disabledPicker,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  fieldName: string;
  calendarProps: Omit<IGRPCalendarSingleProps, 'date' | 'onDateChange' | 'id'>;
  placeholder: string;
  dateFormat: string;
  disabled?: boolean;
  disabledPicker?: boolean;
}) {
  return (
    <div className={cn('relative')}>
      <Popover>
        <PopoverTrigger asChild>
          <DatePickerTrigger
            value={value}
            fieldName={fieldName}
            placeholder={placeholder}
            dateFormat={dateFormat}
            disabled={disabled}
            disabledPicker={disabledPicker}
          />
        </PopoverTrigger>
        <PopoverContent className={cn('p-0 w-auto shadow-none')} align="start">
          <IGRPCalendarSingle
            id={fieldName}
            date={value}
            onDateChange={onChange}
            captionLayout="dropdown"
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
      {value && (
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
 * Props for the IGRPDatePickerSingle component.
 * @see IGRPDatePickerSingle
 */
type IGRPDatePickerSingleProps = IGRPCalendarSingleProps &
  IGRPDatePickerBaseProps & {
    /**
     * @deprecated This props will be deprecated in the next release.
     */
    gridSize?: IGRPInputProps['gridSize'];
  };

/**
 * Single-date picker with popover calendar. Integrates with react-hook-form.
 */
function IGRPDatePickerSingle({
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
  ...calendarProps
}: IGRPDatePickerSingleProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const [localDate, setLocalDate] = useState<Date | undefined>(undefined);
  const displayDate = date ?? localDate;
  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const fieldProps = {
    fieldName,
    calendarProps,
    placeholder,
    dateFormat,
    disabled: !!disabled,
    disabledPicker,
  };

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
                <DatePickerSingleField
                  {...fieldProps}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    onDateChange?.(val);
                  }}
                />
              </FormControl>

              {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
              <FormMessage className={cn('text-xs')} />
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
      <DatePickerSingleField
        {...fieldProps}
        value={displayDate}
        onChange={(val) => {
          setLocalDate(val);
          onDateChange?.(val);
        }}
      />

      {helperText && (
        <p
          id={`${fieldName}-helper`}
          className={cn('text-muted-foreground mt-2 text-xs')}
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

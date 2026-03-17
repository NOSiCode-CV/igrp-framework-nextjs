'use client';

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
import { IGRPCalendar, type IGRPCalendarPropsDeprecated } from '../../calendar/calendar';
import { IGRPLabel } from '../../label';

/** Default date range for calendar dropdown. */
const DEFAULT_START_DATE = new Date(1850, 0);
const DEFAULT_END_DATE = new Date(2150, 11);

/** @internal Trigger button for the date picker popover. */
function DatePickerTriggerButton({
  fieldName,
  displayDate,
  dateFormat,
  placeholder,
  error,
  disabled,
  disabledPicker,
}: {
  fieldName: string;
  displayDate: Date | undefined;
  dateFormat: string;
  placeholder: string;
  error?: string;
  disabled?: IGRPCalendarPropsDeprecated['disabled'];
  disabledPicker?: boolean;
}) {
  const displayText = displayDate ? format(displayDate, dateFormat) : placeholder;
  return (
    <div
      className={cn(
        'flex gap-2 items-center relative',
        'group bg-background hover:bg-accent border border-input hover:text-accent-foreground w-full justify-between font-normal outline-offset-0 outline-none focus-visible:outline-[3px] rounded-md shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        !displayDate && 'text-muted-foreground',
        error && 'border-destructive focus-visible:ring-destructive/20',
        !!disabled && 'opacity-50 cursor-not-allowed',
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
        showIcon={!displayDate}
        iconPlacement="end"
      >
        <span className={cn('truncate', !displayDate && 'text-muted-foreground')}>
          {displayText}
        </span>
      </IGRPButton>
    </div>
  );
}

/** @internal Popover + calendar field. */
function DatePickerPopoverField({
  fieldName,
  displayDate,
  onChange,
  onClear,
  startDate,
  endDate,
  dateFormat,
  placeholder,
  disabledPicker,
  error,
  disabled,
}: {
  fieldName: string;
  displayDate: Date | undefined;
  onChange: (date: Date | undefined) => void;
  onClear: () => void;
  startDate: Date;
  endDate: Date;
  dateFormat: string;
  placeholder: string;
  disabledPicker: boolean;
  error?: string;
  disabled?: IGRPCalendarPropsDeprecated['disabled'];
}) {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <DatePickerTriggerButton
            fieldName={fieldName}
            displayDate={displayDate}
            dateFormat={dateFormat}
            placeholder={placeholder}
            error={error}
            disabled={disabled}
            disabledPicker={disabledPicker}
          />
        </PopoverTrigger>
        <PopoverContent className={cn('w-auto p-2')} align="start">
          <IGRPCalendar
            id={fieldName}
            date={displayDate}
            onDateChange={onChange}
            startDate={startDate}
            endDate={endDate}
            mode="single"
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
      {displayDate && (
        <IGRPButton
          onClick={onClear}
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
    </>
  );
}

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
type IGRPDatePickerProps = IGRPCalendarPropsDeprecated & IGRPDatePickerBaseProps;

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
/** @internal Standalone date picker with local state; keyed by date to reset when prop changes. */
function StandaloneDatePickerContent({
  date,
  onDateChange,
  fieldName,
  startDate,
  endDate,
  dateFormat,
  placeholder,
  disabledPicker,
  error,
  disabled,
  helperText,
}: {
  date: Date | undefined;
  onDateChange?: (date: Date | undefined) => void;
  fieldName: string;
  startDate: Date;
  endDate: Date;
  dateFormat: string;
  placeholder: string;
  disabledPicker: boolean;
  error?: string;
  disabled?: IGRPCalendarPropsDeprecated['disabled'];
  helperText?: string;
}) {
  const [localDate, setLocalDate] = useState<Date | undefined>(undefined);
  const displayDate = date ?? localDate;

  return (
    <>
      <div className={cn('relative')}>
        <DatePickerPopoverField
          fieldName={fieldName}
          displayDate={displayDate}
          onChange={(val) => {
            setLocalDate(val);
            onDateChange?.(val);
          }}
          onClear={() => {
            setLocalDate(undefined);
            onDateChange?.(undefined);
          }}
          startDate={startDate}
          endDate={endDate}
          dateFormat={dateFormat}
          placeholder={placeholder}
          disabledPicker={disabledPicker}
          error={error}
          disabled={disabled}
        />
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
    </>
  );
}

function IGRPDatePicker({
  name,
  id,
  date,
  onDateChange,
  startDate = DEFAULT_START_DATE,
  endDate = DEFAULT_END_DATE,
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
  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  if (formContext) {
    return (
      <div className={cn('*:not-first:mt-2', className)}>
        <FormField
          control={formContext.control}
          name={fieldName}
          render={({ field, fieldState }) => {
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
                  <DatePickerPopoverField
                    fieldName={fieldName}
                    displayDate={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      onDateChange?.(val);
                    }}
                    onClear={() => {
                      field.onChange(undefined);
                      onDateChange?.(undefined);
                    }}
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat={dateFormat}
                    placeholder={placeholder}
                    disabledPicker={disabledPicker}
                    error={error ?? fieldState.error?.message}
                    disabled={disabled}
                  />
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
      <StandaloneDatePickerContent
        key={date?.getTime() ?? 'empty'}
        date={date}
        onDateChange={onDateChange}
        fieldName={fieldName}
        startDate={startDate}
        endDate={endDate}
        dateFormat={dateFormat}
        placeholder={placeholder}
        disabledPicker={disabledPicker}
        error={error}
        disabled={disabled}
        helperText={helperText}
      />
    </div>
  );
}

export { IGRPDatePicker, type IGRPDatePickerProps as IGRPDatePickerPropsDeprecated };

'use client';

import { useId, useState, useEffect, useRef } from 'react';
import type { Control } from 'react-hook-form';
import { useFormContext, useWatch } from 'react-hook-form';
import { CalendarIcon, XIcon } from 'lucide-react';

import {
  formatDateToString,
  getDisabledDays,
  isValidDate,
  parseStringToDate,
} from '../../../../lib/calendar-utils';
import { DD_MM_YYYY } from '../../../../lib/constants';
import { cn } from '../../../../lib/utils';
import { type IGRPDatePickerBaseProps } from '../../../../types';
import { Button } from '../../../primitives/button';
import { Calendar } from '../../../primitives/calendar';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../primitives/form';
import { Input } from '../../../primitives/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../primitives/popover';
import { type IGRPCalendarSingleProps } from '../../calendar/single';
import { IGRPLabel } from '../../label';

/**
 * Props for the IGRPDatePickerInputSingle component.
 * @see IGRPDatePickerInputSingle
 */
type IGRPDatePickerInputSingleProps = IGRPCalendarSingleProps &
  IGRPDatePickerBaseProps & {
    /** CSS classes for the input group wrapper. */
    inputGroupClassName?: string;
  };

/** @internal Props for form sync component. */
type FormSyncProps = {
  fieldName: string;
  date: Date | undefined;
  dateFormat: string;
  setLocalDate: (d: Date | undefined) => void;
  setValue: (v: string) => void;
  setMonth: (d: Date | undefined) => void;
  prevDateRef: React.MutableRefObject<Date | undefined>;
  setValueForm: (name: string, value: Date | undefined) => void;
  control: Control;
};

/** @internal Syncs form value with local date/input state. */
function FormConnectedDatePickerSync({
  fieldName,
  date,
  dateFormat,
  setLocalDate,
  setValue,
  setMonth,
  prevDateRef,
  setValueForm,
  control,
}: FormSyncProps) {
  const watchedValue = useWatch({ control, name: fieldName, defaultValue: undefined });

  useEffect(() => {
    const dateChanged = prevDateRef.current !== date;
    if (dateChanged) {
      prevDateRef.current = date;
    }

    const valueToSync = (dateChanged ? date : watchedValue) as Date | undefined;

    setLocalDate(valueToSync);
    setValue(formatDateToString(valueToSync, dateFormat));
    if (valueToSync) {
      setMonth(valueToSync);
    } else {
      setMonth(undefined);
    }

    if (dateChanged && watchedValue !== date) {
      setValueForm(fieldName, date);
    }
  }, [watchedValue, date, dateFormat, fieldName, setLocalDate, setValue, setMonth, setValueForm]);

  return null;
}

/**
 * Single-date picker with text input and calendar popover.
 * Supports typing dates and picking from calendar. Integrates with react-hook-form.
 */
function IGRPDatePickerInputSingle({
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
  dateFormat = DD_MM_YYYY,
  placeholder: placeholderProp,
  disableBefore,
  disableAfter,
  disableDayOfWeek,
  inputGroupClassName,
  ...calendarProps
}: IGRPDatePickerInputSingleProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const formContext = useFormContext();

  const [localDate, setLocalDate] = useState<Date | undefined>(date);
  const [month, setMonth] = useState<Date | undefined>(localDate);
  const [value, setValue] = useState(formatDateToString(date, dateFormat));
  const [open, setOpen] = useState(false);
  const prevDateRef = useRef<Date | undefined>(date);

  const placeholder = placeholderProp ?? dateFormat;

  // Sync local state with date prop when it changes externally (standalone only)
  useEffect(() => {
    if (!formContext) {
      setLocalDate(date);
      setValue(formatDateToString(date, dateFormat));
      if (date) {
        setMonth(date);
      } else {
        setMonth(undefined);
      }
    }
  }, [date, formContext, dateFormat]);

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  useEffect(() => {
    if (disabledPicker && open) setOpen(false);
  }, [disabledPicker, open]);

  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  const renderPicker = (onChange: (date: Date | undefined) => void) => {
    const displayDate = localDate;
    const displayValue = value;

    return (
      <div className={cn('relative flex gap-2')}>
        <Input
          id={fieldName}
          name={fieldName}
          value={displayValue}
          placeholder={placeholder}
          className={cn('bg-background pr-10')}
          disabled={disabledPicker}
          onChange={(e) => {
            const newValue = e.target.value;
            setValue(newValue);
            if (!newValue) {
              setLocalDate(undefined);
              setMonth(undefined);
              onChange(undefined);
              onDateChange?.(undefined);
              return;
            }

            const parsedDate = parseStringToDate(newValue, dateFormat);
            if (isValidDate(parsedDate)) {
              setLocalDate(parsedDate);
              setMonth(parsedDate);
              onChange(parsedDate);
              onDateChange?.(parsedDate);
            } else {
              setLocalDate(undefined);
              setMonth(undefined);
              onChange(undefined);
              onDateChange?.(undefined);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !disabledPicker) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />

        {displayDate && (
          <Button
            type="button"
            id={`${fieldName}-clean`}
            variant="ghost"
            className={cn('absolute top-1/2 right-8 size-6 -translate-y-1/2')}
            disabled={disabledPicker}
            aria-label="Remover Data"
            onClick={() => {
              setLocalDate(undefined);
              setMonth(undefined);
              setValue('');
              setOpen(false);
              onDateChange?.(undefined);
              onChange(undefined);
            }}
          >
            <XIcon className={cn('size-3.5')} />
          </Button>
        )}

        <Popover
          open={open}
          onOpenChange={(v) => {
            if (!disabledPicker) setOpen(v);
          }}
        >
          <PopoverTrigger asChild>
            {!displayDate && (
              <Button
                type="button"
                id={`date-picker-btn-${fieldName}`}
                variant="ghost"
                className={cn('absolute top-1/2 right-2 size-6 -translate-y-1/2')}
                disabled={disabledPicker}
              >
                <CalendarIcon className={cn('size-3.5')} />
                <span className={cn('sr-only')}>Selecionar Data</span>
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent
            className={cn('p-0 w-auto shadow-none')}
            align="start"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              id={name || id}
              selected={displayDate}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                if (date) {
                  setLocalDate(date);
                  setValue(formatDateToString(date, dateFormat));
                  setMonth(date);
                } else {
                  setLocalDate(undefined);
                  setValue('');
                  setMonth(undefined);
                }
                onChange(date);
                setOpen(false);
              }}
              disabled={disabled}
              className={cn('rounded-lg border shadow-sm', className)}
              {...calendarProps}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  if (formContext) {
    return (
      <div className={cn('*:not-first:mt-2', className)}>
        <FormConnectedDatePickerSync
          fieldName={fieldName}
          date={date}
          dateFormat={dateFormat}
          setLocalDate={setLocalDate}
          setValue={setValue}
          setMonth={setMonth}
          prevDateRef={prevDateRef}
          setValueForm={formContext.setValue}
          control={formContext.control}
        />
        <FormField
          control={formContext.control}
          name={fieldName}
          render={({ field, fieldState }) => (
            <FormItem className={inputGroupClassName}>
              {label && (
                <FormLabel
                  htmlFor={fieldName}
                  className={cn(
                    labelClassName,
                    required && 'after:content-["*"] after:text-destructive',
                  )}
                >
                  {label}
                </FormLabel>
              )}
              <FormControl>
                {renderPicker((val) => {
                  field.onChange(val);
                  onDateChange?.(val);
                })}
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

      {renderPicker((val) => {
        setLocalDate(val);
        onDateChange?.(val);
      })}

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

export { IGRPDatePickerInputSingle, type IGRPDatePickerInputSingleProps };

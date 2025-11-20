'use client';

import { useId, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
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

type IGRPDatePickerInputSingleProps = IGRPCalendarSingleProps & IGRPDatePickerBaseProps;

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
  disableBefore,
  disableAfter,
  disableDayOfWeek,
  ...calendarProps
}: IGRPDatePickerInputSingleProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const formContext = useFormContext();

  const [localDate, setLocalDate] = useState<Date | undefined>(date);
  const [month, setMonth] = useState<Date | undefined>(localDate);
  const [value, setValue] = useState(formatDateToString(date, dateFormat));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!formContext) {
      setLocalDate(date);
      setValue(formatDateToString(date, dateFormat));
    }
  }, [date, formContext, dateFormat]);

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  const renderPicker = (
    fieldValue: Date | undefined,
    onChange: (date: Date | undefined) => void,
  ) => {
    // Use fieldValue for form context, localDate for standalone
    const displayDate = formContext ? fieldValue : localDate;
    const displayValue = formContext ? formatDateToString(fieldValue, dateFormat) : value;

    return (
      <div className="relative flex gap-2">
        <Input
          id={fieldName}
          name={fieldName}
          value={displayValue}
          placeholder={dateFormat}
          className="bg-background pr-10"
          disabled={disabledPicker}
          onChange={(e) => {
            const parsedDate = parseStringToDate(e.target.value, dateFormat);
            const newValue = e.target.value;
            setValue(newValue);
            if (isValidDate(parsedDate)) {
              setLocalDate(parsedDate);
              setMonth(parsedDate);
              onChange(parsedDate);
              onDateChange?.(parsedDate);
            } else if (!formContext) {
              // For standalone mode, update value even if invalid
              setValue(newValue);
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
            id={`${fieldName}-clean`}
            variant="ghost"
            className="absolute top-1/2 right-8 size-6 -translate-y-1/2"
            disabled={disabledPicker}
            aria-label="Open Calendar"
            onClick={() => {
              setLocalDate(undefined);
              setMonth(undefined);
              setValue('');
              onDateChange?.(undefined);
              onChange(undefined);
            }}
          >
            <XIcon className="size-3.5" />
            <span className="sr-only">Remover Data</span>
          </Button>
        )}

        <Popover open={open} onOpenChange={(v) => !disabledPicker && setOpen(v)}>
          <PopoverTrigger asChild>
            {!displayDate && (
              <Button
                id={`date-picker-btn-${fieldName}`}
                variant="ghost"
                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              >
                <CalendarIcon className="size-3.5" />
                <span className="sr-only">Selecionar Data</span>
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-auto shadow-none"
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
        <FormField
          control={formContext.control}
          name={fieldName}
          render={({ field, fieldState }) => {
            // Sync local state when field value changes externally
            useEffect(() => {
              if (field.value !== localDate) {
                setLocalDate(field.value);
                setValue(formatDateToString(field.value, dateFormat));
                if (field.value) {
                  setMonth(field.value);
                }
              }
            }, [field.value, dateFormat]);

            return (
              <FormItem>
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
                  {renderPicker(field.value, (val) => {
                    field.onChange(val);
                    onDateChange?.(val);
                  })}
                </FormControl>

                {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
                <FormMessage className="text-xs" />
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

      {renderPicker(undefined, (val) => {
        setLocalDate(val);
        onDateChange?.(val);
      })}

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

export { IGRPDatePickerInputSingle, type IGRPDatePickerInputSingleProps };

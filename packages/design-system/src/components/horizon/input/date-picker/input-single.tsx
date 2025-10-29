'use client';

import { useId, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { CalendarIcon, XIcon } from 'lucide-react';

import { 
  formatDateToString, 
  getDisabledDays, 
  isValidDate, 
  parseStringToDate 
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
  const id = useId();
  const fieldName = name ?? id;

  const formContext = useFormContext();

  const [localDate, setLocalDate] = useState<Date | undefined>(date);
  const [month, setMonth] = useState<Date | undefined>(localDate)
  const [value, setValue] = useState(formatDateToString(date, dateFormat));
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!formContext) {
      setLocalDate(date);
      setValue(formatDateToString(date, dateFormat));
    }
  }, [date, formContext]);

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  const renderPicker = (onChange: (date: Date | undefined) => void) => (
    <div className="relative flex gap-2">
      <Input
        id={fieldName}
        name={fieldName}
        value={value}
        placeholder={dateFormat}
        className="bg-background pr-10"
        disabled={disabledPicker}
        onChange={(e) => {
          const parsedDate = parseStringToDate(e.target.value, dateFormat)
          setValue(e.target.value)
          if (isValidDate(parsedDate)) {
            setLocalDate(parsedDate);
            setMonth(parsedDate)
            onChange?.(parsedDate);
            onDateChange?.(parsedDate);            
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !disabledPicker) {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />

      {localDate && (
        <Button
          id={`${fieldName}-clean`}
          variant="ghost"
          className="absolute top-1/2 right-8 size-6 -translate-y-1/2"
          disabled={disabledPicker}
          aria-label="Open Calendar"
          onClick={() => {            
            setLocalDate(undefined)
            setMonth(undefined)
            setValue('')
            onDateChange?.(undefined)
            onChange?.(undefined);
          }}
        >
          <XIcon className="size-3.5" />
          <span className="sr-only">Remover Data</span>
        </Button>
      )}

      <Popover open={open} onOpenChange={(v) => !disabledPicker && setOpen(v)}>
        <PopoverTrigger asChild>
          {!localDate && (
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
        <PopoverContent className="p-0 w-auto shadow-none" align="start" alignOffset={-8} sideOffset={10}>
          <Calendar
            mode="single"
            id={name || id}
            selected={localDate}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              setLocalDate(date);
              setValue(formatDateToString(date, dateFormat));
              onDateChange?.(date);
              setOpen(false)
            }}
            disabled={disabled}
            className={cn("rounded-lg border shadow-sm", className)}
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    </div>
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

      {renderPicker((val) => {
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

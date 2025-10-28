'use client';

import { useId, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';

import { cn } from '../../../../lib/utils';
import { type IGRPDatePickerBaseProps } from '../../../../types';
import { Button } from '../../../primitives/button';
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
import { IGRPButton } from '../../button';
import { IGRPCalendarSingle, type IGRPCalendarSingleProps } from '../../calendar/single';
import { IGRPLabel } from '../../label';
import { formatDate, isValidDate } from '../../../../lib/calendar-utils';

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
  dateFormat = 'dd/MM/yyyy',
}: IGRPDatePickerInputSingleProps) {
  const id = useId();
  const fieldName = name ?? id;
  const [localDate, setLocalDate] = useState<Date | undefined>(date);
  const [value, setValue] = useState(formatDate(date, dateFormat));
  const [open, setOpen] = useState(false)

  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext) setLocalDate(date);
  }, [date, formContext]);

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);


  const renderPicker = (
    fieldValue: Date | undefined,
    onChange: (date: Date | undefined) => void,
  ) => (
    <div className="relative flex gap-2">
      <Input
        id="date"
        value={value}
        placeholder={dateFormat}
        className="bg-background pr-10"
        onChange={(e) => {
          const date = new Date(e.target.value)
          setValue(e.target.value)
          if (isValidDate(date)) {
            onChange?.(date)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {!localDate && (
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Selecionar Data</span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto shadow-none" align="start">
          <IGRPCalendarSingle
            id={fieldName}
            date={fieldValue}
            onDateChange={(date) => {
              setLocalDate(date)
              setValue(formatDate(date, dateFormat))
              setOpen(false)
              onChange?.(date)
            }}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
      {localDate && (
        <IGRPButton
          onClick={() => {
            setLocalDate(undefined);
            onDateChange?.(undefined);
            setValue('');
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

export { IGRPDatePickerInputSingle, type IGRPDatePickerInputSingleProps };

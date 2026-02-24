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

type IGRPDatePickerMultipleProps = IGRPCalendarMultipleProps & IGRPDatePickerBaseProps;

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
  const [localDate, setLocalDate] = useState<Date[] | undefined>(date);
  const formContext = useFormContext();

  useEffect(() => {
    if (!formContext) setLocalDate(date);
  }, [date, formContext]);

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePickerRange in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const getDisplayDate = (value: Date[] | undefined) => {
    if (!value?.length) return placeholder;

    if (value.length === 1) {
      return format(value[0]!, dateFormat);
    }

    if (value.length === 2) {
      const from = format(value[0]!, dateFormat);
      const to = format(value[1]!, dateFormat);
      return `${from} - ${to}`;
    }

    if (value.length > 2) {
      const from = format(value[0]!, dateFormat);
      const to = format(value[value.length - 1]!, dateFormat);
      return `${from} - ${to}`;
    }

    return placeholder;
  };

  const DateButton = (value: Date[] | undefined) => (
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
        showIcon={localDate ? false : true}
        iconPlacement="end"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {getDisplayDate(value)}
        </span>
      </IGRPButton>
    </div>
  );

  const renderPicker = (fieldValue?: Date[], onChange?: (val: Date[] | undefined) => void) => {
    // Use fieldValue for form context, localDate for standalone
    const displayDate = formContext ? fieldValue : localDate;

    return (
      <>
        <Popover>
          <PopoverTrigger asChild>{DateButton(displayDate)}</PopoverTrigger>
          <PopoverContent className={cn('p-0 w-auto shadow-none')} align="start">
            <IGRPCalendarMultiple
              {...props}
              id={id}
              date={displayDate}
              onDateChange={(val) => {
                setLocalDate(val);
                onChange?.(val);
                onDateChange?.(val);
              }}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>

        {displayDate && (
          <IGRPButton
            onClick={() => {
              setLocalDate(undefined);
              onChange?.(undefined);
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
                {renderPicker(field.value, (val) => {
                  field.onChange(val);
                  onDateChange?.(val);
                })}
              </FormControl>

              {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }

  return (
    <div className={cn('*:not-first:mt-2', className)}>
      {label && (
        <IGRPLabel label={label} required={required} id={name} className={labelClassName} />
      )}

      <div className={cn('relative')}>{renderPicker(localDate, onDateChange)}</div>

      {helperText && <p className={cn('text-sm text-muted-foreground mt-1')}>{helperText}</p>}
    </div>
  );
}

export { IGRPDatePickerMultiple, type IGRPDatePickerMultipleProps };

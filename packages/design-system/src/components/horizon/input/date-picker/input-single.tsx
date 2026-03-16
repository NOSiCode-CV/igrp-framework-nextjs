'use client';

import { useId, useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { useFormContext, useWatch, type Control } from 'react-hook-form';
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

type DatePickerInputState = {
  localDate: Date | undefined;
  value: string;
  month: Date | undefined;
};

type DatePickerInputAction =
  | { type: 'SYNC'; date: Date | undefined; dateFormat: string }
  | { type: 'SET_FROM_INPUT'; value: string; date: Date | undefined }
  | { type: 'CLEAR' }
  | { type: 'SELECT'; date: Date | undefined; dateFormat: string }
  | { type: 'SET_MONTH'; month: Date | undefined };

function datePickerInputReducer(
  state: DatePickerInputState,
  action: DatePickerInputAction,
): DatePickerInputState {
  switch (action.type) {
    case 'SYNC':
      return {
        localDate: action.date,
        value: formatDateToString(action.date, action.dateFormat),
        month: action.date ?? state.month,
      };
    case 'SET_FROM_INPUT':
      return {
        localDate: action.date,
        value: action.value,
        month: action.date ?? state.month,
      };
    case 'CLEAR':
      return { localDate: undefined, value: '', month: undefined };
    case 'SELECT':
      return {
        localDate: action.date,
        value: action.date ? formatDateToString(action.date, action.dateFormat) : '',
        month: action.date ?? state.month,
      };
    case 'SET_MONTH':
      return { ...state, month: action.month };
    default:
      return state;
  }
}

/** @internal Props for form sync component. */
type FormSyncProps = {
  fieldName: string;
  date: Date | undefined;
  dateFormat: string;
  dispatch: React.Dispatch<DatePickerInputAction>;
  prevDateRef: React.MutableRefObject<Date | undefined>;
  setValueForm: (name: string, value: Date | undefined) => void;
  control: Control;
};

/** @internal Syncs form value with local date/input state. */
function FormConnectedDatePickerSync({
  fieldName,
  date,
  dateFormat,
  dispatch,
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
    dispatch({ type: 'SYNC', date: valueToSync, dateFormat });

    if (dateChanged && watchedValue !== date) {
      setValueForm(fieldName, date);
    }
  }, [watchedValue, date, dateFormat, fieldName, dispatch, setValueForm, prevDateRef]);

  return null;
}

/** @internal Input + calendar popover field. */
function DatePickerInputSingleField({
  fieldName,
  displayDate,
  displayValue,
  displayMonth,
  placeholder,
  disabledPicker,
  disabled,
  open,
  setOpen,
  calendarProps,
  className,
  onInputChange,
  onClear,
  onSelect,
  onMonthChange,
}: {
  fieldName: string;
  displayDate: Date | undefined;
  displayValue: string;
  displayMonth: Date | undefined;
  placeholder: string;
  disabledPicker: boolean;
  disabled: ReturnType<typeof getDisabledDays>;
  open: boolean;
  setOpen: (v: boolean) => void;
  calendarProps: Omit<IGRPCalendarSingleProps, 'date' | 'onDateChange'>;
  className?: string;
  onInputChange: (value: string) => void;
  onClear: () => void;
  onSelect: (date: Date | undefined) => void;
  onMonthChange?: (month: Date | undefined) => void;
}) {
  return (
    <div className={cn('relative flex gap-2')}>
      <Input
        id={fieldName}
        name={fieldName}
        value={displayValue}
        placeholder={placeholder}
        className={cn('bg-background pr-10')}
        disabled={disabledPicker}
        onChange={(e) => onInputChange(e.target.value)}
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
          onClick={onClear}
        >
          <XIcon className={cn('size-3.5')} />
        </Button>
      )}

      <Popover
        open={disabledPicker ? false : open}
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
            id={fieldName}
            selected={displayDate}
            captionLayout="dropdown"
            month={displayMonth}
            onMonthChange={onMonthChange}
            onSelect={onSelect}
            disabled={disabled}
            className={cn('rounded-lg border shadow-sm', className)}
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
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

  const [state, dispatch] = useReducer(datePickerInputReducer, {
    localDate: undefined,
    value: '',
    month: undefined,
  });
  const { localDate, value, month } = state;
  const [open, setOpen] = useState(false);
  const prevDateRef = useRef<Date | undefined>(date);

  const displayDate = date ?? localDate;
  const displayValue = formContext
    ? value
    : date !== undefined
      ? formatDateToString(date, dateFormat)
      : value;
  const displayMonth = date ?? localDate ?? month;

  const placeholder = placeholderProp ?? dateFormat;

  useEffect(() => {
    if (!formContext && typeof onDateChange !== 'function') {
      console.warn('DatePicker in standalone mode requires `onDateChange`');
    }
  }, [formContext, onDateChange]);

  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  const handleInputChange = useCallback(
    (newValue: string, onChange: (date: Date | undefined) => void) => {
      if (!newValue) {
        dispatch({ type: 'CLEAR' });
        onChange(undefined);
        onDateChange?.(undefined);
        return;
      }
      const parsedDate = parseStringToDate(newValue, dateFormat);
      if (isValidDate(parsedDate)) {
        dispatch({ type: 'SET_FROM_INPUT', value: newValue, date: parsedDate });
        onChange(parsedDate);
        onDateChange?.(parsedDate);
      } else {
        dispatch({ type: 'SET_FROM_INPUT', value: newValue, date: undefined });
        onChange(undefined);
        onDateChange?.(undefined);
      }
    },
    [dateFormat, onDateChange],
  );

  const handleClear = useCallback(
    (onChange: (date: Date | undefined) => void) => {
      dispatch({ type: 'CLEAR' });
      setOpen(false);
      onChange(undefined);
      onDateChange?.(undefined);
    },
    [onDateChange],
  );

  const handleSelect = useCallback(
    (selectedDate: Date | undefined, onChange: (date: Date | undefined) => void) => {
      dispatch({ type: 'SELECT', date: selectedDate, dateFormat });
      onChange(selectedDate);
      setOpen(false);
    },
    [dateFormat],
  );

  if (formContext) {
    return (
      <div className={cn('*:not-first:mt-2', className)}>
        <FormConnectedDatePickerSync
          fieldName={fieldName}
          date={date}
          dateFormat={dateFormat}
          dispatch={dispatch}
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
                <DatePickerInputSingleField
                  fieldName={fieldName}
                  displayDate={displayDate}
                  displayValue={displayValue}
                  displayMonth={displayMonth}
                  placeholder={placeholder}
                  disabledPicker={disabledPicker}
                  disabled={disabled}
                  open={open}
                  setOpen={setOpen}
                  calendarProps={calendarProps}
                  className={className}
                  onInputChange={(v) => handleInputChange(v, (d) => {
                    field.onChange(d);
                    onDateChange?.(d);
                  })}
                  onClear={() =>
                    handleClear((d) => {
                      field.onChange(d);
                      onDateChange?.(d);
                    })
                  }
                  onSelect={(d) =>
                    handleSelect(d, (v) => {
                      field.onChange(v);
                      onDateChange?.(v);
                    })
                  }
                  onMonthChange={(m) => dispatch({ type: 'SET_MONTH', month: m })}
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

      <DatePickerInputSingleField
        fieldName={fieldName}
        displayDate={displayDate}
        displayValue={displayValue}
        displayMonth={displayMonth}
        placeholder={placeholder}
        disabledPicker={disabledPicker}
        disabled={disabled}
        open={open}
        setOpen={setOpen}
        calendarProps={calendarProps}
        className={className}
        onInputChange={(v) => handleInputChange(v, onDateChange ?? (() => {}))}
        onClear={() => handleClear(onDateChange ?? (() => {}))}
        onSelect={(d) => handleSelect(d, onDateChange ?? (() => {}))}
        onMonthChange={(m) => dispatch({ type: 'SET_MONTH', month: m })}
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

export { IGRPDatePickerInputSingle, type IGRPDatePickerInputSingleProps };

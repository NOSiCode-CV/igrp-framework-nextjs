'use client';

import { useState, useEffect, useId } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { Input } from '@/components/horizon/input';
import { IGRPLabel } from '@/components/igrp/label';
import { IGRPButton } from '@/components/igrp/button';
import { cn } from '@/lib/utils';
import type { IGRPInputProps, IGRPGridSize } from '@/types/globals';
import { igrpGridSizeClasses } from '@/lib/constants';

interface IGRPInputNumberProps extends Omit<IGRPInputProps, 'onChange'> {
  name: string;
  label?: string;
  helperText?: string;
  description?: string;
  defaultValue?: number;
  value?: number;
  formatOptions?: Intl.NumberFormatOptions;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  error?: string;
  errorMessage?: string;
  gridSize?: IGRPGridSize;
}

function IGRPInputNumber({
  name,
  label,
  helperText,
  description,
  className,
  defaultValue = 0,
  value: controlledValue,
  formatOptions,
  min,
  max,
  disabled = false,
  readOnly = false,
  step = 1,
  onChange,
  error,
  errorMessage = 'Please enter a valid number',
  required,
  gridSize = 'default',
  ...props
}: IGRPInputNumberProps) {
  const id = useId();
  const fieldName = name ?? id;
  const [localValue, setLocalValue] = useState(controlledValue ?? defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const formContext = useFormContext();

  const formatter = new Intl.NumberFormat(undefined, formatOptions);

  useEffect(() => {
    if (controlledValue !== undefined && !formContext) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue, formContext]);

  const constrainValue = (newValue: number): number => {
    if (min !== undefined && newValue < min) {
      return min;
    }
    if (max !== undefined && newValue > max) {
      return max;
    }
    return newValue;
  };

  const updateStandaloneValue = (newValue: number) => {
    const constrainedValue = constrainValue(newValue);
    setLocalValue(constrainedValue);
    onChange?.(constrainedValue);
  };

  const increment = (currentValue: number, updateFn?: (value: number) => void) => {
    if (!disabled && !readOnly) {
      const newValue = constrainValue(currentValue + step);
      if (updateFn) {
        updateFn(newValue);
      } else {
        updateStandaloneValue(newValue);
      }
    }
  };

  const decrement = (currentValue: number, updateFn?: (value: number) => void) => {
    if (!disabled && !readOnly) {
      const newValue = constrainValue(currentValue - step);
      if (updateFn) {
        updateFn(newValue);
      } else {
        updateStandaloneValue(newValue);
      }
    }
  };

  const handleStandaloneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;

    const inputValue = e.target.value;

    try {
      let numValue: number;

      if (formatOptions?.style === 'percent') {
        numValue = parseFloat(inputValue.replace(/[^\d.-]/g, ''));
        if (formatOptions.style === 'percent') {
          numValue = numValue / 100;
        }
      } else {
        numValue = parseFloat(inputValue.replace(/[^\d.-]/g, ''));
      }

      if (!isNaN(numValue)) {
        updateStandaloneValue(numValue);
        setValidationError(false);
      } else {
        setValidationError(true);
      }
    } catch {
      setValidationError(true);
    }
  };

  const getDisplayValue = (value: number) => {
    if (formatOptions) {
      return formatter.format(value);
    }
    return value.toString();
  };

  const renderNumberInput = (
    value: number,
    onChange?: (newValue: number) => void,
    fieldError?: boolean,
  ) => {
    const displayValue = getDisplayValue(value);

    return (
      <div className='*:not-first:mt-2'>
        {label && (
          <IGRPLabel
            label={label}
            className={className}
            required={required}
            id={fieldName}
          />
        )}
        <div
          className={cn(
            'border-input outline-none relative inline-flex h-10 w-full items-center overflow-hidden rounded-md border text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow]',
            isFocused && 'border-ring ring-2 ring-ring/50',
            (error || validationError || fieldError) &&
              'ring-destructive/20 dark:ring-destructive/40 border-destructive',
            disabled && 'opacity-50',
          )}
        >
          <Input
            id={fieldName}
            name={fieldName}
            type='text'
            value={displayValue}
            onChange={(e) => {
              if (onChange) {
                try {
                  const inputValue = e.target.value;
                  let numValue: number;

                  if (formatOptions?.style === 'percent') {
                    numValue = parseFloat(inputValue.replace(/[^\d.-]/g, '')) / 100;
                  } else {
                    numValue = parseFloat(inputValue.replace(/[^\d.-]/g, ''));
                  }

                  if (!isNaN(numValue)) {
                    onChange(constrainValue(numValue));
                    setValidationError(false);
                  } else {
                    setValidationError(true);
                  }
                } catch {
                  setValidationError(true);
                }
              } else {
                handleStandaloneInputChange(e);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                increment(value, onChange);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                decrement(value, onChange);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className='bg-background text-foreground flex-1 px-3 py-2 tabular-nums outline-none border-none focus-visible:outline-none focus-visible:ring-ring/0 focus-visible:ring-0 rounded-none'
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={!!(error || validationError || fieldError)}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            role='spinbutton'
            {...props}
          />
          {!readOnly && (
            <div className='flex h-full flex-col border-l'>
              <IGRPButton
                type='button'
                onClick={() => increment(value, onChange)}
                disabled={disabled || (max !== undefined && value >= max)}
                className='bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground flex h-1/2 w-8 items-center justify-center border-b text-xs transition-colors rounded-none'
                aria-label='Increment'
                iconName='ChevronUp'
                size='icon'
                iconSize={10}
              />
              <IGRPButton
                type='button'
                onClick={() => decrement(value, onChange)}
                disabled={disabled || (min !== undefined && value <= min)}
                className='bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground flex h-1/2 w-8 items-center justify-center text-xs transition-colors rounded-none'
                aria-label='Decrement'
                iconName='ChevronDown'
                size='icon'
                iconSize={10}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const helperOrDescription = helperText || description;

  if (!formContext) {
    return (
      <div className={cn('w-full', className)}>
        {renderNumberInput(localValue)}

        {helperOrDescription && !error && !validationError && (
          <p
            className='text-muted-foreground mt-2 text-xs'
            role='region'
            aria-live='polite'
          >
            {helperOrDescription}
          </p>
        )}

        {(error || validationError) && (
          <p
            className='text-destructive mt-2 text-xs'
            role='alert'
          >
            {error || errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <Controller
      name={name}
      control={formContext.control}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <div className={cn('w-full', igrpGridSizeClasses[gridSize], className)}>
          {renderNumberInput(
            parseFloat(field.value) || defaultValue,
            (newValue) => {
              field.onChange(newValue);
              onChange?.(newValue);
            },
            !!fieldState.error,
          )}

          {helperOrDescription && !error && !fieldState.error && !validationError && (
            <p
              className='text-muted-foreground mt-2 text-xs'
              role='region'
              aria-live='polite'
            >
              {helperOrDescription}
            </p>
          )}

          {(error || fieldState.error || validationError) && (
            <p
              className='text-destructive mt-2 text-xs'
              role='alert'
            >
              {error || fieldState.error?.message || errorMessage}
            </p>
          )}
        </div>
      )}
    />
  );
}

export { IGRPInputNumber, type IGRPInputNumberProps };

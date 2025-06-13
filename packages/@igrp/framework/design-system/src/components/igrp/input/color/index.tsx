'use client';

import { useId, useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { Input } from '@/components/horizon/input';
import { IGRPLabel } from '@/components/igrp/label';
import { cn } from '@/lib/utils';
import type { IGRPInputProps, IGRPGridSize } from '@/types/globals';

interface IGRPInputColorProps extends Omit<IGRPInputProps, 'onChange' | 'value' | 'defaultValue'> {
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  showHexValue?: boolean;
  gridSize?: IGRPGridSize;
  className?: string;
}

function IGRPInputColor({
  name,
  label,
  helperText = '',
  className,
  required = false,
  error,
  defaultValue = '#000000',
  value: controlledValue,
  onChange,
  showHexValue = true,
  gridSize = 'default',
  ...props
}: IGRPInputColorProps) {
  const id = useId();
  const fieldName = name ?? id;

  const formContext = useFormContext();
  const [internalValue, setInternalValue] = useState(controlledValue || defaultValue);

  useEffect(() => {
    if (!formContext && controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue, formContext]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!formContext) {
      setInternalValue(newValue);
      onChange?.(newValue);
    }
  };

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  if (!formContext) {
    return (
      <div className={cn('*:not-first:mt-2')}>
        {label && (
          <IGRPLabel
            label={label}
            className={className}
            required={required}
            id={fieldName}
          />
        )}

        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'relative rounded-md overflow-hidden border border-input shadow-sm w-9 h-9',
              error && 'border-destructive',
              props.disabled && 'opacity-50',
            )}
          >
            <Input
              id={fieldName}
              name={fieldName}
              type='color'
              required={required}
              aria-required={required}
              aria-invalid={!!error || !!props['aria-invalid']}
              aria-describedby={helperText || error ? `${id}-helper` : undefined}
              className={cn('absolute inset-0 w-full h-full cursor-pointer opacity-0', className)}
              value={currentValue}
              onChange={handleChange}
              {...props}
            />
            <div
              className='absolute inset-0 pointer-events-none'
              style={{ backgroundColor: currentValue }}
            />
          </div>

          {showHexValue && (
            <div
              className={cn(
                'h-9 px-3 py-2 rounded-md border border-input bg-background text-sm',
                props.disabled && 'opacity-50',
              )}
            >
              {currentValue.toUpperCase()}
            </div>
          )}
        </div>

        {helperText && !error && (
          <p
            id={`${fieldName}-helper`}
            className='text-muted-foreground mt-2 text-xs'
            role='region'
            aria-live='polite'
          >
            {helperText}
          </p>
        )}

        {error && (
          <p
            id={`${fieldName}-error`}
            className='text-destructive mt-2 text-xs'
            role='alert'
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const handleControlledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          field.onChange(newValue);
          onChange?.(newValue);
        };

        return (
          <div className={cn('*:not-first:mt-2', gridSize)}>
            {label && (
              <IGRPLabel
                label={label}
                className={className}
                required={required}
                id={fieldName}
              />
            )}

            <div className='flex items-center gap-3'>
              <div
                className={cn(
                  'relative rounded-md overflow-hidden border border-input shadow-sm w-9 h-9',
                  (fieldState.error || error) && 'border-destructive',
                  props.disabled && 'opacity-50',
                )}
              >
                <Input
                  id={fieldName}
                  name={fieldName}
                  type='color'
                  required={required}
                  aria-required={required}
                  aria-invalid={!!fieldState.error || !!error || !!props['aria-invalid']}
                  aria-describedby={
                    helperText || error || fieldState.error ? `${id}-helper` : undefined
                  }
                  className={cn(
                    'absolute inset-0 w-full h-full cursor-pointer opacity-0',
                    className,
                  )}
                  value={field.value || defaultValue}
                  onChange={handleControlledChange}
                  onBlur={field.onBlur}
                  disabled={props.disabled}
                  {...props}
                />
                <div
                  className='absolute inset-0 pointer-events-none'
                  style={{ backgroundColor: field.value || defaultValue }}
                />
              </div>

              {showHexValue && (
                <div
                  className={cn(
                    'h-9 px-3 py-2 rounded-md border border-input bg-background text-sm',
                    props.disabled && 'opacity-50',
                  )}
                >
                  {(field.value || defaultValue).toUpperCase()}
                </div>
              )}
            </div>

            {helperText && !error && !fieldState.error && (
              <p
                id={`${fieldName}-helper`}
                className='text-muted-foreground mt-2 text-xs'
                role='region'
                aria-live='polite'
              >
                {helperText}
              </p>
            )}

            {(error || fieldState.error) && (
              <p
                id={`${fieldName}-error`}
                className='text-destructive mt-2 text-xs'
                role='alert'
              >
                {error || fieldState.error?.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export { IGRPInputColor, type IGRPInputColorProps };

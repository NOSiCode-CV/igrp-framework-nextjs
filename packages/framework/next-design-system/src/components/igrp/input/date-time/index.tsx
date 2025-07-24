'use client';

import { useId, useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/horizon/input';
import { IGRPLabel } from '@/components/igrp/label';
import { cn } from '@/lib/utils';
import type { IGRPInputProps, IGRPGridSize } from '@/types/globals';
import { igrpGridSizeClasses } from '@/lib/constants';

interface IGRPDateTimeInputProps
  extends Omit<IGRPInputProps, 'onChange' | 'defaultValue' | 'value'> {
  value?: string;
  defaultValue?: string;
  gridSize?: IGRPGridSize;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

function IGRPDateTimeInput({
  name,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  value: controlledValue,
  defaultValue = '',
  placeholder = 'dd/mm/yyyy, --:--',
  gridSize = 'default',
  className,
  inputClassName,
  onChange,
  onBlur,
  ...props
}: IGRPDateTimeInputProps) {
  const id = useId();
  const fieldName = name ?? id;

  const formContext = useFormContext();
  const [inputValue, setInputValue] = useState(controlledValue || defaultValue);

  useEffect(() => {
    if (!formContext && controlledValue !== undefined) {
      setInputValue(controlledValue);
    }
  }, [controlledValue, formContext]);

  const formatDateTimeInput = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length <= 2) {
      return digitsOnly;
    } else if (digitsOnly.length <= 4) {
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    } else if (digitsOnly.length <= 6) {
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
    } else if (digitsOnly.length <= 8) {
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    } else if (digitsOnly.length <= 10) {
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}, ${digitsOnly.slice(8, 10)}`;
    } else {
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}, ${digitsOnly.slice(8, 10)}:${digitsOnly.slice(10, 12)}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    if (rawValue.length >= inputValue.length) {
      const formatted = formatDateTimeInput(rawValue);
      setInputValue(formatted);

      if (!formContext) {
        onChange?.(formatted);
      }
    } else {
      setInputValue(rawValue);

      if (!formContext) {
        onChange?.(rawValue);
      }
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatDateTimeInput(e.target.value);
    setInputValue(formatted);

    if (!formContext) {
      onChange?.(formatted);
      onBlur?.(e);
    }
  };

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

        <Input
          id={fieldName}
          name={fieldName}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-invalid={!!error || !!props['aria-invalid']}
          aria-describedby={helperText || error ? `${fieldName}-helper` : undefined}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive/20',
            inputClassName,
          )}
          {...props}
        />

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
            id={`${fieldName}-helper`}
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
        const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const rawValue = e.target.value;

          if (rawValue.length >= field.value?.length) {
            const formatted = formatDateTimeInput(rawValue);
            field.onChange(formatted);
            onChange?.(formatted);
          } else {
            field.onChange(rawValue);
            onChange?.(rawValue);
          }
        };

        const handleFormInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          const formatted = formatDateTimeInput(e.target.value);
          field.onChange(formatted);
          onChange?.(formatted);
          field.onBlur();
          onBlur?.(e);
        };

        return (
          <div className={cn('*:not-first:mt-2', igrpGridSizeClasses[gridSize])}>
            {label && (
              <IGRPLabel
                label={label}
                className={className}
                required={required}
                id={fieldName}
              />
            )}

            <Input
              id={fieldName}
              value={field.value || ''}
              onChange={handleFormInputChange}
              onBlur={handleFormInputBlur}
              disabled={disabled}
              placeholder={placeholder}
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error || !!props['aria-invalid']}
              aria-describedby={
                helperText || error || fieldState.error ? `${fieldName}-helper` : undefined
              }
              className={cn(
                (fieldState.error || error) &&
                  'border-destructive focus-visible:ring-destructive/20',
                inputClassName,
              )}
              {...props}
            />

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

export { IGRPDateTimeInput, type IGRPDateTimeInputProps };

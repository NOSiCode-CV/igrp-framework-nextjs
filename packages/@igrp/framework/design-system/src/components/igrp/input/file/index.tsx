'use client';

import { useId, useRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/horizon/input';
import { IGRPLabel } from '@/components/igrp/label';
import { cn } from '@/lib/utils';
import type { IGRPInputProps, IGRPGridSize } from '@/types/globals';

interface IGRPInputFileProps extends IGRPInputProps {
  name: string;
  gridSize?: IGRPGridSize;
  accept?: string;
  multiple?: boolean;
}

function IGRPInputFile({
  name,
  label,
  className,
  required = false,
  disabled = false,
  accept,
  multiple = false,
  placeholder,
  onChange,
  gridSize = 'default',
  error,
  helperText,
  ...props
}: IGRPInputFileProps) {
  const id = useId();
  const fieldName = name ?? id;
  const inputRef = useRef<HTMLInputElement>(null);
  const formContext = useFormContext();

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
          ref={inputRef}
          id={fieldName}
          name={fieldName}
          className={cn(
            'p-0 pe-3 file:me-3 file:border-0 file:border-e file:border-gray-100 file:py-2 file:px-4 file:transition-colors cursor-pointer',
            error && 'border-destructive focus-visible:ring-destructive/20',
            className,
          )}
          type='file'
          disabled={disabled}
          accept={accept}
          multiple={multiple}
          placeholder={placeholder}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={helperText || error ? `${id}-helper` : undefined}
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

  const fieldError = formContext.formState.errors[name];
  const errorMessage = error || (fieldError?.message as string);

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      render={({ field, fieldState }) => {
        const safeFieldProps = {
          name: field.name,
          onBlur: field.onBlur,
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
            <Input
              ref={inputRef}
              id={fieldName}
              className={cn(
                'p-0 pe-3 file:me-3 file:border-0 file:border-e file:border-gray-100 file:py-2 file:px-4 file:transition-colors cursor-pointer',
                (fieldState.error || error) &&
                  'border-destructive focus-visible:ring-destructive/20',
                className,
              )}
              type='file'
              disabled={disabled}
              accept={accept}
              multiple={multiple}
              placeholder={placeholder}
              onChange={(e) => {
                const files = e.target.files;
                const fileValue = multiple ? files : files?.[0] || null;

                field.onChange(fileValue);

                if (onChange) {
                  onChange(e);
                }
              }}
              aria-invalid={!!fieldState.error || !!error}
              aria-describedby={helperText || errorMessage ? `${id}-helper` : undefined}
              {...safeFieldProps}
              {...props}
              name={fieldName}
            />

            {helperText && !errorMessage && !fieldState.error && (
              <p
                id={`${fieldName}-helper`}
                className='text-muted-foreground mt-2 text-xs'
                role='region'
                aria-live='polite'
              >
                {helperText}
              </p>
            )}

            {(errorMessage || fieldState.error) && (
              <p
                id={`${fieldName}-error`}
                className='text-destructive mt-2 text-xs'
                role='alert'
              >
                {errorMessage || fieldState.error?.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export { IGRPInputFile, type IGRPInputFileProps };

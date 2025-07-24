'use client';

import { useId } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Textarea } from '@/components/primitives/textarea';
import { IGRPLabel } from '@/components/igrp/label';
import { cn } from '@/lib/utils';
import type { IGRPInputProps, IGRPGridSize } from '@/types/globals';
import { igrpGridSizeClasses } from '@/lib/constants';

interface IGRPTextareaProps
  extends React.ComponentProps<'textarea'>,
    Pick<IGRPInputProps, 'label' | 'helperText' | 'className' | 'required' | 'error'> {
  name: string;
  gridSize?: IGRPGridSize;
  rows?: number;
}

function IGRPTextarea({
  name,
  label,
  helperText,
  className,
  required = false,
  error,
  rows = 3,
  gridSize = 'default',
  ...props
}: IGRPTextareaProps) {
  const id = useId();
  const fieldName = name ?? id;

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

        <div className='relative'>
          <Textarea
            id={fieldName}
            name={fieldName}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={helperText || error ? `${fieldName}-helper` : undefined}
            className={cn(
              'peer bg-background py-3 text-sm outline-hidden',
              error && 'border-destructive focus-visible:ring-destructive/20',
              className,
            )}
            rows={rows}
            {...props}
          />
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

  const fieldError = formContext.formState.errors[name];
  const errorMessage = error || (fieldError?.message as string);

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      render={({ field, fieldState }) => (
        <div className={cn('*:not-first:mt-2', igrpGridSizeClasses[gridSize])}>
          {label && (
            <IGRPLabel
              label={label}
              className={className}
              required={required}
              id={fieldName}
            />
          )}

          <div className='relative'>
            <Textarea
              id={fieldName}
              name={fieldName}
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error}
              aria-describedby={helperText || errorMessage ? `${id}-helper` : undefined}
              className={cn(
                'peer bg-background py-3 text-sm outline-hidden',
                (fieldState.error || error) &&
                  'border-destructive focus-visible:ring-destructive/20',
                className,
              )}
              rows={rows}
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              {...props}
            />
          </div>

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
      )}
    />
  );
}

export { IGRPTextarea, type IGRPTextareaProps };

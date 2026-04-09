'use client';

import { useId } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { cn } from '../../../lib/utils';
import type { IGRPInputProps } from '../../../types';
import { Textarea } from '../../primitives/textarea';
import { IGRPLabel } from '../label';

/**
 * Props for the IGRPTextarea component.
 * @see IGRPTextarea
 */
interface IGRPTextareaProps
  extends
    React.ComponentProps<typeof Textarea>,
    Pick<
      IGRPInputProps,
      'label' | 'helperText' | 'className' | 'required' | 'error'> {}

/**
 * Textarea with label, helper text, and form integration.
 */
function IGRPTextarea({
  name,
  id,
  label,
  helperText,
  className,
  required = false,
  error,
  rows = 3,
  ...props
}: IGRPTextareaProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const formContext = useFormContext();

  if (!formContext) {
    return (
      <div className={cn('*:not-first:mt-2')}>
        {label && (
          <IGRPLabel label={label} className={className} required={required} id={fieldName} />
        )}

        <div className={cn('relative')}>
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
            className={cn('text-muted-foreground mt-2 text-xs')}
            role="region"
            aria-live="polite"
          >
            {helperText}
          </p>
        )}

        {error && (
          <p id={`${fieldName}-error`} className={cn('text-destructive mt-2 text-xs')} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  const fieldError = formContext.formState.errors[fieldName];
  const errorMessage = error || (fieldError?.message as string);

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      render={({ field, fieldState }) => (
        <div className={cn('*:not-first:mt-2')}>
          {label && (
            <IGRPLabel label={label} className={className} required={required} id={fieldName} />
          )}

          <div className={cn('relative')}>
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
              className={cn('text-muted-foreground mt-2 text-xs')}
              role="region"
              aria-live="polite"
            >
              {helperText}
            </p>
          )}

          {(errorMessage || fieldState.error) && (
            <p
              id={`${fieldName}-error`}
              className={cn('text-destructive mt-2 text-xs')}
              role="alert"
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

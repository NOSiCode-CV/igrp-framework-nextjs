'use client';

import { useId } from 'react';
import { useFormContext } from 'react-hook-form';

import { cn } from '../../../lib/utils';
import type { IGRPInputProps } from '../../../types';
import { Input } from '../../primitives/input';
import { IGRPFormField } from '../form/form-field';
import { IGRPIcon } from '../icon';
import { IGRPLabel } from '../label';

interface IGRPInputTextProps extends IGRPInputProps {
  type?: 'text' | 'email' | 'number';
  error?: string;
}

function IGRPInputText({
  name,
  id,
  type = 'text',
  label,
  helperText,
  showIcon = false,
  iconName = 'House',
  iconSize = 16,
  iconPlacement = 'start',
  iconClassName,
  className,
  labelClassName,
  required,
  inputClassName,
  error,
  ...props
}: IGRPInputTextProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const formContext = useFormContext();

  const positionIcon = iconPlacement === 'start' ? 'start-0 ps-3' : 'end-0 pe-3';
  const positionParentIcon = iconPlacement === 'start' ? 'ps-9' : 'pe-9';

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        required={required}
        control={formContext.control}
      >
        {(field, fieldState) => (
          <div className="relative">
            <Input
              id={fieldName}
              name={fieldName}
              type={type}
              required={required}
              aria-required={required}
              aria-describedby={helperText || error ? `${fieldName}-helper` : undefined}
              className={cn(
                'peer bg-background py-3 text-sm outline-hidden',
                showIcon && positionParentIcon,
                (fieldState.error || error) &&
                  'border-destructive focus-visible:ring-destructive/20',
                inputClassName,
              )}
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              {...props}
            />
            {showIcon && (
              <div className={cn('absolute inset-y-0 flex items-center', positionIcon)}>
                <IGRPIcon iconName={iconName} size={iconSize} className={iconClassName} />
              </div>
            )}
          </div>
        )}
      </IGRPFormField>
    );
  }

  return (
    <div className={cn('*:not-first:mt-2', className)}>
      {label && (
        <IGRPLabel 
          label={label} 
          className={labelClassName} 
          required={required} 
          id={fieldName} 
        />
      )}

      <div className={cn('relative')}>
        <Input
          id={fieldName}
          name={fieldName}
          type={type}
          required={required}
          aria-required={required}
          aria-invalid={!!error || !!props['aria-invalid']}
          aria-describedby={helperText || error ? `${fieldName}-helper` : undefined}
          className={cn(
            'peer bg-background py-3 text-sm outline-hidden',
            showIcon && positionParentIcon,
            error && 'border-destructive focus-visible:ring-destructive/20',
            inputClassName,
          )}
          {...props}
        />
        {showIcon && (
          <div className={cn('absolute inset-y-0 flex items-center', positionIcon)}>
            <IGRPIcon iconName={iconName} size={iconSize} className={iconClassName} />
          </div>
        )}
      </div>

      {helperText && !error && (
        <p
          id={`${fieldName}-helper`}
          className="text-muted-foreground mt-2 text-xs"
          role="region"
          aria-live="polite"
        >
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${fieldName}-error`} className="text-destructive mt-2 text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { IGRPInputText, type IGRPInputTextProps };

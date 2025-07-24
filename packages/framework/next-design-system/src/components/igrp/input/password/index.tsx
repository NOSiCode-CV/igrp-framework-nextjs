'use client';

import { useId, useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { Input } from '@/components/horizon/input';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPLabel } from '@/components/igrp/label';
import type { IGRPInputProps, IGRPGridSize } from '@/types/globals';
import { cn } from '@/lib/utils';
import { igrpGridSizeClasses } from '@/lib/constants';

interface IGRPInputPasswordProps extends Omit<IGRPInputProps, 'onChange'> {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  showPasswordToggle?: boolean;
  IGRPGridSize?: IGRPGridSize;
}

function IGRPInputPassword({
  name,
  label,
  helperText,
  className,
  required = false,
  error,
  value,
  defaultValue,
  onChange,
  showPasswordToggle = true,
  gridSize = 'default',
  ...props
}: IGRPInputPasswordProps) {
  const id = useId();
  const fieldName = name || id;
  const [showPassword, setShowPassword] = useState(false);
  const formContext = useFormContext();
  const [localValue, setLocalValue] = useState(value !== undefined ? value : defaultValue || '');

  useEffect(() => {
    if (value !== undefined && !formContext) {
      setLocalValue(value);
    }
  }, [value, formContext]);

  const handleStandaloneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

        <div className='relative'>
          <Input
            id={fieldName}
            name={fieldName}
            type={showPassword ? 'text' : 'password'}
            required={required}
            aria-required={required}
            aria-invalid={!!error || !!props['aria-invalid']}
            aria-describedby={helperText || error ? `${id}-helper` : undefined}
            className={cn(
              'peer bg-background py-3 text-sm outline-hidden',
              showPasswordToggle && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive/20',
              className,
            )}
            value={value !== undefined ? value : localValue}
            defaultValue={defaultValue}
            onChange={handleStandaloneChange}
            {...props}
          />

          {showPasswordToggle && (
            <IGRPButton
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground'
              onClick={togglePasswordVisibility}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              showIcon
              iconName={showPassword ? 'EyeOff' : 'Eye'}
              name='toggle-password-visibility'
            />
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
            id={`${fieldName}-errror`}
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
      defaultValue={defaultValue || ''}
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
            <Input
              id={fieldName}
              type={showPassword ? 'text' : 'password'}
              required={required}
              aria-required={required}
              aria-invalid={!!fieldState.error || !!error || !!props['aria-invalid']}
              aria-describedby={
                helperText || error || fieldState.error ? `${id}-helper` : undefined
              }
              className={cn(
                'peer bg-background py-3 text-sm outline-hidden',
                showPasswordToggle && 'pr-10',
                (fieldState.error || error) &&
                  'border-destructive focus-visible:ring-destructive/20',
                className,
              )}
              value={field.value}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e.target.value);
              }}
              onBlur={field.onBlur}
              {...props}
            />

            {showPasswordToggle && (
              <IGRPButton
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground'
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                showIcon
                iconName={showPassword ? 'EyeOff' : 'Eye'}
              />
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
              id={`${fieldName}-helper`}
              className='text-destructive mt-2 text-xs'
              role='alert'
            >
              {error || fieldState.error?.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

export { IGRPInputPassword, type IGRPInputPasswordProps };

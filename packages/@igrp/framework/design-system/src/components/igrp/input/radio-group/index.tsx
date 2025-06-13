'use client';

import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { type VariantProps } from 'class-variance-authority';
import { RadioGroup, RadioGroupItem, radioItemVariants } from '@/components/horizon/radio-group';
import { IGRPFormField } from '@/components/igrp/form';
import { IGRPLabel } from '@/components/igrp/label';
import { igrpGridSizeClasses } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { IGRPBaseAttributes, IGRPGridSize } from '@/types/globals';

type IGRPRadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

interface IGRPRadioGroupProps
  extends Omit<IGRPBaseAttributes, 'ref' | 'name'>,
    VariantProps<typeof radioItemVariants>,
    React.ComponentProps<typeof RadioGroup> {
  options: IGRPRadioOption[];
  gridSize?: IGRPGridSize;
  error?: string;
}

function IGRPRadioGroup({
  name,
  required = false,
  disabled = false,
  dir,
  orientation,
  defaultValue,
  value,
  onValueChange,
  className,
  options,
  variant,
  size = 'md',
  gridSize = 'default',
  label,
  labelClassName,
  helperText,
  error,
  ...props
}: IGRPRadioGroupProps) {
  const id = useId();
  const fieldName = name ?? id;
  const formContext = useFormContext();

  const describedById = error
    ? `${fieldName}-error`
    : helperText
      ? `${fieldName}-helper`
      : undefined;

  const renderRadioOptions = (
    currentValue?: string | null,
    onValueChange?: (value: string) => void,
  ) => (
    <RadioGroup
      defaultValue={defaultValue}
      value={currentValue}
      onValueChange={onValueChange}
      name={fieldName}
      className={cn('flex flex-row', orientation === 'vertical' && 'flex-col', className)}
      disabled={disabled}
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={describedById}
      {...props}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className={cn(
            'flex gap-2 items-center',
            dir === 'rtl' && 'flex-row-reverse justify-between',
            option.disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <RadioGroupItem
            value={option.value}
            id={`${fieldName}-${option.value}`}
            disabled={option.disabled || disabled}
            className='mt-0.5'
            size={size}
            variant={variant}
          />
          {(option.label || option.description) && (
            <div>
              {option.label && (
                <IGRPLabel
                  htmlFor={`${fieldName}-${option.value}`}
                  label={option.label}
                  className={cn(
                    'text-sm font-medium leading-none',
                    option.disabled && 'cursor-not-allowed opacity-70',
                  )}
                />
              )}
              {option.description && (
                <p className={cn('text-muted-foreground mt-1 text-sm', size === 'sm' && 'text-xs')}>
                  {option.description}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </RadioGroup>
  );

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        size={igrpGridSizeClasses[gridSize]}
        required={required}
        control={formContext.control}
      >
        {(field) => (
          <div className='relative'>
            {renderRadioOptions(field.value, (newValue) => {
              field.onChange(newValue);
              onValueChange?.(newValue);
            })}
          </div>
        )}
      </IGRPFormField>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <IGRPLabel
          label={label}
          required={required}
          id={fieldName}
          className={labelClassName}
        />
      )}

      {renderRadioOptions(value, onValueChange ?? (() => {}))}

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

export { IGRPRadioGroup, type IGRPRadioGroupProps };

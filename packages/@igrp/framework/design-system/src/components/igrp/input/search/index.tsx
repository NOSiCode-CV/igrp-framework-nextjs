'use client';

import { useId, useState, useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/horizon/input';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPFieldDescription } from '@/components/igrp/field-description';
import { IGRPFormField } from '@/components/igrp/form/form-field';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { IGRPLabel } from '@/components/igrp/label';
import { igrpGridSizeClasses } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { type IGRPInputProps } from '@/types/globals';
import type { VariantProps } from 'class-variance-authority';

interface IGRPInputSearchProps extends Omit<IGRPInputProps, 'value' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onSearch?: (value: string) => void;
  setValueChange?: (value: string) => void;
  showStartIcon?: boolean;
  startIcon?: IGRPIconName | string;
  showSubmitButton?: boolean;
  submitIcon?: IGRPIconName | string;
  submitButtonLabel?: string;
  submitButtonClassName?: string;
  isDebounce?: boolean;
  debounceMs?: number;
  submitVariant?: VariantProps<typeof IGRPButton>['variant'];
  loading?: boolean;
}

const isDebouncedCallback = (callback?: (val: string) => void, delay = 2000) => {
  if (!callback) return null;

  let timeout: ReturnType<typeof setTimeout>;
  return (value: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(value), delay);
  };
};

function IGRPInputSearch({
  name,
  label,
  helperText,
  className,
  required = false,
  error,
  value: controlledValue,
  defaultValue = '',
  onSearch,
  setValueChange,
  showStartIcon = true,
  startIcon = 'Search',
  showSubmitButton = true,
  submitIcon = 'ArrowRight',
  submitButtonLabel,
  submitButtonClassName,
  gridSize = 'default',
  debounceMs = 2000,
  isDebounce = false,
  showIcon = true,
  iconSize = 14,
  iconPlacement,
  submitVariant = 'ghost',
  loading,
  ...props
}: IGRPInputSearchProps) {
  const id = useId();
  const fieldName = name ?? id;
  const formContext = useFormContext();
  const [localValue, setLocalValue] = useState(controlledValue ?? defaultValue);
  const debouncedSearch = isDebouncedCallback(onSearch, debounceMs);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleInputChange = useCallback(
    (value: string) => {
      setLocalValue(value);
      setValueChange?.(value);
      if (isDebounce) debouncedSearch?.(value);
    },
    [debouncedSearch, isDebounce, setValueChange],
  );

  const renderInput = (
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void,
  ) => (
    <div className='relative py-2'>
      <Input
        id={fieldName}
        name={fieldName}
        type='search'
        required={required}
        aria-required={required}
        aria-invalid={!!error || !!props['aria-invalid']}
        aria-describedby={helperText || error ? `${id}-helper` : undefined}
        className={cn(
          'peer py-3 text-sm outline-hidden flex w-full items-center',
          showStartIcon && 'ps-6.5',
          showSubmitButton && 'pe-9',
          error && 'border-destructive focus-visible:ring-destructive/20',
          className,
        )}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        {...props}
      />

      {showStartIcon && (
        <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-1.5 peer-disabled:opacity-50'>
          <IGRPIcon
            iconName={startIcon}
            aria-hidden='true'
            size={14}
          />
        </div>
      )}

      {showSubmitButton && (
        <IGRPButton
          className={cn(
            'absolute top-1/2 -translate-y-1/2 end-0 flex items-center justify-center rounded-md transition-[color,box-shadow] outline-none z-10 focus-visible:ring-[3px] gap-0',
            submitButtonClassName,
          )}
          aria-label={submitButtonLabel}
          type='button'
          onClick={() => onSearch?.(value)}
          disabled={props.disabled}
          showIcon={showIcon}
          iconName={submitIcon}
          iconSize={iconSize}
          variant={submitVariant}
          loading={loading}
          iconPlacement={iconPlacement}
        >
          {submitButtonLabel}
        </IGRPButton>
      )}
    </div>
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
        {(field) =>
          renderInput(
            field.value ?? '',
            (e) => {
              field.onChange(e.target.value);
              handleInputChange(e.target.value);
            },
            (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearch?.(field.value);
              }
            },
          )
        }
      </IGRPFormField>
    );
  }

  return (
    <div className={cn('*:not-first:mt-2', className)}>
      {label && (
        <IGRPLabel
          label={label}
          required={required}
          id={fieldName}
        />
      )}

      {renderInput(
        localValue,
        (e) => handleInputChange(e.target.value),
        (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSearch?.(localValue);
          }
        },
      )}

      <IGRPFieldDescription
        error={error}
        helperText={helperText}
      />
    </div>
  );
}

export { IGRPInputSearch, type IGRPInputSearchProps };

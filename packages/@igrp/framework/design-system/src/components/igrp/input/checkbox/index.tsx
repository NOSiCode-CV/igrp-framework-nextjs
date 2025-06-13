'use client';

import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/horizon/checkbox';
import { IGRPFormField } from '@/components/igrp/form/form-field';
import { IGRPLabel } from '@/components/igrp/label';
import { cn } from '@/lib/utils';
import { igrpGridSizeClasses } from '@/lib/constants';
import type { IGRPBaseAttributes, IGRPGridSize } from '@/types/globals';

interface IGRPCheckboxProps
  extends React.ComponentProps<typeof Checkbox>,
    Pick<IGRPBaseAttributes, 'helperText' | 'label'> {
  name: string;
  labelClassName?: string;
  gridSize?: IGRPGridSize;
  error?: string;
}

function IGRPCheckbox({
  name,
  label,
  helperText,
  className,
  labelClassName,
  required,
  error,
  gridSize = 'default',
  onCheckedChange,
  ...props
}: IGRPCheckboxProps) {
  const id = useId();
  const fieldName = name || id;

  const formContext = useFormContext();

  if (!formContext) {
    return (
      <div className={cn('*:not-first:mt-2')}>
        <div className='flex items-center gap-2'>
          <Checkbox
            id={fieldName}
            name={fieldName}
            className={cn(
              className,
              error && 'border-destructive focus-visible:ring-destructive/20',
            )}
            onCheckedChange={onCheckedChange}
            aria-invalid={!!error}
            aria-describedby={helperText || error ? `${fieldName}-helper` : undefined}
            {...props}
          />

          {label && (
            <IGRPLabel
              label={label}
              className={cn(labelClassName, error && 'text-destructive')}
              required={required}
              id={fieldName}
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
    <IGRPFormField
      name={fieldName}
      label={label}
      helperText={helperText}
      size={igrpGridSizeClasses[gridSize]}
      required={required}
      control={formContext.control}
      labelPlacement='end'
      isToggle
    >
      {(field, fieldState) => (
        <Checkbox
          required={required}
          className={cn(
            'bg-backsground',
            (fieldState.error || error) && 'border-destructive focus-visible:ring-destructive/20',
            className,
          )}
          checked={field.value === true}
          onCheckedChange={(checked) => {
            field.onChange(checked);
            if (onCheckedChange) {
              onCheckedChange(checked);
            }
          }}
          onBlur={field.onBlur}
          aria-invalid={!!fieldState.error || !!error}
          aria-describedby={helperText || error ? `${id}-helper` : undefined}
          {...props}
        />
      )}
    </IGRPFormField>
  );
}

export { IGRPCheckbox, type IGRPCheckboxProps };

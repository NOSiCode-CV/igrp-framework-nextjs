import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { Switch } from '@/components/primitives/switch';
import { IGRPFormField } from '@/components/igrp/form/form-field';
import { IGRPLabel } from '@/components/igrp/label';
import { igrpGridSizeClasses } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { IGRPBaseAttributes, IGRPGridSize } from '@/types/globals';

interface IGRPSwitchProps
  extends Omit<React.ComponentProps<typeof Switch>, 'name'>,
    Pick<IGRPBaseAttributes, 'helperText' | 'label'> {
  name: string;
  labelClassName?: string;
  gridSize?: IGRPGridSize;
  error?: string;
}

function IGRPSwitch({
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
}: IGRPSwitchProps) {
  const id = useId();
  const fielName = name ?? id;

  const formContext = useFormContext();

  if (!formContext) {
    return (
      <div className={cn('*:not-first:mt-2')}>
        <div className='flex items-center gap-2'>
          <Switch
            id={fielName}
            name={fielName}
            className={cn(
              className,
              error && 'border-destructive focus-visible:ring-destructive/20',
            )}
            onCheckedChange={onCheckedChange}
            aria-invalid={!!error}
            aria-describedby={helperText || error ? `${fielName}-helper` : undefined}
            {...props}
          />

          {label && (
            <IGRPLabel
              label={label}
              className={cn(labelClassName, error && 'text-destructive')}
              required={required}
              id={fielName}
            />
          )}
        </div>

        {helperText && !error && (
          <p
            id={`${fielName}-helper`}
            className='text-muted-foreground mt-2 text-xs'
            role='region'
            aria-live='polite'
          >
            {helperText}
          </p>
        )}

        {error && (
          <p
            id={`${fielName}-error`}
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
      name={fielName}
      label={label}
      helperText={helperText}
      size={igrpGridSizeClasses[gridSize]}
      required={required}
      control={formContext.control}
      labelPlacement='end'
      isToggle
    >
      {(field, fieldState) => (
        <div className='*:not-first:mt-2'>
          <div className='flex items-center gap-2'>
            <Switch
              id={fielName}
              name={fielName}
              required={required}
              className={cn(
                'bg-backsground',
                (fieldState.error || error) &&
                  'border-destructive focus-visible:ring-destructive/20',
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
          </div>
        </div>
      )}
    </IGRPFormField>
  );
}

export { IGRPSwitch, type IGRPSwitchProps };

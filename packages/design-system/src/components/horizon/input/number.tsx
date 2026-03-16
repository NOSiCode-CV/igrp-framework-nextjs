'use client';

import { useState, useEffect, useId, useRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { cn } from '../../../lib/utils';
import type { IGRPInputProps } from '../../../types';
import { Input } from '../../primitives/input';
import { IGRPButton } from '../button';
import { IGRPLabel } from '../label';

/**
 * Props for the IGRPInputNumber component.
 * @see IGRPInputNumber
 */
interface IGRPInputNumberProps extends Omit<IGRPInputProps, 'onChange'> {
  /** Field label. */
  label?: string;
  /** Helper text below the input. */
  helperText?: string;
  /** Description text. */
  description?: string;
  /** Default numeric value. */
  defaultValue?: number;
  /** Controlled numeric value. */
  value?: number;
  /** Intl.NumberFormat options for display. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Step for increment/decrement. */
  step?: number;
  /** Called when value changes. */
  onChange?: (value: number) => void;
  /** Validation error message. */
  error?: string;
  /** Message shown when validation fails. */
  errorMessage?: string;
}

type NumberValue = number | '';

/** @internal Props for form-connected number input. */
type FormNumberInputProps = {
  field: { value: unknown; onChange: (v: unknown) => void };
  fieldState: { error?: { message?: string } };
  controlledValue: number | undefined;
  prevControlledValueRef: React.MutableRefObject<number | undefined>;
  renderNumberInput: (
    value: NumberValue,
    onValueChange?: (newValue: NumberValue) => void,
    fieldError?: boolean,
  ) => React.ReactNode;
  helperOrDescription: string | undefined;
  error: string | undefined;
  errorMessage: string;
  validationError: boolean;
  setValidationError: (v: boolean) => void;
  onValueChange?: (value: number) => void;
  className?: string;
};

/** @internal Syncs controlledValue prop with form field and renders the input. */
function FormNumberInput({
  field,
  fieldState,
  controlledValue,
  prevControlledValueRef,
  renderNumberInput,
  helperOrDescription,
  error,
  errorMessage,
  validationError,
  setValidationError,
  onValueChange,
  className,
}: FormNumberInputProps) {
  useEffect(() => {
    const controlledValueChanged = prevControlledValueRef.current !== controlledValue;
    if (controlledValueChanged) {
      prevControlledValueRef.current = controlledValue;
    }
    if (controlledValueChanged && field.value !== controlledValue) {
      field.onChange(controlledValue === undefined ? undefined : controlledValue);
    }
  }, [field.value, controlledValue, field, prevControlledValueRef]);

  const displayValue = (() => {
    if (controlledValue !== undefined) return controlledValue;
    const raw = field.value;
    if (raw === '' || raw === undefined || raw === null) return '';
    const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : '';
  })() as NumberValue;

  return (
    <div className={cn('w-full', className)}>
      {renderNumberInput(
        displayValue,
        (newValue) => {
          if (newValue === '') {
            field.onChange(undefined);
            setValidationError(false);
            return;
          }
          field.onChange(newValue);
          onValueChange?.(newValue);
        },
        !!fieldState.error,
      )}
      {helperOrDescription && !error && !fieldState.error && !validationError && (
        <p className={cn('text-muted-foreground mt-2 text-xs')} role="region" aria-live="polite">
          {helperOrDescription}
        </p>
      )}
      {(error || fieldState.error || validationError) && (
        <p className={cn('text-destructive mt-2 text-xs')} role="alert">
          {error || fieldState.error?.message || errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Numeric input with stepper, formatting, and min/max. Integrates with react-hook-form.
 */
function IGRPInputNumber({
  name,
  id,
  label,
  helperText,
  description,
  className,
  defaultValue,
  value: controlledValue,
  formatOptions,
  min,
  max,
  disabled = false,
  readOnly = false,
  step = 1,
  onChange,
  error,
  errorMessage = 'Please enter a valid number',
  required,
  ...props
}: IGRPInputNumberProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const [localValue, setLocalValue] = useState<NumberValue>(controlledValue ?? defaultValue ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const formContext = useFormContext();
  const prevControlledValueRef = useRef<number | undefined>(controlledValue);

  const formatter = new Intl.NumberFormat(undefined, formatOptions);

  const displayValue = !formContext && controlledValue !== undefined ? controlledValue : localValue;

  const constrainValue = (newValue: number): number => {
    if (min !== undefined && newValue < min) {
      return min;
    }
    if (max !== undefined && newValue > max) {
      return max;
    }
    return newValue;
  };

  const updateStandaloneValue = (newValue: number) => {
    const constrainedValue = constrainValue(newValue);
    setLocalValue(constrainedValue);
    onChange?.(constrainedValue);
  };

  const increment = (currentValue: NumberValue, updateFn?: (value: NumberValue) => void) => {
    if (!disabled && !readOnly) {
      const base = typeof currentValue === 'number' ? currentValue : 0;
      const newValue = constrainValue(base + step);
      if (updateFn) {
        updateFn(newValue);
      } else {
        updateStandaloneValue(newValue);
      }
    }
  };

  const decrement = (currentValue: NumberValue, updateFn?: (value: NumberValue) => void) => {
    if (!disabled && !readOnly) {
      const base = typeof currentValue === 'number' ? currentValue : 0;
      const newValue = constrainValue(base - step);
      if (updateFn) {
        updateFn(newValue);
      } else {
        updateStandaloneValue(newValue);
      }
    }
  };

  const handleStandaloneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;

    const inputValue = e.target.value;
    if (inputValue.trim() === '') {
      setLocalValue('');
      setValidationError(false);
      return;
    }

    try {
      let numValue: number;

      if (formatOptions?.style === 'percent') {
        numValue = parseFloat(inputValue.replace(/[^\d.-]/g, ''));
        if (formatOptions.style === 'percent') {
          numValue = numValue / 100;
        }
      } else {
        numValue = parseFloat(inputValue.replace(/[^\d.-]/g, ''));
      }

      if (!isNaN(numValue)) {
        updateStandaloneValue(numValue);
        setValidationError(false);
      } else {
        setValidationError(true);
      }
    } catch {
      setValidationError(true);
    }
  };

  const getDisplayValue = (value: NumberValue) => {
    if (value === '') return '';
    if (formatOptions) {
      return formatter.format(value);
    }
    return value.toString();
  };

  const renderNumberInput = (
    value: NumberValue,
    onValueChange?: (newValue: NumberValue) => void,
    fieldError?: boolean,
  ) => {
    const displayValue = getDisplayValue(value);

    return (
      <div className={cn('*:not-first:mt-2')}>
        {label && (
          <IGRPLabel label={label} className={className} required={required} id={fieldName} />
        )}
        <div
          className={cn(
            'border-input outline-none relative inline-flex h-10 w-full items-center overflow-hidden rounded-md border text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow]',
            isFocused && 'border-ring ring-2 ring-ring/50',
            (error || validationError || fieldError) &&
              'ring-destructive/20 dark:ring-destructive/40 border-destructive',
            disabled && 'opacity-50',
          )}
        >
          <Input
            id={fieldName}
            name={fieldName}
            type="text"
            value={displayValue}
            onChange={(e) => {
              if (onValueChange) {
                try {
                  const inputValue = e.target.value;
                  if (inputValue.trim() === '') {
                    onValueChange('');
                    setValidationError(false);
                    return;
                  }
                  let numValue: number;

                  if (formatOptions?.style === 'percent') {
                    numValue = parseFloat(inputValue.replace(/[^\d.-]/g, '')) / 100;
                  } else {
                    numValue = parseFloat(inputValue.replace(/[^\d.-]/g, ''));
                  }

                  if (!isNaN(numValue)) {
                    onValueChange(constrainValue(numValue));
                    setValidationError(false);
                  } else {
                    setValidationError(true);
                  }
                } catch {
                  setValidationError(true);
                }
              } else {
                handleStandaloneInputChange(e);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                increment(value, onValueChange);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                decrement(value, onValueChange);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'bg-background text-foreground flex-1 px-3 py-2 tabular-nums outline-none border-none focus-visible:outline-none focus-visible:ring-ring/0 focus-visible:ring-0 rounded-none',
            )}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={!!(error || validationError || fieldError)}
            aria-valuenow={typeof value === 'number' ? value : undefined}
            aria-valuemin={min}
            aria-valuemax={max}
            role="spinbutton"
            {...props}
          />
          {!readOnly && (
            <div className={cn('flex h-full flex-col border-l')}>
              <IGRPButton
                type="button"
                onClick={() => increment(value, onValueChange)}
                disabled={
                  disabled || (max !== undefined && typeof value === 'number' && value >= max)
                }
                className={cn(
                  'bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground flex h-1/2 w-8 items-center justify-center border-b text-xs transition-colors rounded-none',
                )}
                aria-label="Increment"
                iconName="ChevronUp"
                size="icon"
                iconSize={10}
              />
              <IGRPButton
                type="button"
                onClick={() => decrement(value, onValueChange)}
                disabled={
                  disabled || (min !== undefined && typeof value === 'number' && value <= min)
                }
                className={cn(
                  'bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground flex h-1/2 w-8 items-center justify-center text-xs transition-colors rounded-none',
                )}
                aria-label="Decrement"
                iconName="ChevronDown"
                size="icon"
                iconSize={10}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const helperOrDescription = helperText || description;

  if (!formContext) {
    return (
      <div className={cn('w-full', className)}>
        {renderNumberInput(displayValue)}

        {helperOrDescription && !error && !validationError && (
          <p className={cn('text-muted-foreground mt-2 text-xs')} role="region" aria-live="polite">
            {helperOrDescription}
          </p>
        )}

        {(error || validationError) && (
          <p className={cn('text-destructive mt-2 text-xs')} role="alert">
            {error || errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue ?? ''}
      render={({ field, fieldState }) => (
        <FormNumberInput
          field={field}
          fieldState={fieldState}
          controlledValue={controlledValue}
          prevControlledValueRef={prevControlledValueRef}
          renderNumberInput={renderNumberInput}
          helperOrDescription={helperOrDescription}
          error={error}
          errorMessage={errorMessage}
          validationError={validationError}
          setValidationError={setValidationError}
          onValueChange={onChange}
          className={className}
        />
      )}
    />
  );
}

export { IGRPInputNumber, type IGRPInputNumberProps };

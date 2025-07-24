'use client';

import { useId, useState, useEffect } from 'react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/horizon/input';
import { IGRPIcon } from '@/components/igrp/icon';
import { IGRPLabel } from '@/components/igrp/label';
import { cn } from '@/lib/utils';
import type { IGRPInputProps, IGRPGridSize } from '@/types/globals';
import { igrpGridSizeClasses } from '@/lib/constants';

interface IGRPInputPhoneProps extends Omit<IGRPInputProps, 'onChange' | 'ref'> {
  name: string;
  description?: string;
  helperText?: string;
  defaultValue?: string;
  value?: string;
  international?: boolean;
  defaultCountry?: RPNInput.Country;
  countries?: RPNInput.Country[];
  onChange?: (value: string | undefined) => void;
  dir?: 'ltr' | 'rtl';
  gridSize?: IGRPGridSize;
}

function PhoneInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot='phone-input'
      className={cn('-ms-px rounded-s-none shadow-none focus-visible:z-10', className)}
      {...props}
    />
  );
}

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: { label: string; value: RPNInput.Country | undefined }[];
};

function CountrySelect({ disabled, value, onChange, options }: CountrySelectProps) {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as RPNInput.Country);
  };

  return (
    <div className='border-input bg-background text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 relative inline-flex items-center self-stretch rounded-s-md border py-2 ps-3 pe-2 transition-[color,box-shadow] outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50'>
      <div
        className='inline-flex items-center gap-1'
        aria-hidden='true'
      >
        <FlagComponent
          country={value}
          countryName={value}
          aria-hidden='true'
        />
        <span className='text-muted-foreground/80'>
          <IGRPIcon
            iconName='ChevronDown'
            size={16}
            aria-hidden='true'
          />
        </span>
      </div>
      <select
        disabled={disabled}
        value={value}
        onChange={handleSelect}
        className='absolute inset-0 text-sm opacity-0'
        aria-label='Select country'
      >
        <option
          key='default'
          value=''
        >
          Select a country
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option
              key={option.value ?? `empty-${i}`}
              value={option.value}
            >
              {option.label} {option.value && `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  );
}

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
  const Flag = flags[country];
  return (
    <span className='w-5 overflow-hidden rounded-sm'>
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <IGRPIcon
          iconName='Phone'
          size={16}
          aria-hidden='true'
        />
      )}
    </span>
  );
}

function IGRPInputPhone({
  name,
  label,
  description,
  helperText,
  error,
  defaultValue,
  value,
  placeholder = 'Enter phone number',
  disabled,
  international = true,
  defaultCountry,
  countries,
  onChange,
  className,
  required,
  dir = 'ltr',
  gridSize = 'default',
  ...props
}: IGRPInputPhoneProps) {
  const id = useId();
  const fieldName = name || id;
  const formContext = useFormContext();
  const [localValue, setLocalValue] = useState(defaultValue || '');

  useEffect(() => {
    if (value !== undefined && !formContext) {
      setLocalValue(value);
    }
  }, [value, formContext]);

  const handleStandaloneChange = (newValue: string | undefined) => {
    setLocalValue(newValue || '');
    onChange?.(newValue);
  };

  if (!formContext) {
    return (
      <div
        className={cn('*:not-first:mt-2', className)}
        dir={dir}
      >
        {label && (
          <IGRPLabel
            label={label}
            className={className}
            required={required}
            id={fieldName}
          />
        )}

        <RPNInput.default
          className='flex rounded-md shadow-xs'
          international={international}
          flagComponent={FlagComponent}
          countrySelectComponent={CountrySelect}
          inputComponent={PhoneInput}
          id={fieldName}
          placeholder={placeholder}
          value={value !== undefined ? value : localValue}
          onChange={handleStandaloneChange}
          disabled={disabled}
          defaultCountry={defaultCountry}
          countries={countries}
          {...props}
        />

        {(description || helperText) && !error && (
          <p className='text-xs text-muted-foreground'>{description || helperText}</p>
        )}

        {error && <p className='text-xs text-destructive'>{error}</p>}
      </div>
    );
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue || ''}
      render={({ field, fieldState }) => (
        <div
          className={cn('*:not-first:mt-2', igrpGridSizeClasses[gridSize], className)}
          dir={dir}
        >
          {label && (
            <IGRPLabel
              label={label}
              className={className}
              required={required}
              id={fieldName}
            />
          )}

          <RPNInput.default
            className='flex rounded-md shadow-xs'
            international={international}
            flagComponent={FlagComponent}
            countrySelectComponent={CountrySelect}
            inputComponent={PhoneInput}
            id={fieldName}
            placeholder={placeholder}
            value={field.value}
            onChange={(newValue) => {
              field.onChange(newValue);
              onChange?.(newValue);
            }}
            onBlur={field.onBlur}
            disabled={disabled}
            defaultCountry={defaultCountry}
            countries={countries}
            {...props}
          />

          {(description || helperText) && !error && !fieldState.error && (
            <p className='text-xs text-muted-foreground'>{description || helperText}</p>
          )}

          {(error || fieldState.error) && (
            <p className='text-xs text-destructive'>{error || fieldState.error?.message}</p>
          )}
        </div>
      )}
    />
  );
}

export { IGRPInputPhone, type IGRPInputPhoneProps };

'use client';

import { useId, useState, useEffect, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/horizon/input';
import { IGRPLabel } from '@/components/igrp/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { cn } from '@/lib/utils';
import type { IGRPOptionsProps, IGRPGridSize } from '@/types/globals';
import { igrpGridSizeClasses } from '@/lib/constants';

interface IGRPInputUrlProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  name: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  protocols?: IGRPOptionsProps[];
  defaultProtocol?: string;
  gridSize?: IGRPGridSize;
}

const DEFAULT_PROTOCOLS: IGRPOptionsProps[] = [
  { value: 'https://', label: 'https://' },
  { value: 'http://', label: 'http://' },
  { value: 'ftp://', label: 'ftp://' },
  { value: 'sftp://', label: 'sftp://' },
  { value: 'ws://', label: 'ws://' },
  { value: 'wss://', label: 'wss://' },
];

function IGRPInputUrl({
  name,
  label,
  helperText,
  className,
  required = false,
  error,
  value,
  defaultValue = '',
  onChange,
  protocols = DEFAULT_PROTOCOLS,
  defaultProtocol = 'https://',
  gridSize = 'default',
  ...props
}: IGRPInputUrlProps) {
  const id = useId();
  const fieldName = name || id;

  const formContext = useFormContext();

  const [localProtocol, setLocalProtocol] = useState(defaultProtocol);
  const [localAddress, setLocalAddress] = useState('');

  const extractUrlParts = useCallback(
    (url: string) => {
      const protocolMatch = protocols.find((p) => url.startsWith(p.value));
      if (protocolMatch) {
        return {
          protocol: protocolMatch.value,
          address: url.substring(protocolMatch.value.length),
        };
      }
      return {
        protocol: defaultProtocol,
        address: url,
      };
    },
    [defaultProtocol, protocols],
  );

  const combineUrl = (protocol: string, address: string) => {
    return `${protocol}${address}`;
  };

  useEffect(() => {
    if (!formContext && (value !== undefined || defaultValue)) {
      const initialValue = value !== undefined ? value : defaultValue;
      const { protocol: extractedProtocol, address: extractedAddress } =
        extractUrlParts(initialValue);
      setLocalProtocol(extractedProtocol);
      setLocalAddress(extractedAddress);
    }
  }, [value, defaultValue, formContext, extractUrlParts]);

  const handleStandaloneProtocolChange = (newProtocol: string) => {
    setLocalProtocol(newProtocol);
    onChange?.(combineUrl(newProtocol, localAddress));
  };

  const handleStandaloneAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setLocalAddress(newAddress);
    onChange?.(combineUrl(localProtocol, newAddress));
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

        <div className='flex rounded-md shadow-xs'>
          <Select
            value={localProtocol}
            onValueChange={handleStandaloneProtocolChange}
            disabled={props.disabled}
          >
            <SelectTrigger className='border-0 shadow-none border-l border-b border-t rounded-l-2xl rounded-none min-w-[100px]'>
              <SelectValue placeholder={defaultProtocol} />
            </SelectTrigger>
            <SelectContent>
              {protocols.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            id={fieldName}
            name={fieldName}
            value={localAddress}
            onChange={handleStandaloneAddressChange}
            required={required}
            aria-required={required}
            aria-invalid={!!error || !!props['aria-invalid']}
            aria-describedby={helperText || error ? `${id}-helper` : undefined}
            className={cn(
              'rounded-s-none shadow-none focus-visible:z-10',
              error && 'border-destructive focus-visible:ring-destructive/20',
              className,
            )}
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

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      defaultValue={defaultValue || ''}
      render={({ field, fieldState }) => {
        const { protocol: fieldProtocol, address: fieldAddress } = extractUrlParts(
          field.value || '',
        );

        const handleProtocolChange = (newProtocol: string) => {
          const newValue = combineUrl(newProtocol, fieldAddress);
          field.onChange(newValue);
          onChange?.(newValue);
        };

        const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newAddress = e.target.value;
          const newValue = combineUrl(fieldProtocol, newAddress);
          field.onChange(newValue);
          onChange?.(newValue);
        };

        return (
          <div className={cn('*:not-first:mt-2', igrpGridSizeClasses[gridSize])}>
            {label && (
              <IGRPLabel
                label={label}
                className={className}
                required={required}
                id={fieldName}
              />
            )}

            <div className='flex rounded-md shadow-xs'>
              <Select
                value={fieldProtocol}
                onValueChange={handleProtocolChange}
                disabled={props.disabled}
                onOpenChange={() => field.onBlur()}
              >
                <SelectTrigger className='border-0 shadow-none border-l border-b border-t rounded-l-2xl rounded-none min-w-[100px]'>
                  <SelectValue placeholder={defaultProtocol} />
                </SelectTrigger>
                <SelectContent>
                  {protocols.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                id={fieldName}
                name={fieldName}
                value={fieldAddress}
                onChange={handleAddressChange}
                onBlur={field.onBlur}
                required={required}
                aria-required={required}
                aria-invalid={!!fieldState.error || !!error || !!props['aria-invalid']}
                aria-describedby={
                  helperText || error || fieldState.error ? `${id}-helper` : undefined
                }
                className={cn(
                  'rounded-s-none shadow-none focus-visible:z-10',
                  (fieldState.error || error) &&
                    'border-destructive focus-visible:ring-destructive/20',
                  className,
                )}
                {...props}
              />
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
                id={`${fieldName}-error`}
                className='text-destructive mt-2 text-xs'
                role='alert'
              >
                {error || fieldState.error?.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export { IGRPInputUrl, type IGRPInputUrlProps };

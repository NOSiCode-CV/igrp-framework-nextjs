'use client';

import { useId, useState, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { cn } from '../../../lib/utils';
import type { IGRPInputProps, IGRPOptionsProps } from '../../../types';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { IGRPLabel } from '../label';

/**
 * Props for the IGRPInputUrl component.
 * @see IGRPInputUrl
 */
interface IGRPInputUrlProps extends Omit<IGRPInputProps, 'onChange'> {
  /** Field name. */
  name: string;
  /** Field label. */
  label?: string;
  /** Helper text below the input. */
  helperText?: string;
  /** Validation error message. */
  error?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Controlled URL value. */
  value?: string;
  /** Default URL value. */
  defaultValue?: string;
  /** Called when URL changes. */
  onChange?: (value: string) => void;
  /** Protocol options (e.g. https://, http://). */
  protocols?: IGRPOptionsProps[];
  /** Default protocol prefix. */
  defaultProtocol?: string;
}

const DEFAULT_PROTOCOLS: IGRPOptionsProps[] = [
  { value: 'https://', label: 'https://' },
  { value: 'http://', label: 'http://' },
  { value: 'ftp://', label: 'ftp://' },
  { value: 'sftp://', label: 'sftp://' },
  { value: 'ws://', label: 'ws://' },
  { value: 'wss://', label: 'wss://' },
];

/**
 * URL input with protocol selector. Integrates with react-hook-form.
 */
function IGRPInputUrl({
  name,
  id,
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
  ...props
}: IGRPInputUrlProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const formContext = useFormContext();

  const extractUrlParts = useCallback(
    (url: string) => {
      const protocolMatch = protocols.find((p) => url.startsWith(String(p.value)));
      if (protocolMatch) {
        return {
          protocol: protocolMatch.value,
          address: url.substring(String(protocolMatch.value).length),
        };
      }
      return {
        protocol: defaultProtocol,
        address: url,
      };
    },
    [defaultProtocol, protocols],
  );

  const initialUrl = value ?? defaultValue ?? '';
  const initialParts = extractUrlParts(initialUrl);
  const [localProtocol, setLocalProtocol] = useState(() => String(initialParts.protocol));
  const [localAddress, setLocalAddress] = useState(() => initialParts.address);

  const displayProtocol =
    !formContext && value !== undefined ? String(extractUrlParts(value).protocol) : localProtocol;
  const displayAddress =
    !formContext && value !== undefined ? extractUrlParts(value).address : localAddress;

  const combineUrl = (protocol: string, address: string) => {
    return `${protocol}${address}`;
  };

  const handleStandaloneProtocolChange = (newProtocol: string) => {
    if (value === undefined) setLocalProtocol(newProtocol);
    onChange?.(combineUrl(newProtocol, displayAddress));
  };

  const handleStandaloneAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    if (value === undefined) setLocalAddress(newAddress);
    onChange?.(combineUrl(displayProtocol, newAddress));
  };

  if (!formContext) {
    return (
      <div className={cn('*:not-first:mt-2')}>
        {label && (
          <IGRPLabel label={label} className={className} required={required} id={fieldName} />
        )}

        <div className={cn('flex rounded-md shadow-xs')}>
          <Select
            value={displayProtocol}
            onValueChange={handleStandaloneProtocolChange}
            disabled={props.disabled}
          >
            <SelectTrigger
              className={cn(
                'border-0 shadow-none border-l border-b border-t rounded-l-2xl rounded-none min-w-[100px]',
              )}
            >
              <SelectValue placeholder={defaultProtocol} />
            </SelectTrigger>
            <SelectContent>
              {protocols.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            id={fieldName}
            name={fieldName}
            value={displayAddress}
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
          const newValue = combineUrl(String(fieldProtocol), newAddress);
          field.onChange(newValue);
          onChange?.(newValue);
        };

        return (
          <div className={cn('*:not-first:mt-2')}>
            {label && (
              <IGRPLabel label={label} className={className} required={required} id={fieldName} />
            )}

            <div className={cn('flex rounded-md shadow-xs')}>
              <Select
                value={String(fieldProtocol)}
                onValueChange={handleProtocolChange}
                disabled={props.disabled}
                onOpenChange={() => field.onBlur()}
              >
                <SelectTrigger
                  className={cn(
                    'border-0 shadow-none border-l border-b border-t rounded-l-2xl rounded-none min-w-[100px]',
                  )}
                >
                  <SelectValue placeholder={defaultProtocol} />
                </SelectTrigger>
                <SelectContent>
                  {protocols.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
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
                className={cn('text-muted-foreground mt-2 text-xs')}
                role="region"
                aria-live="polite"
              >
                {helperText}
              </p>
            )}

            {(error || fieldState.error) && (
              <p
                id={`${fieldName}-error`}
                className={cn('text-destructive mt-2 text-xs')}
                role="alert"
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

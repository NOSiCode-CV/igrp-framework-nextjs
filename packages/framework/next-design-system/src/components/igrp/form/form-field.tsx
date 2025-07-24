import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
} from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/primitives/form';
import { cn } from '@/lib/utils';
import { type IGRPPlacementProps } from '@/types/globals';

interface IGRPFormFielProps {
  name: string;
  label?: string;
  helperText?: string;
  className?: string;
  size?: string;
  children:
    | React.ReactNode
    | ((field: ControllerRenderProps, fieldState: ControllerFieldState) => React.ReactNode);
  required?: boolean;
  control: Control<FieldValues, unknown, FieldValues>;
  labelPlacement?: IGRPPlacementProps;
  isToggle?: boolean;
}

function IGRPFormField({
  name,
  label,
  helperText,
  className,
  size,
  children,
  required,
  control,
  labelPlacement = 'start',
  isToggle = false,
}: IGRPFormFielProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn('*:not-first:mt-2', size, className)}>
          <FormItem>
            <div className={cn('flex flex-col gap-2', isToggle && 'flex-row items-center')}>
              {label && (
                <FormLabel
                  className={cn(
                    labelPlacement === 'end' && 'order-last',
                    required && 'after:content-["*"] after:ml-0.5 after:text-destructive',
                  )}
                >
                  {label}
                </FormLabel>
              )}

              <FormControl>
                {typeof children === 'function' ? children(field, fieldState) : children}
              </FormControl>
            </div>

            {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}

            <FormMessage className='text-xs' />
          </FormItem>
        </div>
      )}
    />
  );
}

export { IGRPFormField, type IGRPFormFielProps };

'use client';

import { Label } from '@/components/primitives/label';
import { cn } from '@/lib/utils';

type IGRPLabelProps = React.ComponentProps<typeof Label> & {
  label?: string;
  required?: boolean;
};

function IGRPLabel({ label = '', className, required = false, id }: IGRPLabelProps) {
  if (!label) return null;

  return (
    <Label
      htmlFor={id}
      className={cn(
        required && 'after:content-["*"] after:ml-0.5 after:text-destructive',
        className,
      )}
    >
      {label}
    </Label>
  );
}

export { IGRPLabel, type IGRPLabelProps };

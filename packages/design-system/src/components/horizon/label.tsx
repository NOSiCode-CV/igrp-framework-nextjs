'use client';

import { Label } from '../primitives/label';
import { cn } from '../../lib/utils';
import { useId } from 'react';

type IGRPLabelProps = React.ComponentProps<typeof Label> & {
  label?: string;
  required?: boolean;
  name?: string;
};

function IGRPLabel({ label, className, required = false, name, id }: IGRPLabelProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  if (!label) return null;

  return (
    <Label
      htmlFor={ref}
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

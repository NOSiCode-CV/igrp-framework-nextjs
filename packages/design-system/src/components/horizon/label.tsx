'use client';

import { Label } from '../primitives/label';
import { cn } from '../../lib/utils';

type IGRPLabelProps = React.ComponentProps<typeof Label> & {
  label?: string;
  required?: boolean;
  name?: string;
};

function IGRPLabel({ 
  label, 
  className, 
  required = false,
  name,
  id, 
}: IGRPLabelProps) {
  if (!label) return null;

  return (
    <Label
      htmlFor={name || id}
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

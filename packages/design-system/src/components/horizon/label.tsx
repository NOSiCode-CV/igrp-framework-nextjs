'use client';

import { useId } from 'react';

import { cn } from '../../lib/utils';
import { Label } from '../primitives/label';

/**
 * Props for the IGRPLabel component.
 * @see IGRPLabel
 */
type IGRPLabelProps = React.ComponentProps<typeof Label> & {
  /** Label text. */
  label?: string;
  /** Show required indicator (*). */
  required?: boolean;
  /** HTML name attribute. */
  name?: string;
};

/**
 * Form label with optional required indicator.
 */
function IGRPLabel({ label, className, required = false, name, id, ...props }: IGRPLabelProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  if (!label) return null;

  return (
    <Label
      htmlFor={ref}
      className={cn(required && "after:content-['*'] after:text-destructive", 'gap-0.5', className)}
      {...props}
    >
      {label}
    </Label>
  );
}

export { IGRPLabel, type IGRPLabelProps };

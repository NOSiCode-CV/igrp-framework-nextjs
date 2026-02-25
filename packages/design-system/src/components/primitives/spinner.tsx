import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import React from 'react';

const Spinner = React.forwardRef<SVGSVGElement, React.ComponentProps<'svg'>>(
  ({ className, ...props }, ref) => (
    <LoaderCircle
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  ),
);

export { Spinner };

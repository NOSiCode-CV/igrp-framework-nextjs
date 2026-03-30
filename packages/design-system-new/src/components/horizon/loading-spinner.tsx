'use client';

import { useId } from 'react';

import { cn } from '../../lib/utils';

/**
 * Props for the IGRPLoadingSpinner component.
 * @see IGRPLoadingSpinner
 */
interface IGRPLoadingSpinnerProps {
  /** CSS classes for the outer container (centers the spinner). */
  parentClassName?: string;
  /** CSS classes for the spinner element. */
  className?: string;
  /** HTML id attribute. */
  id?: string;
}

/**
 * Centered loading spinner for async states.
 * Renders a circular animated spinner in a flex container.
 */
function IGRPLoadingSpinner({ parentClassName, className, id }: IGRPLoadingSpinnerProps) {
  const _id = useId();
  const ref = id ?? _id;

  return (
    <div className={cn('flex justify-center items-center h-64', parentClassName)} id={ref}>
      <div
        className={cn(
          'animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100',
          className,
        )}
      />
    </div>
  );
}

export { IGRPLoadingSpinner };

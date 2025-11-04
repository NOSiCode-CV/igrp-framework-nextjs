'use client'

import { useId } from 'react';

import { cn } from '../../lib/utils';

interface IGRPLoadingSpinnerProps {
  parentClassName?: string;
  className?: string;
  id?: string;
}

function IGRPLoadingSpinner({ 
  parentClassName, 
  className,
  id
}: IGRPLoadingSpinnerProps) {
  const _id = useId();
  const ref = id ?? _id
  
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

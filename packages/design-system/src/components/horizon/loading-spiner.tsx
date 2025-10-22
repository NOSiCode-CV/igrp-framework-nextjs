import { cn } from '../../lib/utils';

interface IGRPLoadingSpinnerProps {
  parentClassName?: string;
  className?: string;
}

function IGRPLoadingSpinner({ parentClassName, className }: IGRPLoadingSpinnerProps) {
  return (
    <div className={cn('flex justify-center items-center h-64', parentClassName)}>
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

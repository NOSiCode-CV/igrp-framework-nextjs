"use client";

import { useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * Props for the IGRPPageFooter component.
 * @see IGRPPageFooter
 */
interface IGRPPageFooterProps {
  /** Additional CSS classes. */
  className?: string;
  /** Footer content. */
  children?: React.ReactNode;
  /** Stick to bottom when scrolling. */
  isSticky?: boolean;
  /** HTML name attribute. */
  name?: string;
  /** HTML id attribute. */
  id?: string;
}

/**
 * Page footer with optional sticky positioning.
 */
function IGRPPageFooter({ className, children, name, isSticky, id }: IGRPPageFooterProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  return (
    <div
      className={cn(
        'mt-6 bg-background border-t shadow-md py-2 px-4',
        isSticky && 'sticky bottom-0 left-0 right-0 z-10',
        className,
      )}
      id={ref}
    >
      <div className={cn('flex justify-between items-center w-full')}>{children}</div>
    </div>
  );
}

export { IGRPPageFooter, type IGRPPageFooterProps };

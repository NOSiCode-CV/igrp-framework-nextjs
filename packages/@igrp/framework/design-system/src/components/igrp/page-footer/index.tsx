import { cn } from '@/lib/utils';

interface IGRPPageFooterProps {
  className?: string;
  children?: React.ReactNode;
  isSticky?: boolean;
  name?: string;
}

function IGRPPageFooter({ className, children, name, isSticky }: IGRPPageFooterProps) {
  return (
    <div
      className={cn(
        'mt-6 bg-background border-t shadow-md py-2 px-4',
        isSticky && 'sticky bottom-0 left-0 right-0 z-10',
        className,
      )}
      id={name}
    >
      <div className='flex justify-between items-center w-full'>{children}</div>
    </div>
  );
}

export { IGRPPageFooter, type IGRPPageFooterProps };

import { cn } from '@/lib/utils';
import type { IGRPBaseAttributes } from '@/types/globals';

function IGRPContainer({
  className,
  name,
  ...props
}: React.ComponentProps<'div'> & Pick<IGRPBaseAttributes, 'name'>) {
  return (
    <div
      className={cn('p-3', className)}
      {...props}
      id={name}
    />
  );
}

export { IGRPContainer };

import { useId } from 'react';

import { cn } from '../../lib/utils';

function IGRPContainer({ className, id, ...props }: React.ComponentProps<'div'>) {
  const _id = useId();
  const ref = id ?? _id;

  return <div className={cn('p-3', className)} {...props} id={ref} />;
}

export { IGRPContainer };

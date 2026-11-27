'use client';

import { cn, Skeleton } from '@igrp/igrp-framework-react-design-system';

export function IGRPHeaderSkeleton() {
  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0 h-16',
      )}
    >
      <div className={cn('flex items-center gap-2')}>
        <Skeleton className={cn('size-8')} />
        <Skeleton className={cn('h-4 w-32')} />
      </div>
      <div className={cn('flex items-center gap-2')}>
        <Skeleton className={cn('size-8 rounded-full')} />
        <Skeleton className={cn('size-8 rounded-full')} />
      </div>
    </div>
  );
}

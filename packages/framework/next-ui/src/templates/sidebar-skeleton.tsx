'use client';

import { cn, Skeleton } from '@igrp/igrp-framework-react-design-system';

export function IGRPSidebarSkeleton() {
  return (
    <div className={cn('flex flex-col gap-3 p-4 h-full')}>
      <Skeleton className={cn('h-10 w-full')} />
      <div className={cn('flex flex-col gap-2 mt-4')}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className={cn('h-8 w-full')} />
        ))}
      </div>
    </div>
  );
}

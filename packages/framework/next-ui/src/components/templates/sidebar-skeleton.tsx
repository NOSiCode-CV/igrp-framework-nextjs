// packages/framework/next-ui/src/components/templates/sidebar-skeleton.tsx
'use client';

import { cn } from '@igrp/igrp-framework-react-design-system';

export function IGRPSidebarSkeleton() {
  return (
    <div className={cn('flex flex-col gap-3 p-4 h-full')}>
      <div className={cn('h-10 w-full rounded bg-muted animate-pulse')} />
      <div className={cn('flex flex-col gap-2 mt-4')}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn('h-8 w-full rounded bg-muted animate-pulse')} />
        ))}
      </div>
    </div>
  );
}

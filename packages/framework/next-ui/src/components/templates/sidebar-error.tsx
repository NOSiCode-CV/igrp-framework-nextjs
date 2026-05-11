// packages/framework/next-ui/src/components/templates/sidebar-error.tsx
'use client';

import { useRouter } from 'next/navigation';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

export function IGRPSidebarError() {
  const router = useRouter();

  return (
    <div className={cn('flex flex-col items-start gap-3 p-4')}>
      <span className={cn('text-sm text-muted-foreground')}>Falha ao carregar a navegação.</span>
      <IGRPButton
        variant="ghost"
        size="sm"
        onClick={() => router.refresh()}
        showIcon
        iconName="RefreshCw"
      >
        Tentar novamente
      </IGRPButton>
    </div>
  );
}

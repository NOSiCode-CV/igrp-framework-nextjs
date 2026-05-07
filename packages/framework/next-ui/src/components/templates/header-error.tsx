// packages/framework/next-ui/src/components/templates/header-error.tsx
'use client';

import { useRouter } from 'next/navigation';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

export function IGRPHeaderError() {
  const router = useRouter();

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0 h-16',
      )}
    >
      <span className={cn('text-sm text-muted-foreground')}>
        Falha ao carregar o cabeçalho.
      </span>
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

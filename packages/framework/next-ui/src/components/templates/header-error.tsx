// packages/framework/next-ui/src/components/templates/header-error.tsx
'use client';

import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

import { useIGRPLayoutRetry } from '../../hooks/use-igrp-layout-retry';

export function IGRPHeaderError() {
  const { retry, isRetrying } = useIGRPLayoutRetry();

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0 h-16',
      )}
    >
      <span className={cn('text-sm text-muted-foreground')}>Falha ao carregar o cabeçalho.</span>
      <IGRPButton
        variant="ghost"
        size="sm"
        onClick={retry}
        loading={isRetrying}
        loadingText="A tentar…"
        showIcon
        iconName="RefreshCw"
      >
        Tentar novamente
      </IGRPButton>
    </div>
  );
}

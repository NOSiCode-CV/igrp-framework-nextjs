// packages/framework/next-ui/src/components/templates/sidebar-error.tsx
'use client';

import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

import { useIGRPLayoutRetry } from '../../hooks/use-igrp-layout-retry';

export function IGRPSidebarError() {
  const { retry, isRetrying } = useIGRPLayoutRetry();

  return (
    <div className={cn('flex flex-col items-start gap-3 p-4')}>
      <span className={cn('text-sm text-muted-foreground')}>Falha ao carregar a navegação.</span>
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

'use client';

import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

import { useIGRPLayoutRetry } from '../hooks/use-igrp-layout-retry.js';
import { useIGRPChromeI18n } from '../i18n/context.js';

export function IGRPSidebarError() {
  const { retry, isRetrying } = useIGRPLayoutRetry();
  const { layoutError } = useIGRPChromeI18n();

  return (
    <div className={cn('flex flex-col items-start gap-3 p-4')}>
      <span className={cn('text-sm text-muted-foreground')}>{layoutError.sidebar}</span>
      <IGRPButton
        variant="ghost"
        size="sm"
        onClick={retry}
        loading={isRetrying}
        loadingText={layoutError.retrying}
        showIcon
        iconName="RefreshCw"
      >
        {layoutError.retry}
      </IGRPButton>
    </div>
  );
}

'use client';

import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

import { useIGRPLayoutRetry } from '../hooks/use-igrp-layout-retry.js';
import { useIGRPChromeI18n } from '../i18n/context.js';

export function IGRPHeaderError() {
  const { retry, isRetrying } = useIGRPLayoutRetry();
  const { layoutError } = useIGRPChromeI18n();

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0 h-16',
      )}
    >
      <span className={cn('text-sm text-muted-foreground')}>{layoutError.header}</span>
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

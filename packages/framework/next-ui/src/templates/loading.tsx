'use client';

import { cn, IGRPIcon } from '@igrp/igrp-framework-react-design-system';

interface IGRPTemplateLoadingProps {
  text?: string;
  appCode?: string;
  className?: string;
}

function IGRPTemplateLoading({
  text = 'Aguarde...',
  appCode,
  className,
}: IGRPTemplateLoadingProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen items-center justify-center bg-background px-4 py-16',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* No `aria-label` here: it would override the element's content, so the
          visible text below would stop being the accessible name the moment the
          two diverge. `role="status"` already announces that content. */}
      <div className={cn('w-full max-w-md')}>
        <div className={cn('text-center')}>
          <IGRPIcon
            iconName="LoaderCircle"
            strokeWidth={1}
            className={cn('size-16 animate-spin mx-auto mb-4 text-primary')}
            aria-hidden="true"
          />
          <p className={cn('text-lg font-medium text-foreground')}>{text}</p>
          {appCode && <span className={cn('sr-only')}>iGRP {appCode}</span>}
        </div>
      </div>
    </div>
  );
}

export { IGRPTemplateLoading, type IGRPTemplateLoadingProps };

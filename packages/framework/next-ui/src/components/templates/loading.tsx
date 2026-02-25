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
        'flex min-h-[calc(100vh-12rem)] items-center justify-center bg-background px-4 py-16',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
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

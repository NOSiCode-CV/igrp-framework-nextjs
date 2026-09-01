'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { cn, IGRPButton, IGRPIcon } from '@igrp/igrp-framework-react-design-system';

const RESET_DELAY_MS = 400;

/**
 * Props for {@link IGRPSegmentError}.
 *
 * The component is designed for a **segment-level** Next.js App Router
 * `error.tsx` — that is, an error boundary nested inside a parent layout
 * (header / sidebar chrome). For errors that must render *without* surrounding
 * layout (root `global-error.tsx`, bootstrap failures), use `IGRPGlobalError`
 * instead.
 */
export interface IGRPSegmentErrorProps {
  /** Error passed into the App Router `error.tsx` boundary. */
  error: Error & { digest?: string };

  /** Next.js-provided reset function — re-renders the erroring segment. */
  reset: () => void;

  /**
   * Optional override. If a segment wants to render entirely custom content
   * it can pass children; all other props are ignored.
   */
  children?: React.ReactNode;

  /**
   * Resolves a user-facing message. Receives the error; returns a
   * `{ title, description }` pair. Consumers typically look up a translation
   * keyed by `error.name` (e.g. `'IgrpConfigError'`) or a framework
   * `IgrpError.code`. Falls back to a generic Portuguese copy.
   */
  resolveCopy?: (error: Error) => {
    title: string;
    description: string;
  };

  /** Link target for the "go home" button. Defaults to `/`. */
  homeHref?: string;

  /** Label for the home button. Defaults to `'Voltar ao início'`. */
  homeLabel?: string;

  /** Label for the reset button. Defaults to `'Tentar novamente'`. */
  resetLabel?: string;

  /** Label shown while the reset is in progress. Defaults to `'A tentar...'`. */
  retryingLabel?: string;

  /** Label prefix for the error reference ID. Defaults to `'ID de referência:'`. */
  errorRefLabel?: string;
}

const DEFAULT_COPY = {
  title: 'Ocorreu um erro nesta secção.',
  description:
    'Tente novamente ou volte ao início. Se o problema persistir, contacte a equipa de suporte.',
};

function IGRPSegmentError({
  error,
  reset,
  children,
  resolveCopy,
  homeHref = '/',
  homeLabel = 'Voltar ao início',
  resetLabel = 'Tentar novamente',
  retryingLabel = 'A tentar...',
  errorRefLabel = 'ID de referência:',
}: IGRPSegmentErrorProps) {
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // When custom children are provided this boundary renders them verbatim and
    // does nothing else — but the hooks above MUST still run on every render
    // (Rules of Hooks), so the children short-circuit lives here and below the
    // hooks, never before them.
    if (children) return;
    unstable_rethrow(error);
    // Basic dev-time logging. Templates should compose a `reportError` hook
    // above this boundary for production observability.
    console.error('[IGRPSegmentError]', error);
  }, [error, children]);

  if (children) return <>{children}</>;

  const { title, description } = resolveCopy?.(error) ?? DEFAULT_COPY;

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      reset();
      setIsResetting(false);
    }, RESET_DELAY_MS);
  };

  return (
    <div className={cn('flex min-h-[320px] items-center justify-center p-6')}>
      <div className={cn('w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm')}>
        <div className={cn('space-y-4')}>
          <div className={cn('space-y-1')}>
            <h2 className={cn('text-lg font-semibold text-foreground')}>{title}</h2>
            <p className={cn('text-sm text-muted-foreground')}>{description}</p>
          </div>

          {error.digest ? (
            <p className={cn('text-xs text-muted-foreground')}>
              {errorRefLabel}{' '}
              <code
                className={cn('rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground')}
              >
                {error.digest}
              </code>
            </p>
          ) : null}

          <div className={cn('flex flex-col items-stretch gap-2 sm:flex-row sm:items-center')}>
            <IGRPButton
              onClick={handleReset}
              disabled={isResetting}
              showIcon
              iconName="RefreshCw"
              iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
            >
              <span>{isResetting ? retryingLabel : resetLabel}</span>
            </IGRPButton>
            <IGRPButton asChild variant="outline">
              <Link href={homeHref}>
                <IGRPIcon iconName="Home" className={cn('mr-2 h-4 w-4')} aria-hidden="true" />
                {homeLabel}
              </Link>
            </IGRPButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export { IGRPSegmentError };

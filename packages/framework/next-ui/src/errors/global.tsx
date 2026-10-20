'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { unstable_rethrow } from 'next/navigation';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

import { useIGRPChromeI18n } from '../i18n/context.js';
import { igrpResolveErrorCopy, type IGRPErrorCopyResolver } from '../i18n/error-copy.js';
import { withBasePath } from '../lib/utils.js';

const ANIMATION_DELAY_MS = 300;
const RESET_DELAY_MS = 1000;

interface IGRPGlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  children?: React.ReactNode;
  /**
   * Resolves user-facing copy for the error. May return a full or partial
   * `{ title, description }`; missing keys fall back to the chrome catalog's
   * entry for the error's platform `code`, then to its generic copy.
   */
  resolveCopy?: IGRPErrorCopyResolver;
  /** Label for the retry button. Defaults to the chrome catalog. */
  resetLabel?: string;
  /** Label shown while the reset is in progress. Defaults to the chrome catalog. */
  retryingLabel?: string;
  /** Label prefix for the error reference ID. Defaults to the chrome catalog. */
  errorRefLabel?: string;
}

function IGRPGlobalError({
  error,
  reset,
  children,
  resolveCopy,
  resetLabel,
  retryingLabel,
  errorRefLabel,
}: IGRPGlobalErrorProps) {
  const chrome = useIGRPChromeI18n();
  const labels = {
    reset: resetLabel ?? chrome.globalError.reset,
    retrying: retryingLabel ?? chrome.globalError.retrying,
    errorRef: errorRefLabel ?? chrome.globalError.errorRef,
  };
  const [isResetting, setIsResetting] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The reset timer outlives the component whenever `reset()` succeeds, which
  // is the normal case: it re-renders the segment and unmounts this fallback.
  useEffect(
    () => () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (children) return;
    unstable_rethrow(error);
    console.error(error);

    const timer = setTimeout(() => setErrorVisible(true), ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [error, children]);

  if (children) return <>{children}</>;

  const handleReset = () => {
    setIsResetting(true);
    resetTimer.current = setTimeout(() => {
      resetTimer.current = null;
      reset();
      setIsResetting(false);
    }, RESET_DELAY_MS);
  };

  const { title, description } = igrpResolveErrorCopy(
    error,
    { byCode: chrome.errorCodes, fallback: chrome.globalError },
    resolveCopy,
  );

  return (
    <div className={cn('flex min-h-screen items-center justify-center bg-background')}>
      <div className={cn('w-full max-w-3xl')}>
        <div className={cn('text-center')}>
          <Image
            src={withBasePath('/error-img.webp')}
            alt="Error Image"
            width={300}
            height={200}
            className={cn('mx-auto mb-2')}
          />
          <h1 className={cn('text-2xl font-bold tracking-tight text-foreground')}>{title}</h1>
          <p className={cn('mb-4 text-base text-muted-foreground')}>{description}</p>

          {error.digest && (
            <div
              className={cn(
                'mx-auto max-w-xl transform overflow-hidden rounded-lg p-3 mb-4 backdrop-blur transition-all duration-500 bg-muted shadow-xs',
                errorVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <p className={cn('text-xs text-muted-foreground')}>
                {labels.errorRef}{' '}
                <code className={cn('rounded bg-muted px-1 py-0.5')}>{error.digest}</code>
              </p>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <IGRPButton
              onClick={handleReset}
              size="lg"
              className={cn('group min-w-40')}
              disabled={isResetting}
              showIcon
              iconName="RefreshCw"
              iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
            >
              <span>{isResetting ? labels.retrying : labels.reset}</span>
            </IGRPButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export { IGRPGlobalError, type IGRPGlobalErrorProps };

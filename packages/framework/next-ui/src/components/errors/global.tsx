'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { unstable_rethrow } from 'next/navigation';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

const ANIMATION_DELAY_MS = 300;
const RESET_DELAY_MS = 1000;

function withBasePath(src: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!basePath || !src.startsWith('/') || src.startsWith('//') || src.startsWith(`${basePath}/`)) {
    return src;
  }
  return `${basePath}${src}`;
}

const DEFAULT_COPY = {
  title: 'Ocorreu um erro inesperado.',
  description:
    'Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.',
};

interface IGRPGlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  children?: React.ReactNode;
  /**
   * Resolves a user-facing `{ title, description }` pair for the error.
   * Consumers typically look up copy keyed by `error.code` (framework typed
   * errors) and fall back to a generic message. Falls back to
   * `DEFAULT_COPY` when omitted or when the resolver returns nothing.
   */
  resolveCopy?: (error: Error) => { title: string; description: string };
  /** Label for the retry button. Defaults to `'Tentar novamente'`. */
  resetLabel?: string;
  /** Label shown while the reset is in progress. Defaults to `'A tentar...'`. */
  retryingLabel?: string;
  /** Label prefix for the error reference ID. Defaults to `'ID de referência:'`. */
  errorRefLabel?: string;
}

// TODO: check the image
function IGRPGlobalError({
  error,
  reset,
  children,
  resolveCopy,
  resetLabel = 'Tentar novamente',
  retryingLabel = 'A tentar...',
  errorRefLabel = 'ID de referência:',
}: IGRPGlobalErrorProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);

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
    setTimeout(() => {
      reset();
      setIsResetting(false);
    }, RESET_DELAY_MS);
  };

  const { title, description } = resolveCopy?.(error) ?? DEFAULT_COPY;

  return (
    <div className={cn('flex min-h-[calc(100vh-12rem)] items-center justify-center bg-background')}>
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
                {errorRefLabel}{' '}
                <code className={cn('rounded bg-muted px-1 py-0.5')}>{error.digest}</code>
              </p>
            </div>
          )}

          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <IGRPButton
              onClick={handleReset}
              size="lg"
              className={cn('group min-w-40')}
              disabled={isResetting}
              showIcon
              iconName="RefreshCw"
              iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
            >
              <span>{isResetting ? retryingLabel : resetLabel}</span>
            </IGRPButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export { IGRPGlobalError, type IGRPGlobalErrorProps };

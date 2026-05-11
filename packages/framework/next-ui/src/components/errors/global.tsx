import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

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
}

// TODO: check the image
function IGRPGlobalError({ error, reset, children, resolveCopy }: IGRPGlobalErrorProps) {
  if (children) return <>{children}</>;

  const [isResetting, setIsResetting] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);

  useEffect(() => {
    console.error(error);

    const timer = setTimeout(() => setErrorVisible(true), 300);
    return () => clearTimeout(timer);
  }, [error]);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      reset();
      setIsResetting(false);
    }, 1000);
  };

  const { title, description } = resolveCopy?.(error) ?? DEFAULT_COPY;

  return (
    <div className={cn('flex min-h-[calc(100vh-12rem)] items-center justify-center bg-primary-50')}>
      <div className={cn('w-full max-w-3xl')}>
        <div className={cn('text-center')}>
          <Image
            src="/error-img.webp"
            alt="Error Image"
            width={300}
            height={200}
            className={cn('mx-auto mb-2')}
          />
          <h1 className={cn('text-2xl font-bold tracking-tight text-gray-900 dark:text-white')}>
            {title}
          </h1>
          <p className={cn('mb-4 text-base text-gray-600 dark:text-gray-300')}>{description}</p>

          {error.digest && (
            <div
              className={cn(
                'mx-auto max-w-xl transform overflow-hidden rounded-lg p-3 mb-4 backdrop-blur transition-all duration-500 bg-stone-100 dark:bg-gray-800/50 shadow-xs',
                errorVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <p className={cn('text-xs text-gray-500')}>
                ID de referência:{' '}
                <code className={cn('rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-700')}>
                  {error.digest}
                </code>
              </p>
            </div>
          )}

          <div className={cn('flex flex-col items-center justify-center gap-4 sm:flex-row')}>
            <IGRPButton
              onClick={handleReset}
              size="lg"
              className={cn('group min-w-40')}
              disabled={isResetting}
              showIcon
              iconName="RefreshCw"
              iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
            >
              <span>{isResetting ? 'A tentar...' : 'Tentar novamente'}</span>
            </IGRPButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export { IGRPGlobalError, type IGRPGlobalErrorProps };

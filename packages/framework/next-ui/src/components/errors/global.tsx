import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

interface IGRPGlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  children?: React.ReactNode;
}

// TODO: check the image
function IGRPGlobalError({ error, reset, children }: IGRPGlobalErrorProps) {
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

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center bg-primary-50">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <Image
            src="/igrp/error-img.webp"
            alt="Error Image"
            width={300}
            height={200}
            className="mx-auto mb-2 w-"
          />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Ocorreu um erro inesperado.
          </h1>
          <p className="mb-4 text-base text-gray-600 dark:text-gray-300">
            A nossa equipa foi notificada e está a trabalhar para resolver o problema.
          </p>

          <div
            className={cn(
              'mx-auto max-w-xl transform overflow-hidden rounded-lg p-3 mb-4 backdrop-blur transition-all duration-500 bg-stone-100 dark:bg-gray-800/50 shadow-xs',
              errorVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            )}
          >
            <p className="mb-2 font-medium text-gray-900 dark:text-white">Detalhes do erro:</p>
            <p className="break-words text-gray-700 dark:text-gray-300">
              {error.message || 'An unknown error occurred'}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-500">
                ID de referência:{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-700">
                  {error.digest}
                </code>
              </p>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <IGRPButton
              onClick={handleReset}
              size="lg"
              className="group min-w-40"
              disabled={isResetting}
              showIcon
              iconName="RefreshCw"
              iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
            >
              <span>{isResetting ? 'Retrying...' : 'Try again'}</span>
            </IGRPButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export { IGRPGlobalError, type IGRPGlobalErrorProps };

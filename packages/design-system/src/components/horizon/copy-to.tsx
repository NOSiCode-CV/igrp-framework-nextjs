'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../primitives/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip';
import { IGRPIcon } from './icon';
import { useIGRPToast } from './toaster';

interface IGRPCopyToProps {
  value: string;
  tooltipDelayDuration?: number;
  toastDuration?: number;
  successMessage?: string;
  errorMessage?: string;
  tooltipMessage?: string;
  triggerClassName?: string;
  onCopySuccess?: (value: string) => void;
  onCopyError?: (error: Error) => void;
}

function IGRPCopyTo({
  value,
  tooltipDelayDuration = 700,
  toastDuration = 3500,
  successMessage = 'Copiado para a área de transferência',
  errorMessage = 'Não foi possível copiar para a área de transferência',
  tooltipMessage = 'Clique para copiar',
  triggerClassName,
  onCopySuccess,
  onCopyError,
}: IGRPCopyToProps) {
  const [copied, setCopied] = useState(false);
  const { igrpToast } = useIGRPToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (!value || value.trim() === '') {
      igrpToast({
        type: 'error',
        title: errorMessage,
        description: 'Nenhum conteúdo para copiar',
        duration: toastDuration,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      const displayValue = value.length > 50 ? `${value.substring(0, 47)}...` : value;

      setCopied(true);
      igrpToast({
        type: 'success',
        title: successMessage,
        description: displayValue,
        duration: toastDuration,
      });

      onCopySuccess?.(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('An unknown error occurred');

      igrpToast({
        type: 'error',
        title: errorMessage,
        description: errorInstance.message,
        duration: toastDuration,
      });

      onCopyError?.(errorInstance);
    }
  }

  return (
    <TooltipProvider delayDuration={tooltipDelayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('disabled:opacity-100 size-7', triggerClassName)}
            onClick={handleCopy}
            aria-label={copied ? successMessage : tooltipMessage}
            disabled={copied}
          >
            <div
              className={cn(
                'transition-all',
                copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
              )}
            >
              <IGRPIcon iconName="Check" className={cn('stroke-primary')} strokeWidth={2} />
            </div>
            <div
              className={cn(
                'absolute transition-all',
                copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
              )}
            >
              <IGRPIcon iconName="Copy" strokeWidth={2} className={cn('size-3')} />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className={cn('px-2 py-1 text-xs')}>{tooltipMessage}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { IGRPCopyTo, type IGRPCopyToProps };

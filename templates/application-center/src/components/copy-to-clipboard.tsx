'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CopyToClipboardProps {
  value: string;
  className?: string;
}

export function CopyToClipboard({ value }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      const displayValue = value.length > 50 ? `${value.substring(0, 47)}...` : value;

      setCopied(true);
      toast.success('Copied to clipboard', {
        description: displayValue,
        duration: 1500,
      });
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      toast.error('Failed to copy to clipboard', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 2000,
      });
    }
  };

  return (
    <TooltipProvider delayDuration={350}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='disabled:opacity-100 size-7'
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            disabled={copied}
          >
            <div
              className={cn(
                'transition-all',
                copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
              )}
            >
              <Check
                className='stroke-primary size'
                aria-hidden='true'
                strokeWidth={2}
              />
            </div>
            <div
              className={cn(
                'absolute transition-all',
                copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
              )}
            >
              <Copy
                aria-hidden='true'
                strokeWidth={2}
                className='size-3'
              />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Click to copy</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

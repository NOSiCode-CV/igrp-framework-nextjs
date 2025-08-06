import Link from 'next/link';
import { LucideProps } from 'lucide-react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ButtonTooltipProps {
  href: string;
  icon: React.ElementType<LucideProps>;
  label: string;
  className?: string;
}
// TODO: aria accessibility
// TODO: messages
export function ButtonTooltip({ href, icon: Icon, label, className }: ButtonTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50',
              className,
            )}
            asChild
          >
            <Link href={href}>
              <Icon strokeWidth={2} />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

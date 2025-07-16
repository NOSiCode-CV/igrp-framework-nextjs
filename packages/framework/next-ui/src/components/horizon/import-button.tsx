import { TooltipWrapper } from '../horizon/tooltip-wrapper';
import { Button } from '../primitives/button';
import { cn } from '../../lib/utils';
import { FileCode } from 'lucide-react';

interface ImportButtonProps extends React.ComponentProps<typeof Button> {}

export function ImportButton({ className, ...props }: ImportButtonProps) {
  return (
    <TooltipWrapper label="Import CSS variables" asChild>
      <Button variant="ghost" size="sm" className={cn(className)} {...props}>
        <FileCode className="size-3.5" />
        <span className="hidden text-sm md:block">Import</span>
      </Button>
    </TooltipWrapper>
  );
}

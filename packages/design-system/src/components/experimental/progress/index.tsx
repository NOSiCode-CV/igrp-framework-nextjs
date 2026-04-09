import * as React from 'react';
import { Progress } from '../../primitives/progress';
import { cn } from '../../../lib/utils';

interface ProgressIGRPProps {
  className?: string;
}

export function ProgressIGRP({ className }: ProgressIGRPProps) {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return <Progress value={progress} className={cn(className || 'w-[60%]')} />;
}

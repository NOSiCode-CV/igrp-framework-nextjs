import * as React from 'react';
import { Progress } from '@/components/primitives/progress';

interface ProgressIGRPProps {
  className?: string;
}

export function ProgressIGRP({ className }: ProgressIGRPProps) {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Progress
      value={progress}
      className={className || 'w-[60%]'}
    />
  );
}

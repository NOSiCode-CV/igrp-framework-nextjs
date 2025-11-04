import { useId } from 'react';
import { Separator } from '../primitives/separator';

interface IGRPSeparatorProps extends React.ComponentProps<typeof Separator> {
  name?: string;
  id?: string;
}

function IGRPSeparator({ 
  name,
  id,
  ...props 
}: IGRPSeparatorProps) {
  const _id = useId();
  const ref = name ?? id ?? _id
  
  return <Separator id={ref} {...props} />;
}

export { IGRPSeparator };

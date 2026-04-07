import { useId } from 'react';

import {
  Card,
  CardAction as IGRPCardAction,
  CardContent as IGRPCardContent,
  CardDescription as IGRPCardDescription,
  CardFooter as IGRPCardFooter,
  CardHeader as IGRPCardHeader,
  CardTitle as IGRPCardTitle,
} from '../primitives/card';
import { cn } from '../../lib/utils';

/**
 * Props for the IGRPCard component.
 * @see IGRPCard
 */
interface CardProps {
  /** HTML name attribute. */
  name?: string;
}

/** IGRPCard props extending the primitive Card. */
interface IGRPCardProps extends React.ComponentProps<typeof Card>, CardProps {}

/**
 * Card container for grouping related content.
 * Use IGRPCardHeader, IGRPCardTitle, IGRPCardContent, IGRPCardFooter for structure.
 */
function IGRPCard({ className, id, name, ...props }: IGRPCardProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  return <Card className={cn(className)} id={ref} {...props} />;
}

export {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardAction,
  IGRPCardContent,
  IGRPCardFooter,
};

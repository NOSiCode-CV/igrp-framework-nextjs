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

interface CardProps {
  name?: string;
}

interface IGRPCardProps extends React.ComponentProps<typeof Card>, CardProps {}

function IGRPCard({ className, id, ...props }: IGRPCardProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  return <Card className={className} id={ref} {...props} />;
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

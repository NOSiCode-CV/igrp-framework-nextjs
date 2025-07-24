import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/horizon/card';
import { cn } from '@/lib/utils';

interface IGRPCardProps extends React.ComponentProps<typeof Card> {
  name?: string;
}

function IGRPCard({ className, name, ...props }: IGRPCardProps) {
  return (
    <Card
      className={className}
      id={name}
      {...props}
    />
  );
}

function IGRPCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={className}
      {...props}
    />
  );
}

function IGRPCardTitle({ className, ...props }: React.ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={className}
      {...props}
    />
  );
}

function IGRPCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>) {
  return (
    <CardDescription
      className={className}
      {...props}
    />
  );
}

function IGRPCardAction({ className, ...props }: React.ComponentProps<typeof CardAction>) {
  return (
    <CardAction
      className={className}
      {...props}
    />
  );
}

function IGRPCardContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent
      className={cn('py-3', className)}
      {...props}
    />
  );
}

function IGRPCardFooter({ className, ...props }: React.ComponentProps<typeof CardFooter>) {
  return (
    <CardFooter
      className={className}
      {...props}
    />
  );
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

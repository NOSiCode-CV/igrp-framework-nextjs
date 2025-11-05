'use client';

import { useId } from 'react';

import { cn } from '../../lib/utils';
import { igrpCleanString } from '../../lib/strings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../primitives/card';
import { Separator } from '../primitives/separator';
import { IGRPCopyTo } from './copy-to';

interface IGRPCardDetailsItemProps {
  label: string;
  content: React.ReactNode;
  showCopyTo?: boolean;
}

interface IGRPCardDetailsProps extends React.ComponentProps<typeof Card> {
  title?: string;
  description?: string;
  contentClassName?: string;
  items: IGRPCardDetailsItemProps[];
}

function IGRPCardDetails({
  title,
  description,
  contentClassName,
  items,
  id,
  className,
  ...props
}: IGRPCardDetailsProps) {
  const _id = useId();
  const ref = id ?? _id;

  if (items.length === 0) {
    return null;
  }

  return (
    <Card
      id={ref}
      className={cn(
        'overflow-hidden gap-3 animate-fade-in motion-reduce:animate-none',
        'transition-all duration-200 hover:shadow-lg hover:border-primary/20',
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader className="pb-4">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          <Separator className="mt-4" />
        </CardHeader>
      )}
      <CardContent
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm',
          contentClassName,
        )}
      >
        {items.map((item) => {
          const key = igrpCleanString(item.label);

          return (
            <div key={key} className="flex items-center gap-4">
              <div>
                <h3 className="font-normal text-muted-foreground">{item.label}</h3>
                {typeof item.content === 'string' ? (
                  <span className="font-medium">{item.content}</span>
                ) : (
                  item.content
                )}
              </div>
              {item.showCopyTo && <IGRPCopyTo value={item.content as string} />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { IGRPCardDetails, type IGRPCardDetailsProps, type IGRPCardDetailsItemProps };

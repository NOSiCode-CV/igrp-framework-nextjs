'use client';

import { useId } from 'react';

import { cn } from '../../lib/utils';
import { igrpCleanString } from '../../lib/strings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { IGRPCopyTo } from './copy-to';

/**
 * Single detail item (label + content).
 * @see IGRPCardDetails
 */
interface IGRPCardDetailsItemProps {
  /** Field label. */
  label: string;
  /** Field content. */
  content: React.ReactNode;
  /** Show copy-to-clipboard button. */
  showCopyTo?: boolean;
}

/**
 * Props for the IGRPCardDetails component.
 * @see IGRPCardDetails
 */
interface IGRPCardDetailsProps extends React.ComponentProps<typeof Card> {
  /** Card title. */
  title?: string;
  /** Card description. */
  description?: string;
  /** CSS classes for the content grid. */
  contentClassName?: string;
  /** Detail items. */
  items: IGRPCardDetailsItemProps[];
}

/**
 * Card displaying labeled detail items in a grid, with optional copy button.
 */
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
        className,
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader className={cn('pb-4')}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          <Separator className={cn('mt-4')} />
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
            <div key={key} className={cn('flex items-center gap-4')}>
              <div>
                <h3 className={cn('font-normal text-muted-foreground')}>{item.label}</h3>
                {typeof item.content === 'string' ? (
                  <span className={cn('font-medium')}>{item.content}</span>
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

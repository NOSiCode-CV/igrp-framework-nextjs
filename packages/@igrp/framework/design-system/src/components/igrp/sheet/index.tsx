'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/primitives/sheet';
import { Button } from '@/components/horizon/button';

import { cn } from '@/lib/utils';
import type React from 'react';

type IGRPSheetSideProps = 'top' | 'right' | 'bottom' | 'left';

interface IGRPSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  labelTrigger?: string;
  children: React.ReactNode;
  side?: IGRPSheetSideProps;
  className?: string;
  title?: string;
  description?: string;
  openSheet: boolean;
  useTrigger: boolean;
}

function IGRPSheet({
  labelTrigger,
  openSheet,
  useTrigger = true,
  side = 'right',
  title,
  description,
  className,
  children,
}: IGRPSheetProps) {
  return (
    <Sheet open={openSheet}>
      {useTrigger && (
        <SheetTrigger asChild>
          <Button variant='default'>{labelTrigger}</Button>
        </SheetTrigger>
      )}
      <SheetContent
        side={side}
        className={cn('w-full sm:w-lg sm:max-w-[75vw] lg:max-w-4xl', className)}
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        {children}
      </SheetContent>
    </Sheet>
  );
}

export { IGRPSheet, type IGRPSheetProps };

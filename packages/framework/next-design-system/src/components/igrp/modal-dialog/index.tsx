'use client';

import { Children, isValidElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Dialog as IGRPModalDialog,
  DialogClose as IGRPModalDialogClose,
  DialogDescription as IGRPModalDialogDescription,
  DialogTitle as IGRPModalDialogTitle,
  DialogTrigger as IGRPModalDialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/horizon/dialog';
import { cn } from '@/lib/utils';

const igrpModalDialogContentVariants = cva('w-full sm:max-w-lg max-h-[90vh] overflow-auto', {
  variants: {
    size: {
      sm: 'sm:max-w-md',
      md: 'sm:max-w-lg',
      lg: 'sm:max-w-2xl',
      xl: 'sm:max-w-4xl ',
      full: 'sm:max-w-[95vw] h-[95vh]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface IGRPModalDialogContentProps
  extends React.ComponentProps<typeof DialogContent>,
    VariantProps<typeof igrpModalDialogContentVariants> {
  contentClassName?: string;
}

function IGRPModalDialogContent({
  className,
  size,
  children,
  contentClassName,
  ...props
}: IGRPModalDialogContentProps) {
  const hasStickyHeader = Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      child.type === IGRPModalDialogHeader &&
      (child.props as IGRPModalDialogHeaderProps).stickyHeader === true,
  );

  const hasStickyFooter = Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      child.type === IGRPModalDialogFooter &&
      (child.props as IGRPModalDialogFooterProps).stickyFooter === true,
  );

  return (
    <DialogContent
      className={cn(
        igrpModalDialogContentVariants({ size }),
        hasStickyHeader && 'pt-0',
        hasStickyFooter && 'pb-0',
        className,
      )}
      {...props}
    >
      <div className={cn('flex flex-col gap-4', contentClassName)}>{children}</div>
    </DialogContent>
  );
}

interface IGRPModalDialogHeaderProps extends React.ComponentProps<typeof DialogHeader> {
  stickyHeader?: boolean;
}

function IGRPModalDialogHeader({ className, stickyHeader, ...props }: IGRPModalDialogHeaderProps) {
  return (
    <DialogHeader
      className={cn(
        stickyHeader &&
          'sticky top-0 z-[5] backdrop-blur-2xl bg-white/80 dark:bg-zinc-900/60 border-b py-3',
        className,
      )}
      {...props}
    />
  );
}

interface IGRPModalDialogFooterProps extends React.ComponentProps<typeof DialogFooter> {
  stickyFooter?: boolean;
}

function IGRPModalDialogFooter({ className, stickyFooter, ...props }: IGRPModalDialogFooterProps) {
  return (
    <DialogFooter
      className={cn(
        'flex-col sm:justify-start',
        stickyFooter &&
          'sticky bottom-0 z-[5] backdrop-blur-2xl bg-white/80 dark:bg-zinc-900/60 py-3',
        className,
      )}
      {...props}
    />
  );
}

export {
  IGRPModalDialog,
  IGRPModalDialogClose,
  IGRPModalDialogContent,
  type IGRPModalDialogContentProps,
  IGRPModalDialogDescription,
  IGRPModalDialogFooter,
  type IGRPModalDialogFooterProps,
  IGRPModalDialogHeader,
  type IGRPModalDialogHeaderProps,
  IGRPModalDialogTitle,
  IGRPModalDialogTrigger,
  // eslint-disable-next-line react-refresh/only-export-components
  igrpModalDialogContentVariants,
};

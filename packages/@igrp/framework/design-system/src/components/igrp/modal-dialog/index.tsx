/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/horizon/dialog';
import { ScrollArea } from '@/components/primitives/scroll-area';
import { cn } from '@/lib/utils';

const igrpModalDialogContentVariants = cva(
  'w-full flex flex-col gap-0 p-4 pr-0 sm:max-w-lg max-h-[80vh] overflow-auto',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl ',
        full: 'max-w-[95vw] h-[95vh]',
      },
      defaultVariants: {
        size: 'lg',
      },
    },
  },
);

function IGRPModalDialog({ ...props }: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

function IGRPModalDialogTrigger({ ...props }: React.ComponentProps<typeof DialogTrigger>) {
  return <DialogTrigger {...props} />;
}

function IGRPModalDialogClose({ ...props }: React.ComponentProps<typeof DialogClose>) {
  return <DialogClose {...props} />;
}

interface IGRPModalDialogContentProps
  extends React.ComponentProps<typeof DialogContent>,
    VariantProps<typeof igrpModalDialogContentVariants> {}

function IGRPModalDialogContent({
  className,
  size,
  children,
  ...props
}: IGRPModalDialogContentProps) {
  return (
    <DialogContent
      className={cn(igrpModalDialogContentVariants({ size }), className)}
      {...props}
    >
      <ScrollArea className='flex max-h-full flex-col gap-4 overflow-hidden'>{children}</ScrollArea>
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
        'pl-4',
        stickyHeader &&
          'sticky top-0 z-5 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border-b pb-2',
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
        'pl-4 py-3 flex-col sm:justify-start',
        stickyFooter &&
          'sticky bottom-0 z-10 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border-t',
        className,
      )}
      {...props}
    />
  );
}

function IGRPModalDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  return (
    <DialogTitle
      className={className}
      {...props}
    />
  );
}

function IGRPModalDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  return (
    <DialogDescription
      className={className}
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
  igrpModalDialogContentVariants,
};

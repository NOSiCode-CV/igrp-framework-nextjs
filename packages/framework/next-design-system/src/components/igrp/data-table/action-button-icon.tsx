import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/horizon/alert-dialog';
import { Button, buttonVariants } from '@/components/horizon/button';
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
import { IGRPButton } from '@/components/igrp/button';
import { IGRPIcon } from '@/components/igrp/icon';
import { type IGRPDataTableDialogProps, type IGRPDataTableLinkProps } from './row-actions';

import { cn } from '@/lib/utils';
import { igrpModalDialogContentVariants } from '../modal-dialog';

function IGRPDataTableButtonAlert({
  labelTrigger,
  classNameTrigger,
  className,
  icon = 'ArrowRight',
  iconClassName,
  children,
  variant = 'default',
  modalTitle,
  showCancel = true,
  labelCancel = 'Cancel',
  classNameCancel,
  variantCancel,
  showConfirm = true,
  labelConfirm = 'Confirm',
  classNameConfirm,
  variantConfirm,
  onClickConfirm,
}: IGRPDataTableDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <IGRPButton
          variant={variant}
          size='icon'
          className={cn('h-8 w-8 flex justify-center items-center', classNameTrigger)}
          title={labelTrigger}
          iconName={icon}
          iconClassName={iconClassName}
        />
      </AlertDialogTrigger>
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{modalTitle}</AlertDialogTitle>

          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>

        {(showCancel || showConfirm) && (
          <AlertDialogFooter>
            {showCancel && (
              <AlertDialogCancel
                className={cn(
                  buttonVariants({ variant: variantCancel }),
                  'cursor-pointer',
                  classNameCancel,
                )}
              >
                {labelCancel}
              </AlertDialogCancel>
            )}
            {showConfirm && (
              <AlertDialogAction
                onClick={onClickConfirm}
                className={cn(
                  buttonVariants({ variant: variantConfirm }),
                  'cursor-pointer',
                  classNameConfirm,
                )}
              >
                {labelConfirm}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IGRPDataTableButtonLink({
  labelTrigger,
  action,
  icon = 'ArrowRight',
  variant = 'default',
  href,
  className,
}: IGRPDataTableLinkProps) {
  return href ? (
    <Button
      variant={variant}
      size='icon'
      className={cn('cursor-pointer', className)}
      asChild
    >
      <Link
        href={href}
        className='flex items-center'
      >
        <IGRPIcon iconName={icon} />
        <span className='sr-only'>{labelTrigger}</span>
      </Link>
    </Button>
  ) : (
    <IGRPButton
      variant={variant}
      size='icon'
      className={className}
      onClick={action}
      iconName={icon}
      iconClassName='size-4'
      title={labelTrigger}
    />
  );
}

function IGRPDataTableButtonModal({
  labelTrigger,
  className,
  icon = 'ArrowRight',
  children,
  variant = 'default',
  modalTitle = '',
  showCancel = true,
  labelCancel = 'Cancel',
  classNameCancel,
  variantCancel,
  showConfirm = true,
  labelConfirm = 'Confirm',
  classNameConfirm,
  variantConfirm,
  onClickConfirm,
  size = 'lg',
}: IGRPDataTableDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <IGRPButton
          variant={variant}
          size='icon'
          className='h-8 w-8 flex justify-center items-center'
          title={labelTrigger}
          iconName={icon}
        />
      </DialogTrigger>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 p-0 sm:max-h-[min(640px,90vh)] [&>button:last-child]:top-3.5',
          igrpModalDialogContentVariants({ size }),
          className,
        )}
      >
        <DialogHeader className='contents space-y-0 text-left'>
          <DialogTitle className={cn(modalTitle && 'border-b px-6 py-4 text-base')}>
            {modalTitle}
          </DialogTitle>

          <div className={cn('overflow-y-auto', !modalTitle && 'mt-4')}>
            <DialogDescription asChild>{children}</DialogDescription>

            {(showCancel || showConfirm) && (
              <DialogFooter className='px-6 pb-6 sm:justify-start mt-4'>
                <DialogClose
                  className={cn(
                    buttonVariants({ variant: variantCancel }),
                    'cursor-pointer',
                    classNameCancel,
                  )}
                >
                  {labelCancel}
                </DialogClose>

                <IGRPButton
                  variant={variantConfirm}
                  className={classNameConfirm}
                  onClick={onClickConfirm}
                >
                  {labelConfirm}
                </IGRPButton>
              </DialogFooter>
            )}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export { IGRPDataTableButtonAlert, IGRPDataTableButtonLink, IGRPDataTableButtonModal };

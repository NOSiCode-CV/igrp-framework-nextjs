'use client';

import { useContext, type ReactElement } from 'react';
import Link from 'next/link';

import { cn } from '../../../lib/utils';
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
} from '../../ui/alert-dialog';
import { Button, buttonVariants } from '../../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { IGRPButton } from '../button';
import { IGRPIcon } from '../icon';
import { igrpModalDialogContentVariants } from '../modal-dialog';
import { type IGRPDataTableDialogProps, type IGRPDataTableLinkProps } from './row-actions';
import { IGRPDataTableTooltipContext, IGRPDataTableTooltipProvider } from './tooltip-provider';

/** @internal Wraps action button with tooltip when label is provided. */
function IGRPDataTableActionTooltip({
  label,
  children,
  tooltipSide = 'top',
  tooltipAlign = 'center',
  tooltipClassName,
  tooltipSideOffset = 6,
  tooltipDelayDuration = 0,
}: {
  label?: string;
  children: ReactElement;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  tooltipAlign?: 'center' | 'start' | 'end';
  tooltipClassName?: string;
  tooltipSideOffset?: number;
  tooltipDelayDuration?: number;
}) {
  const hasProvider = useContext(IGRPDataTableTooltipContext);

  if (!label) return children;

  const tooltipNode = (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        className={tooltipClassName}
        sideOffset={tooltipSideOffset}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );

  if (hasProvider) return tooltipNode;

  return (
    <IGRPDataTableTooltipProvider delayDuration={tooltipDelayDuration}>
      {tooltipNode}
    </IGRPDataTableTooltipProvider>
  );
}

/** Icon button that opens an alert dialog. */
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
  tooltipSide,
  tooltipAlign,
  tooltipClassName,
  tooltipSideOffset,
  tooltipDelayDuration,
}: IGRPDataTableDialogProps) {
  const tooltipProps = {
    label: labelTrigger,
    tooltipSide,
    tooltipAlign,
    tooltipClassName,
    tooltipSideOffset,
    tooltipDelayDuration,
  };

  return (
    <AlertDialog>
      <IGRPDataTableActionTooltip {...tooltipProps}>
        <AlertDialogTrigger asChild>
          <IGRPButton
            variant={variant}
            size="icon-sm"
            className={cn('size-7 flex justify-center items-center', classNameTrigger)}
            iconName={icon}
            iconClassName={iconClassName}
            aria-label={labelTrigger}
          />
        </AlertDialogTrigger>
      </IGRPDataTableActionTooltip>
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

/** Icon button that navigates (link) or triggers an action. */
function IGRPDataTableButtonLink({
  labelTrigger,
  action,
  icon = 'ArrowRight',
  variant = 'default',
  href,
  className,
  tooltipSide,
  tooltipAlign,
  tooltipClassName,
  tooltipSideOffset,
  tooltipDelayDuration,
}: IGRPDataTableLinkProps) {
  if (!href && !action) return null;

  const tooltipProps = {
    label: labelTrigger,
    tooltipSide,
    tooltipAlign,
    tooltipClassName,
    tooltipSideOffset,
    tooltipDelayDuration,
  };

  return href ? (
    <IGRPDataTableActionTooltip {...tooltipProps}>
      <Button variant={variant} size="icon-sm" className={cn('h-8 w-8', className)} asChild>
        <Link href={href} className={cn('flex items-center')} aria-label={labelTrigger}>
          <IGRPIcon iconName={icon} />
          <span className={cn('sr-only')}>{labelTrigger}</span>
        </Link>
      </Button>
    </IGRPDataTableActionTooltip>
  ) : (
    <IGRPDataTableActionTooltip {...tooltipProps}>
      <IGRPButton
        variant={variant}
        size="icon-sm"
        className={className}
        onClick={action}
        iconName={icon}
        iconClassName="size-4"
        aria-label={labelTrigger}
      />
    </IGRPDataTableActionTooltip>
  );
}

/** Icon button that opens a modal dialog. */
function IGRPDataTableButtonModal({
  labelTrigger,
  className,
  classNameTrigger,
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
  tooltipSide,
  tooltipAlign,
  tooltipClassName,
  tooltipSideOffset,
  tooltipDelayDuration,
}: IGRPDataTableDialogProps) {
  const tooltipProps = {
    label: labelTrigger,
    tooltipSide,
    tooltipAlign,
    tooltipClassName,
    tooltipSideOffset,
    tooltipDelayDuration,
  };

  return (
    <Dialog>
      <IGRPDataTableActionTooltip {...tooltipProps}>
        <DialogTrigger asChild>
          <IGRPButton
            variant={variant}
            size="icon-sm"
            className={cn('size-7 flex justify-center items-center', classNameTrigger)}
            iconName={icon}
            aria-label={labelTrigger}
          />
        </DialogTrigger>
      </IGRPDataTableActionTooltip>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 p-0 sm:max-h-[min(640px,90vh)] [&>button:last-child]:top-3.5',
          igrpModalDialogContentVariants({ size }),
          className,
        )}
      >
        <DialogHeader className={cn('contents space-y-0 text-left')}>
          <DialogTitle className={cn(modalTitle && 'border-b px-6 py-4 text-base')}>
            {modalTitle}
          </DialogTitle>

          <div className={cn('overflow-y-auto', !modalTitle && 'mt-4')}>
            <DialogDescription asChild>{children}</DialogDescription>

            {(showCancel || showConfirm) && (
              <DialogFooter className={cn('px-6 pb-6 sm:justify-start mt-4')}>
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

export {
  IGRPDataTableButtonAlert,
  IGRPDataTableButtonLink,
  IGRPDataTableButtonModal,
};

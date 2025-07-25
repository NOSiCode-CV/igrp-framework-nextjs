import { useState } from 'react';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../primitives/dropdown-menu';
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
} from '../../horizon/alert-dialog';
import { buttonVariants } from '../../horizon/button';
import { IGRPIcon } from '../../igrp/icon';
import { cn } from '../../../lib/utils';
import { type IGRPPlacementProps } from '../../../types/globals';
import { type IGRPDataTableDialogProps, type IGRPDataTableLinkProps } from './row-actions';

interface IGRPDataTableDropdownProps {
  showIcon?: boolean;
  iconPlacement?: IGRPPlacementProps;
}

interface IGRPDataTableDropdownMenuDialogProps
  extends Omit<IGRPDataTableDialogProps, 'variant'>,
    IGRPDataTableDropdownProps {}

interface IGRPDataTableDropdownMenuLinkProps
  extends Omit<IGRPDataTableLinkProps, 'variant'>,
    IGRPDataTableDropdownProps {}

function IGRPDataTableDropdownMenuAlert({
  labelTrigger,
  className,
  icon = 'AlertCircle',
  iconClassName,
  children = 'Insert your content here...',
  modalTitle = 'This is an Alert Dialog, Insert a Title...',
  showCancel = true,
  labelCancel = 'Cancel',
  classNameCancel,
  variantCancel = 'outline',
  showConfirm = true,
  labelConfirm = 'Confirm',
  classNameConfirm,
  variantConfirm = 'default',
  onClickConfirm,
  showIcon = true,
  iconPlacement = 'start',
  classNameItem,
}: IGRPDataTableDropdownMenuDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    if (onClickConfirm) {
      onClickConfirm();
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <IGRPDataTableDropdownMenuItem
          showIcon={showIcon}
          iconPlacement={iconPlacement}
          iconClassName={iconClassName}
          icon={icon}
          labelTrigger={labelTrigger}
          classNameItem={classNameItem}
        />
      </AlertDialogTrigger>
      <AlertDialogContent className={cn('max-w-md', className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{modalTitle}</AlertDialogTitle>
          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>

        {(showCancel || showConfirm) && (
          <AlertDialogFooter>
            {showCancel && (
              <AlertDialogCancel
                onClick={handleCancel}
                className={cn(buttonVariants({ variant: variantCancel }), classNameCancel)}
              >
                {labelCancel}
              </AlertDialogCancel>
            )}
            {showConfirm && (
              <AlertDialogAction
                onClick={handleConfirm}
                className={cn(buttonVariants({ variant: variantConfirm }), classNameConfirm)}
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

function IGRPDataTableDropdownMenuLink({
  labelTrigger,
  action,
  icon = 'ArrowRight',
  href,
  iconPlacement = 'start',
  iconClassName,
  showIcon = false,
  classNameItem,
}: IGRPDataTableDropdownMenuLinkProps) {
  const iconClass = iconPlacement === 'end' ? 'flex-row-reverse' : '';
  const customClss = cn('flex items-center justify-between gap-2 w-full', iconClass, classNameItem);

  const handlerAction = () => {
    if (typeof action === 'function') {
      action();
    } else {
      console.warn('No action function provided');
    }
  };

  const renderContent = () => (
    <>
      {showIcon && (
        <IGRPIcon iconName={icon} className={cn('text-muted-foreground', iconClassName)} />
      )}
      <span>{labelTrigger}</span>
    </>
  );

  return href ? (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
      <Link href={href} className={customClss}>
        {renderContent()}
      </Link>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem className={customClss} onSelect={handlerAction}>
      {renderContent()}
    </DropdownMenuItem>
  );
}

function IGRPDataTableDropdownMenuCustom({
  labelTrigger,
  action,
  icon = 'ArrowRight',
  iconPlacement = 'start',
  iconClassName,
  showIcon = false,
  classNameItem,
}: Omit<IGRPDataTableDropdownMenuLinkProps, 'href'>) {
  const iconClass = iconPlacement === 'end' ? 'flex-row-reverse' : '';

  const handlerAction = () => {
    if (typeof action === 'function') {
      action();
    } else {
      console.warn('No action function provided');
    }
  };

  return (
    <DropdownMenuItem
      className={cn('flex items-center justify-between gap-2 w-full', iconClass, classNameItem)}
      onSelect={handlerAction}
    >
      {showIcon && (
        <IGRPIcon iconName={icon} className={cn('text-muted-foreground', iconClassName)} />
      )}
      <span>{labelTrigger}</span>
    </DropdownMenuItem>
  );
}

interface IGRPDataTableDropdownMenuItemProps
  extends IGRPDataTableDropdownProps,
    Pick<IGRPDataTableDropdownMenuDialogProps, 'icon' | 'labelTrigger' | 'iconClassName'> {
  onClick?: () => void;
  classNameItem?: string;
}

function IGRPDataTableDropdownMenuItem({
  showIcon = true,
  iconPlacement = 'start',
  iconClassName,
  icon = 'ArrowRight',
  labelTrigger,
  onClick,
  classNameItem,
}: IGRPDataTableDropdownMenuItemProps) {
  const iconClass = iconPlacement === 'end' ? 'flex-row-reverse' : '';

  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn('flex items-center justify-between w-full gap-2', iconClass, classNameItem)}
      onSelect={(e) => {
        e.preventDefault();
      }}
    >
      {showIcon && (
        <IGRPIcon iconName={icon} className={cn('text-muted-foreground', iconClassName)} />
      )}
      <span>{labelTrigger}</span>
    </DropdownMenuItem>
  );
}

type IGRPDataTableActionDropdown =
  | {
      component: typeof IGRPDataTableDropdownMenuLink;
      props: IGRPDataTableDropdownMenuLinkProps;
    }
  | {
      component: typeof IGRPDataTableDropdownMenuAlert;
      props: IGRPDataTableDropdownMenuDialogProps;
    };

function IGRPDataTableDropdownMenu({ items }: { items: IGRPDataTableActionDropdown[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center" aria-label="Open actions">
        <IGRPIcon iconName="Ellipsis" className="shadow-none" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map(({ component: Component, props }, index) => (
          <Component key={index} {...props} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  type IGRPDataTableDropdownProps,
  type IGRPDataTableActionDropdown,
  type IGRPDataTableDropdownMenuDialogProps,
  type IGRPDataTableDropdownMenuLinkProps,
  IGRPDataTableDropdownMenuAlert,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenu,
};

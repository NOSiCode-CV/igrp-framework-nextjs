'use client';

import { useState } from 'react';
import Link from 'next/link';

import { cn } from '../../../lib/utils';
import { type IGRPPlacementProps } from '../../../types';

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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { buttonVariants } from '../../ui/button';
import { IGRPIcon, type IGRPIconName } from '../icon';
import { type IGRPDataTableDialogProps, type IGRPDataTableLinkProps } from './row-actions';

/**
 * Base props for dropdown menu items.
 * @see IGRPDataTableDropdownMenuDialogProps
 * @see IGRPDataTableDropdownMenuLinkProps
 */
interface IGRPDataTableDropdownProps {
  /** Show icon in menu item. */
  showIcon?: boolean;
  /** Icon position. */
  iconPlacement?: IGRPPlacementProps;
  /** Menu item variant. */
  variant?: React.ComponentProps<typeof DropdownMenuItem>['variant'];
}

/** @internal */
interface IGRPDataTableDropdownMenuDialogProps
  extends Omit<IGRPDataTableDialogProps, 'variant'>, IGRPDataTableDropdownProps {}

/** @internal */
interface IGRPDataTableDropdownMenuLinkProps
  extends Omit<IGRPDataTableLinkProps, 'variant'>, IGRPDataTableDropdownProps {}

/** Dropdown menu item that opens an alert dialog. */
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

/** Dropdown menu item that navigates or triggers an action. */
function IGRPDataTableDropdownMenuLink({
  labelTrigger,
  action,
  icon = 'ArrowRight',
  href,
  iconPlacement = 'start',
  iconClassName,
  showIcon = false,
  classNameItem,
  variant = 'default',
}: IGRPDataTableDropdownMenuLinkProps) {
  const iconClass = iconPlacement === 'end' ? 'flex-row-reverse' : '';
  const customClss = cn('flex items-center gap-2 w-full', iconClass, classNameItem);

  const RenderContent = (
    <>
      {showIcon && (
        <IGRPIcon iconName={icon} className={cn('text-muted-foreground', iconClassName)} />
      )}
      <span>{labelTrigger}</span>
    </>
  );

  if (href) {
    return (
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild variant={variant}>
        <Link href={href} className={customClss}>
          {RenderContent}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      className={customClss}
      variant={variant}
      onSelect={() => {
        if (!action) return;
        action();
      }}
    >
      {RenderContent}
    </DropdownMenuItem>
  );
}

type IGRPDataTableDropdownMenuCustomProps = Omit<IGRPDataTableDropdownMenuLinkProps, 'href'>;

function IGRPDataTableDropdownMenuCustom({
  labelTrigger,
  action,
  icon = 'ArrowRight',
  iconPlacement = 'start',
  iconClassName,
  showIcon = false,
  classNameItem,
  variant,
}: IGRPDataTableDropdownMenuCustomProps) {
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
      className={cn('flex items-center gap-2 w-full', iconClass, classNameItem)}
      onSelect={handlerAction}
      variant={variant}
    >
      {showIcon && (
        <IGRPIcon iconName={icon} className={cn('text-muted-foreground', iconClassName)} />
      )}
      <span>{labelTrigger}</span>
    </DropdownMenuItem>
  );
}

interface IGRPDataTableDropdownMenuItemProps
  extends
    IGRPDataTableDropdownProps,
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
  variant,
}: IGRPDataTableDropdownMenuItemProps) {
  const iconClass = iconPlacement === 'end' ? 'flex-row-reverse' : '';

  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn('flex items-center w-full gap-2', iconClass, classNameItem)}
      onSelect={(e) => {
        e.preventDefault();
      }}
      variant={variant}
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
      /** Stable key for list rendering; use when items may be reordered or filtered. */
      id?: string;
      component: typeof IGRPDataTableDropdownMenuLink;
      props: IGRPDataTableDropdownMenuLinkProps;
    }
  | {
      id?: string;
      component: typeof IGRPDataTableDropdownMenuAlert;
      props: IGRPDataTableDropdownMenuDialogProps;
    }
  | {
      id?: string;
      component: typeof IGRPDataTableDropdownMenuCustom;
      props: IGRPDataTableDropdownMenuDialogProps;
    };

type IGRPDataTableDropdownMenuProps = {
  items: IGRPDataTableActionDropdown[];
  iconName?: IGRPIconName | string;
};

function IGRPDataTableDropdownMenu({
  items,
  iconName = 'Ellipsis',
}: IGRPDataTableDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn('flex items-center justify-center')}
        aria-label="Open actions"
      >
        <IGRPIcon iconName={iconName} className={cn('shadow-none')} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => {
          const { component: Component, props } = item;
          const key =
            item.id ??
            props.labelTrigger ??
            ('href' in props ? props.href : undefined) ??
            ('modalTitle' in props ? props.modalTitle : undefined) ??
            `action-${index}`;
          return <Component key={key} {...props} />;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  type IGRPDataTableDropdownProps,
  type IGRPDataTableActionDropdown,
  type IGRPDataTableDropdownMenuDialogProps,
  type IGRPDataTableDropdownMenuLinkProps,
  type IGRPDataTableDropdownMenuProps,
  type IGRPDataTableDropdownMenuCustomProps,
  IGRPDataTableDropdownMenuAlert,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenu,
};

import { useState } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
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
import { buttonVariants } from '@/components/horizon/button';
import { IGRPIcon } from '@/components/igrp/icon';
import { type IGRPDataTableDialogProps, type IGRPDataTableLinkProps } from './row-actions';
import { cn } from '@/lib/utils';
import { type IGRPPlacementProps } from '@/types/globals';

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
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
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
        <IGRPIcon
          iconName={icon}
          className={cn('text-muted-foreground', iconClassName)}
        />
      )}
      <span>{labelTrigger}</span>
    </>
  );

  return href ? (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      asChild
    >
      <Link
        href={href}
        className={customClss}
      >
        {renderContent()}
      </Link>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem
      className={customClss}
      onSelect={handlerAction}
    >
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
        <IGRPIcon
          iconName={icon}
          className={cn('text-muted-foreground', iconClassName)}
        />
      )}
      <span>{labelTrigger}</span>
    </DropdownMenuItem>
  );
}

// function IGRPDataTableDropdownMenuModal({
//   labelTrigger,
//   className,
//   icon = 'ArrowRight',
//   children,
//   modalTitle = '',
//   showCancel = true,
//   labelCancel = 'Cancel',
//   classNameCancel,
//   variantCancel,
//   showConfirm = true,
//   labelConfirm = 'Confirm',
//   classNameConfirm,
//   variantConfirm,
//   onClickConfirm,
//   showIcon,
//   iconPlacement = 'start',
//   iconClassName,
//   size = 'lg',
// }: IGRPDataTableDropdownMenuDialogProps) {
//   return (
//     <Dialog modal>
//       <DialogTrigger asChild>
//         <IGRPDataTableDropdownMenuItem
//           showIcon={showIcon}
//           iconPlacement={iconPlacement}
//           iconClassName={iconClassName}
//           icon={icon}
//           labelTrigger={labelTrigger}
//         />
//       </DialogTrigger>
//       <DialogContent
//         className={cn(
//           'flex flex-col gap-0 p-0 sm:max-h-[min(640px,90vh)] [&>button:last-child]:top-3.5',
//           igrpModalDialogContentVariants({ size }),
//           className,
//         )}
//       >
//         <DialogHeader className='contents space-y-0 text-left'>
//           <DialogTitle className={cn(modalTitle && 'border-b px-6 py-4 text-base')}>
//             {modalTitle}
//           </DialogTitle>

//           <div className={cn('overflow-y-auto', !modalTitle && 'mt-4')}>
//             <DialogDescription asChild>{children}</DialogDescription>

//             {(showCancel || showConfirm) && (
//               <DialogFooter className='px-6 pb-6 sm:justify-start'>
//                 <DialogClose
//                   className={cn(buttonVariants({ variant: variantCancel }), classNameCancel)}
//                 >
//                   {labelCancel}
//                 </DialogClose>

//                 <IGRPButton
//                   variant={variantConfirm}
//                   className={classNameConfirm}
//                   onClick={onClickConfirm}
//                 >
//                   {labelConfirm}
//                 </IGRPButton>
//               </DialogFooter>
//             )}
//           </div>
//         </DialogHeader>
//       </DialogContent>
//     </Dialog>
//   );
// }

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
        <IGRPIcon
          iconName={icon}
          className={cn('text-muted-foreground', iconClassName)}
        />
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
// | {
//     component: typeof IGRPDataTableDropdownMenuModal;
//     props: IGRPDataTableDropdownMenuDialogProps;
//   };

function IGRPDataTableDropdownMenu({ items }: { items: IGRPDataTableActionDropdown[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className='flex items-center justify-center'
        aria-label='Open actions'
      >
        <IGRPIcon
          iconName='Ellipsis'
          className='shadow-none'
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {items.map(({ component: Component, props }, index) => (
          <Component
            key={index}
            {...props}
          />
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
  // IGRPDataTableDropdownMenuModal,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenu,
};

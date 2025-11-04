import { type ReactNode } from 'react';
import { type VariantProps } from 'class-variance-authority';

import { buttonVariants } from '../../primitives/button';
import { type IGRPIconName } from '../icon';
import type { igrpModalDialogContentVariants } from '../modal-dialog';
import { cn } from '../../../lib/utils';

interface IGRPDataTableActionProps {
  labelTrigger?: string;
  classNameTrigger?: string;
  icon?: IGRPIconName | string;
  iconClassName?: string;
  children?: ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  classNameItem?: string;
}

interface IGRPDataTableDialogProps
  extends IGRPDataTableActionProps,
    VariantProps<typeof igrpModalDialogContentVariants> {
  modalTitle?: string;
  showCancel?: boolean;
  labelCancel?: string;
  classNameCancel?: string;
  variantCancel?: VariantProps<typeof buttonVariants>['variant'];
  showConfirm?: boolean;
  labelConfirm?: string;
  classNameConfirm?: string;
  variantConfirm?: VariantProps<typeof buttonVariants>['variant'];
  onClickConfirm?: () => void;
  showStickyFooter?: boolean;
}

interface IGRPDataTableLinkProps
  extends Omit<IGRPDataTableActionProps, 'classNameTrigger' | 'children'> {
  href?: string;
  action?: () => void;
}

function IGRPDataTableRowAction({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('flex items-center', className)}>{children}</div>;
}

export {
  IGRPDataTableRowAction,
  type IGRPDataTableActionProps,
  type IGRPDataTableDialogProps,
  type IGRPDataTableLinkProps,
};

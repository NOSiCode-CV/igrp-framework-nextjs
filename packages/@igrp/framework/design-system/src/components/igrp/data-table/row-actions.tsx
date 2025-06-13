import { type ReactNode } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/horizon/button';
import { type IGRPIconName } from '@/components/igrp/icon';
import type { igrpModalDialogContentVariants } from '@/components/igrp/modal-dialog';

interface IGRPDataTableActionProps {
  labelTrigger: string;
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

function IGRPDataTableRowAction({ children }: { children: ReactNode }) {
  return <div className='flex items-center justify-end gap-2'>{children}</div>;
}

export {
  IGRPDataTableRowAction,
  type IGRPDataTableActionProps,
  type IGRPDataTableDialogProps,
  type IGRPDataTableLinkProps,
};

'use client';

import { type ReactNode } from 'react';
import { type VariantProps } from 'class-variance-authority';

import { buttonVariants } from '../../primitives/button';
import { type IGRPIconName } from '../icon';
import type { igrpModalDialogContentVariants } from '../modal-dialog';
import { cn } from '../../../lib/utils';
import { IGRPDataTableTooltipProvider } from './tooltip-provider';

/**
 * Base props for data table row actions (buttons, links, dialogs).
 * @see IGRPDataTableDialogProps
 * @see IGRPDataTableLinkProps
 */
interface IGRPDataTableActionProps {
  /** Tooltip/aria label. */
  labelTrigger?: string;
  /** CSS classes for the trigger button. */
  classNameTrigger?: string;
  /** Icon name. */
  icon?: IGRPIconName | string;
  /** CSS classes for the icon. */
  iconClassName?: string;
  /** Dialog/link content. */
  children?: ReactNode;
  /** Additional CSS classes. */
  className?: string;
  /** Button variant. */
  variant?: VariantProps<typeof buttonVariants>['variant'];
  /** CSS classes for dropdown item. */
  classNameItem?: string;
  /** Tooltip side. */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  /** Tooltip alignment. */
  tooltipAlign?: 'center' | 'start' | 'end';
  /** CSS classes for tooltip. */
  tooltipClassName?: string;
  /** Tooltip side offset. */
  tooltipSideOffset?: number;
  /** Tooltip delay in ms. */
  tooltipDelayDuration?: number;
}

/**
 * Props for dialog/alert row actions.
 * @see IGRPDataTableButtonAlert
 * @see IGRPDataTableButtonModal
 */
interface IGRPDataTableDialogProps
  extends IGRPDataTableActionProps, VariantProps<typeof igrpModalDialogContentVariants> {
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

/**
 * Props for link row actions.
 * @see IGRPDataTableButtonLink
 */
interface IGRPDataTableLinkProps extends Omit<
  IGRPDataTableActionProps,
  'classNameTrigger' | 'children'
> {
  href?: string;
  action?: () => void;
}

/**
 * Wrapper for row actions with tooltip provider.
 * Use IGRPDataTableButtonAlert, IGRPDataTableButtonLink, etc. as children.
 */
function IGRPDataTableRowAction({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <IGRPDataTableTooltipProvider>
      <div className={cn('flex items-center', className)}>{children}</div>
    </IGRPDataTableTooltipProvider>
  );
}

export {
  IGRPDataTableRowAction,
  type IGRPDataTableActionProps,
  type IGRPDataTableDialogProps,
  type IGRPDataTableLinkProps,
};

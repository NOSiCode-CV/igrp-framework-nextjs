'use client';

import { useId } from 'react';
import { Slot } from '@radix-ui/react-slot';

import { IGRPColors, type IGRPColorVariants } from '../../lib/colors';
import { igrpAlertIconMappings } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { type IGRPBaseAttributes, type IGRPPlacementProps } from '../../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../primitives/alert-dialog';
import { IGRPIcon, type IGRPIconName } from './icon';

/**
 * Props for the IGRPAlertDialog component.
 * @see IGRPAlertDialog
 */
interface IGRPAlertDialogProps extends Omit<IGRPBaseAttributes, 'ref'> {
  /** Whether the dialog is open. */
  open?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Color theme (e.g. 'primary', 'destructive'). */
  variant?: IGRPColorVariants;
  /** Additional CSS classes. */
  className?: string;
  /** Dialog title. */
  title?: string;
  /** CSS classes for the title. */
  titleClassName?: string;
  /** Dialog description. */
  description?: string;
  /** CSS classes for the description. */
  descriptionClassName?: string;
  /** Additional content. */
  children?: React.ReactNode;
  /** CSS classes for the footer. */
  footerClassName?: string;
  /** Label for the confirm/action button. */
  actionLabel?: string;
  /** Label for the cancel button. */
  cancelLabel?: string;
  /** Called when the action button is clicked. */
  onAction?: () => void;
  /** Called when the cancel button is clicked. */
  onCancel?: () => void;
  /** Whether to show the cancel button. */
  showCancel?: boolean;
  /** Props passed to the action button. */
  actionProps?: Partial<React.ComponentProps<typeof AlertDialogAction>>;
  /** Props passed to the cancel button. */
  cancelProps?: Partial<React.ComponentProps<typeof AlertDialogCancel>>;
  /** HTML id attribute. */
  id?: string;
}

/**
 * Alert dialog for confirmations and destructive actions.
 * Supports icon, title, description, and action/cancel buttons.
 */
function IGRPAlertDialog({
  open,
  onOpenChange,
  variant = 'primary',
  className,
  showIcon = true,
  iconName = 'AirVent',
  iconPlacement = 'start',
  title,
  titleClassName,
  description,
  descriptionClassName,
  children,
  footerClassName,
  actionLabel = 'Continue',
  cancelLabel = 'Cancel',
  onAction,
  onCancel,
  showCancel = true,
  actionProps,
  cancelProps,
  name,
  id,
}: IGRPAlertDialogProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const iconDefault = igrpAlertIconMappings[variant];
  const softColors = IGRPColors.soft[variant];
  const strongColors = IGRPColors.solid[variant];

  const handleAction = () => {
    if (onAction) onAction();
    if (onOpenChange) onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <Slot id={ref}>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className={cn(className)}>
          {showIcon && iconPlacement === 'center' && (
            <div className={cn('flex justify-center -mt-2')}>
              <AlertIcon
                iconName={iconName || iconDefault}
                bgClass={softColors.bg}
                textClass={softColors.text}
                iconPlacement={iconPlacement}
              />
            </div>
          )}
          <div
            className={cn(
              'flex',
              iconPlacement === 'start' && showIcon ? 'gap-2 items-start' : 'flex-col',
            )}
          >
            {showIcon && iconPlacement === 'start' && (
              <AlertIcon
                iconName={iconName || iconDefault}
                bgClass={softColors.bg}
                textClass={softColors.text}
                iconPlacement={iconPlacement}
              />
            )}
            <div className={cn('flex-1')}>
              <AlertDialogHeader className={cn(iconPlacement === 'center' && 'items-center')}>
                {title && (
                  <AlertDialogTitle className={cn(titleClassName)}>{title}</AlertDialogTitle>
                )}
                {description && (
                  <AlertDialogDescription className={cn(descriptionClassName)}>
                    {description}
                  </AlertDialogDescription>
                )}
              </AlertDialogHeader>
              {children && (
                <div className={cn('my-4', iconPlacement === 'center' && 'text-center')}>
                  {children}
                </div>
              )}

              <AlertDialogFooter
                className={cn(
                  'mt-3',
                  iconPlacement === 'center' && 'flex-col sm:flex-row',
                  footerClassName,
                )}
              >
                {showCancel && (
                  <AlertDialogCancel onClick={handleCancel} {...cancelProps}>
                    {cancelLabel}
                  </AlertDialogCancel>
                )}
                <AlertDialogAction
                  onClick={handleAction}
                  className={cn(
                    actionProps?.className || strongColors.bg + ' ' + strongColors.text,
                  )}
                  {...actionProps}
                >
                  {actionLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Slot>
  );
}

interface AlertIconProps {
  bgClass: string;
  textClass: string;
  iconPlacement: IGRPPlacementProps;
  iconName: IGRPIconName | string;
}

function AlertIcon({ bgClass, iconPlacement, iconName, textClass }: AlertIconProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full p-1 size-10',
        bgClass,
        iconPlacement === 'center' && 'mx-auto',
      )}
    >
      <IGRPIcon iconName={iconName} className={cn('size-6', textClass)} />
    </div>
  );
}

export { IGRPAlertDialog, type IGRPAlertDialogProps };

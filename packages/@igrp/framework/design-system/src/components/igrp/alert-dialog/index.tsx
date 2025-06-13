import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/horizon/alert-dialog';
import { type IGRPButtonProps } from '@/components/igrp/button';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { IGRPColors, type IGRPColorVariants } from '@/lib/colors';
import { igrpAlertIconMappings } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { type IGRPBaseAttributes } from '@/types/globals';

interface IGRPAlertDialogProps extends Omit<IGRPBaseAttributes, 'ref'> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: IGRPColorVariants;
  className?: string;
  title?: string;
  titleClassName?: string;
  description?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
  footerClassName?: string;
  actionLabel?: string;
  cancelLabel?: string;
  onAction?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  actionProps?: Partial<IGRPButtonProps>;
  cancelProps?: Partial<IGRPButtonProps>;
}

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
}: IGRPAlertDialogProps) {
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
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className={className}>
        {showIcon && iconPlacement === 'center' && (
          <div className='flex justify-center -mt-2'>
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
          <div className='flex-1'>
            <AlertDialogHeader className={cn(iconPlacement === 'center' && 'items-center')}>
              {title && <AlertDialogTitle className={cn(titleClassName)}>{title}</AlertDialogTitle>}
              {description && (
                <AlertDialogDescription className={descriptionClassName}>
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
                <AlertDialogCancel
                  onClick={handleCancel}
                  {...cancelProps}
                >
                  {cancelLabel}
                </AlertDialogCancel>
              )}
              <AlertDialogAction
                onClick={handleAction}
                className={cn(actionProps?.className || strongColors.bg + ' ' + strongColors.text)}
                {...actionProps}
              >
                {actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface AlertIconProps {
  bgClass: string;
  textClass: string;
  iconPlacement: 'start' | 'end' | 'center';
  iconName: IGRPIconName | string;
}

function AlertIcon({ bgClass, iconPlacement, iconName, textClass }: AlertIconProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full p-1 w-10 h-10',
        bgClass,
        iconPlacement === 'center' && 'mx-auto',
      )}
    >
      <IGRPIcon
        iconName={iconName}
        className={cn('h-6 w-6', textClass)}
      />
    </div>
  );
}

export { IGRPAlertDialog, type IGRPAlertDialogProps };

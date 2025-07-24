import { cva, type VariantProps } from 'class-variance-authority';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';

import { cn } from '@/lib/utils';
import type React from 'react';

const IGRPNotificationVariants = cva('bg-background z-50 rounded-md p-4 shadow-lg', {
  variants: {
    variant: {
      default: 'text-foreground',
      error: 'text-red-600 border-red-500/50',
      info: 'text-blue-600 border-blue-500/50',
      success: 'text-emerald-600 border-emerald-500/50',
      warninig: 'text-amber-600 border-amber-500/50',
    },
    border: {
      default: 'border-0',
      colored: 'border',
    },
  },
  defaultVariants: {
    variant: 'default',
    border: 'default',
  },
});

const typeIconMap: Record<NonNullable<IGRPNotificationProps['variant']>, IGRPIconName> = {
  default: 'RefreshCcw',
  error: 'CircleAlert',
  info: 'Info',
  success: 'CircleCheck',
  warninig: 'TriangleAlert',
};

type IGRPNotificationProps = {
  className?: string;
  showIcon?: boolean;
  content?: React.ReactNode;
  showClose?: boolean;
  iconName?: IGRPIconName | string;
  showLink?: boolean;
  lableLink?: string;
  actionLink?: string;
  customActions?: React.ReactNode;
} & VariantProps<typeof IGRPNotificationVariants>;

function IGRPNotification({
  className,
  showIcon = true,
  content = 'We use cookies to improve your experience, and show personalized content.',
  showClose = false,
  iconName,
  showLink = false,
  lableLink,
  actionLink,
  border = 'default',
  variant = 'default',
  customActions,
}: IGRPNotificationProps) {
  const icon = iconName ?? typeIconMap[variant ?? 'default'];

  return (
    <div
      className={cn(
        IGRPNotificationVariants(),
        border === 'colored' && IGRPNotificationVariants({ variant, border }),
        className,
      )}
    >
      <div className='flex justify-between gap-3'>
        <div className='flex grow text-sm'>
          {showIcon && (
            <IGRPIcon
              iconName={icon}
              className={cn(
                IGRPNotificationVariants({ variant, border: 'default' }),
                'me-3 inline-flex shadow-none p-0 mt-0.5',
              )}
              size={16}
              aria-hidden='true'
            />
          )}
          <div>{content}</div>
        </div>
        <div className='flex items-center gap-3'>
          {showLink && (
            <a
              href={actionLink}
              className='group text-sm font-medium whitespace-nowrap cursor-pointer'
            >
              {lableLink}
              <IGRPIcon
                iconName='ArrowRight'
                className='ms-1 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5'
                size={16}
                aria-hidden='true'
              />
            </a>
          )}

          {customActions && <>{customActions}</>}

          {showClose && (
            <IGRPButton
              variant='ghost'
              className='group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent'
              aria-label='Close notification'
              iconName='X'
              showIcon={true}
              size='icon'
              iconClassName='opacity-60 transition-opacity group-hover:opacity-100'
              aria-hidden='true'
            />
          )}
        </div>
      </div>
    </div>
  );
}

export { IGRPNotification, type IGRPNotificationProps, IGRPNotificationVariants };

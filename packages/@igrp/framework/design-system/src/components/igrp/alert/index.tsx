import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { IGRPLink } from '@/components/igrp/link';
import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '@/lib/colors';
import { igrpAlertIconMappings } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { IGRPBaseAttributes } from '@/types/globals';

interface IGRPAlertProps
  extends Pick<
    IGRPBaseAttributes,
    'iconName' | 'iconClassName' | 'iconPlacement' | 'label' | 'name'
  > {
  variant?: IGRPColorRole;
  color?: IGRPColorVariants;
  children: React.ReactNode;
  linkLabel?: string;
  linkUrl?: string;
  linkIcon?: IGRPIconName | string;
  showLink?: boolean;
  textColored?: boolean;
  borderColored?: boolean;
  bgColored?: boolean;
  className?: string;
  alignment?: 'start' | 'center' | 'end';
}

/**
  *
  * @private
  * @deprecated
  *
*/

function IGRPAlert({
  variant = 'solid',
  color = 'primary',
  iconName,
  iconClassName,
  iconPlacement = 'end',
  children,
  label = 'link',
  linkUrl,
  linkIcon = 'ArrowRight',
  showLink,
  textColored = true,
  borderColored = true,
  bgColored = true,
  className,
  name,
  alignment = 'start',
}: IGRPAlertProps) {
  const iconDefault = igrpAlertIconMappings[color];
  const colors = IGRPColors[variant][color];
  const alertIcon = iconName !== undefined ? iconName : iconDefault;
  const alignmentClass = alignment === 'start' ? 'items-start' : alignment === 'center' ? 'items-center' : 'items-end';

  return (
    <div
      className={cn(
        'rounded-md border px-4 py-3',
        textColored && colors.alertText,
        !textColored && variant === 'solid' && 'text-white',
        borderColored && colors.alertBorder,
        !borderColored && 'border-transparent',
        bgColored && colors.alertBg,
        className,
      )}
      id={name}
    >
      <div className={cn('flex gap-3', alignmentClass)}>
        <IGRPIcon
          iconName={alertIcon}
          className={cn('shrink-0', iconClassName)}
          size={16}
          aria-hidden='true'
        />
        <div className='flex grow justify-between gap-3'>
          <div className='grow space-y-1'>{children}</div>

          {showLink && (
            <IGRPLink
              iconName={linkIcon}
              iconPlacement={iconPlacement}
              href={linkUrl || ''}
              showIcon
              size='default'
            >
              {label}
            </IGRPLink>
          )}
        </div>
      </div>
    </div>
  );
}

export { IGRPAlert, type IGRPAlertProps };

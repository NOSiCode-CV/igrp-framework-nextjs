import { useId } from 'react';

import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '../../lib/colors';
import { igrpAlertIconMappings } from '../../lib/constants';
import { cn } from '../../lib/utils';
import type { IGRPBaseAttributes, IGRPPlacementProps } from '../../types';
import { IGRPIcon, type IGRPIconName } from './icon';
import { IGRPLink } from './typography/link';

/**
 * Props for the IGRPAlert component.
 * @see IGRPAlert
 */
interface IGRPAlertProps extends Pick<
  IGRPBaseAttributes,
  'showIcon' | 'iconName' | 'iconClassName' | 'iconPlacement' | 'label' | 'name'
> {
  /** Alert style variant (e.g. 'solid', 'soft', 'outline'). */
  variant?: IGRPColorRole;
  /** Color theme (e.g. 'primary', 'success', 'destructive'). */
  color?: IGRPColorVariants;
  /** Alert content. */
  children: React.ReactNode;
  /** Label for optional link. */
  linkLabel?: string;
  /** URL for optional link. */
  linkUrl?: string;
  /** Icon for optional link. */
  linkIcon?: IGRPIconName | string;
  /** Whether to show the link. */
  showLink?: boolean;
  /** Apply color to text. */
  textColored?: boolean;
  /** Apply color to border. */
  borderColored?: boolean;
  /** Apply color to background. */
  bgColored?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** Content alignment ('start' | 'center' | 'end'). */
  alignment?: IGRPPlacementProps;
  /** HTML id attribute. */
  id?: string;
}

/**
 * Alert component for notifications, warnings, and informational messages.
 * Supports optional link, icon, and color variants.
 */
function IGRPAlert({
  variant = 'solid',
  color = 'primary',
  showIcon = true,
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
  id,
  alignment = 'start',
}: IGRPAlertProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const iconDefault = igrpAlertIconMappings[color];
  const colors = IGRPColors[variant][color];
  const alertIcon = iconName !== undefined ? iconName : iconDefault;
  const alignmentClass =
    alignment === 'start' ? 'items-start' : alignment === 'center' ? 'items-center' : 'items-end';

  return (
    <div
      className={cn(
        'rounded-md border px-4 py-3',
        colors.alert,
        !textColored && variant === 'solid' && 'text-background',
        !borderColored && 'border-transparent',
        !bgColored && 'bg-transparent',
        className,
      )}
      id={ref}
    >
      <div className={cn('flex gap-3', alignmentClass)}>
        {showIcon && <IGRPIcon iconName={alertIcon} className={cn('shrink-0', iconClassName)} />}
        <div className={cn('flex grow justify-between gap-3')}>
          <div className={cn('grow space-y-1')}>{children}</div>

          {showLink && (
            <IGRPLink
              iconName={linkIcon}
              iconPlacement={iconPlacement}
              href={linkUrl || ''}
              showIcon
              size="default"
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

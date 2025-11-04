import { useId } from 'react';

import type { IGRPColorRole, IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { IGRPAlert } from '../horizon/alert';
import { IGRPBadge } from '../horizon/badge';

interface IGRPStatusBannerProps {
  variant?: IGRPColorRole;
  color?: IGRPColorVariants;
  text?: string;
  badgeVariant?: IGRPColorRole;
  badgeColor?: IGRPColorVariants;
  badgeText?: string;
  name?: string;
  id?: string;
  className?: string;
}

function IGRPStatusBanner({
  variant = 'soft',
  color = 'success',
  text = 'Insert our Text here',
  badgeVariant = 'outline',
  badgeColor = 'primary',
  badgeText = 'Badge Text',
  name,
  id,
  className,
}: IGRPStatusBannerProps) {
 const _id = useId();
    const ref = name ?? id ?? _id
  
  return (
    <IGRPAlert
      variant={variant}
      color={color}
      iconName="Circle"
      iconClassName={cn('h-3 w-3 fill-current')}
      className={cn('p-4 rounded-lg items-center', className)}
      alignment="center"
      name={ref}
    >
      <span className="font-medium">{text}</span>
      <IGRPBadge variant={badgeVariant} color={badgeColor} badgeClassName="ml-4 font-normal">
        {badgeText}
      </IGRPBadge>
    </IGRPAlert>
  );
}

export { IGRPStatusBanner, type IGRPStatusBannerProps };

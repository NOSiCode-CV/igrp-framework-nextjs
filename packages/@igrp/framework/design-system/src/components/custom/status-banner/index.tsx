import { IGRPAlert, IGRPBadge } from '@/components/igrp';
import type { IGRPColorRole, IGRPColorVariants } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface IGRPStatusBannerProps {
  variant?: IGRPColorRole;
  color?: IGRPColorVariants;
  text?: string;
  badgeVariant?: IGRPColorRole;
  badgeColor?: IGRPColorVariants;
  badgeText?: string;
}

function IGRPStatusBanner({
  variant = 'soft',
  color = 'success',
  text = 'Insert our Text here',
  badgeVariant = 'outline',
  badgeColor = 'primary',
  badgeText = 'Badge Text',
}: IGRPStatusBannerProps) {
  return (
    <IGRPAlert
      variant={variant}
      color={color}
      iconName='Circle'
      iconClassName={cn('h-3 w-3 fill-current')}
      className='p-4 rounded-lg items-center'
      alignment='center'
    >
      <span className='font-medium'>{text}</span>
      <IGRPBadge
        variant={badgeVariant}
        color={badgeColor}
        badgeClassName='ml-4 font-normal'
      >
        {badgeText}
      </IGRPBadge>
    </IGRPAlert>
  );
}

export { IGRPStatusBanner, type IGRPStatusBannerProps };

import type { IGRPIconName } from '../components/horizon/icon';
import type { IGRPColorVariants } from './colors';

export const igrpGridSizeClasses = {
  default: '',
  full: 'col-span-full',
  '1/2': 'col-span-full md:col-span-2',
  '1/3': 'col-span-full md:col-span-4',
  '2/3': 'col-span-full md:col-span-8',
  '1/4': 'col-span-full md:col-span-3',
  '3/4': 'col-span-full md:col-span-9',
};

export const igrpAlertIconMappings: Record<IGRPColorVariants, IGRPIconName> = {
  primary: 'Info',
  secondary: 'Star',
  success: 'CircleCheck',
  destructive: 'CircleAlert',
  warning: 'TriangleAlert',
  info: 'Info',
  indigo: 'Sparkles',
};

export const igrpSize = { sm: "sm", md: 'md', lg: 'lg', xl: 'xl' };

export const igrpRoundSize = {
  'rounded-none': 'rounded-none',
  'rounded-sm': 'rounded-sm',
  'rounded': 'rounded',
  'rounded-md': 'rounded-md',
  'rounded-lg': 'rounded-lg',
  'rounded-xl': 'rounded-xl',
  'rounded-2xl': 'rounded-2xl',
  'rounded-3xl': 'rounded-3xl',
  'rounded-full': 'rounded-full'
}

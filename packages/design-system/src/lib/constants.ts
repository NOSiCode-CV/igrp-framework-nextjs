import type { IGRPIconName } from '../components/horizon/icon';
import type { IGRPColorVariants } from './colors';

/** Tailwind grid span classes by layout size. */
export const igrpGridSizeClasses = {
  default: '',
  full: 'col-span-full',
  '1/2': 'col-span-full md:col-span-2',
  '1/3': 'col-span-full md:col-span-4',
  '2/3': 'col-span-full md:col-span-8',
  '1/4': 'col-span-full md:col-span-3',
  '3/4': 'col-span-full md:col-span-9',
};

/** Icon name per color variant for alerts. */
export const igrpAlertIconMappings: Record<IGRPColorVariants, IGRPIconName> = {
  primary: 'Info',
  secondary: 'Star',
  success: 'CircleCheck',
  destructive: 'CircleAlert',
  warning: 'TriangleAlert',
  info: 'Info',
  indigo: 'Sparkles',
};

/** Tailwind classes to hide native time input picker indicator. */
export const DEFAULT_HIDE_TIME_INDICATOR =
  'appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none';

/** date-fns format string for dd-MM-yyyy. */
export const DD_MM_YYYY = 'dd-MM-yyyy';

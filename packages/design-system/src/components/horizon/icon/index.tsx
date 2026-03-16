'use client';

import { AlertCircle, type LucideProps, icons } from 'lucide-react';

import { cn } from '../../../lib/utils';

/** Lucide icon names. */
type IGRPIconName = keyof typeof icons;

const IGRPIconObject = Object.keys(icons).sort();
const IGRPIconList = icons;

/**
 * Props for the IGRPIcon component.
 * @see IGRPIcon
 */
interface IGRPIconProps extends Omit<LucideProps, 'ref'> {
  /** Lucide icon name. */
  iconName: IGRPIconName | string;
  /** HTML id attribute. */
  id?: string;
}

/**
 * Renders a Lucide icon by name.
 */
function IGRPIcon({
  iconName,
  className,
  size = 16,
  color = 'currentColor',
  id,
  ...props
}: IGRPIconProps) {
  const LucideIcon = icons[iconName as IGRPIconName];

  if (!LucideIcon) {
    console.warn('Invalid icon::', { iconName });
    return <AlertCircle className={cn('text-destructive')} />;
  }

  const ref = id ?? iconName;

  return <LucideIcon className={className} id={ref} color={color} size={size} {...props} />;
}

export {
  IGRPIcon,
  IGRPIconObject,
  type IGRPIconProps,
  type IGRPIconName,
  type LucideProps,
  IGRPIconList,
};

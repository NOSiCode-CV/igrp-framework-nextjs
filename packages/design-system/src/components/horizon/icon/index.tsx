import { AlertCircle, type LucideProps, icons } from 'lucide-react';

type IGRPIconName = keyof typeof icons;

const IGRPIconObject = Object.keys(icons).sort();
const IGRPIconList = icons;

interface IGRPIconProps extends Omit<LucideProps, 'ref'> {
  iconName: IGRPIconName | string;
  id?: string;
}

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
    return <AlertCircle className="text-destructive" />;
  }

  const ref = id ?? iconName

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

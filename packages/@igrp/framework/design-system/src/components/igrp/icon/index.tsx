import { AlertCircle, type LucideProps, icons } from 'lucide-react';

type IGRPIconName = keyof typeof icons;

export const IGRPIconObject = Object.keys(icons).sort();

interface IGRPIconProps extends Omit<LucideProps, 'ref'> {
  iconName: IGRPIconName | string;
}

function IGRPIcon({
  iconName,
  className,
  size = 16,
  color = 'currentColor',
  ...props
}: IGRPIconProps) {
  const LucideIcon = icons[iconName as IGRPIconName];

  if (!LucideIcon) {
    console.log('Invalid icon::', { iconName });
    return <AlertCircle className='text-destructive' />;
  }

  return (
    <LucideIcon
      className={className}
      id={iconName}
      color={color}
      size={size}
      {...props}
    />
  );
}

export { IGRPIcon, type IGRPIconProps, type IGRPIconName };

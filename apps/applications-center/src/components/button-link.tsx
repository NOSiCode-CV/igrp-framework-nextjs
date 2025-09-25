'use client';

import { IGRPButtonPrimitive, IGRPIconProps } from '@igrp/igrp-framework-react-design-system';
import Link from 'next/link';

import { LinkLoadingIndicator } from './link-loading-indicator';

type IGRPBtnProps = React.ComponentProps<typeof IGRPButtonPrimitive>;

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  label?: string;
  icon: IGRPIconProps['iconName'];
  iconClassName?: string;
  variant?: IGRPBtnProps['variant'];
  btnClassName?: string;
}

export function ButtonLink({
  label, 
  icon, 
  iconClassName, 
  variant,
  btnClassName,
  ...props
}: ButtonLinkProps) {  
  return (
    <IGRPButtonPrimitive
      asChild
      variant={variant || 'default'}
      className={btnClassName}
    >
      <Link {...props}>
        <LinkLoadingIndicator
          iconName={icon}
          iconClassName={iconClassName}
        />
        {label}
      </Link>
    </IGRPButtonPrimitive>
  );
}

'use client'

import React from 'react';
import { IGRPButtonPrimitive, IGRPIconProps } from '@igrp/igrp-framework-react-design-system'
import Link from 'next/link'
import { LinkLoadingIndicator } from './link-loading-indicator';

type IGRPBtnProps = React.ComponentProps<typeof IGRPButtonPrimitive>

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  label?: string,
  iconName: IGRPIconProps['iconName'],
  iconClassName?: string,
  variant?: IGRPBtnProps['variant']
}

export function ButtonLink(props: ButtonLinkProps) {
  const { label, iconName, iconClassName, variant } = props
  return (
     <IGRPButtonPrimitive asChild variant={variant || 'default'}>
      <Link {...props}>
        <LinkLoadingIndicator iconName={iconName} iconClassName={iconClassName} />
        {label}
      </Link>
    </IGRPButtonPrimitive>
  )
}
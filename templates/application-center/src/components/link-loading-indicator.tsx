'use client'

import { cn } from '@/lib/utils'
import { IGRPIcon, IGRPIconProps } from '@igrp/igrp-framework-react-design-system'
import { useLinkStatus } from 'next/link'

export interface LinkLoadingIndicatorProps { 
  iconName: IGRPIconProps['iconName'],
  iconClassName?: string,
}

export function LinkLoadingIndicator({ iconName, iconClassName }: LinkLoadingIndicatorProps) {
  const { pending } = useLinkStatus()
  return (
    <IGRPIcon
      iconName={pending ? 'LoaderCircle' : iconName}
      strokeWidth={2}
      className={cn(iconClassName, pending && 'animate-spin')}
    />
  )
}
'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPToaster,
  SidebarInset,
  SidebarProvider,
} from '@igrp/igrp-framework-react-design-system';

export type IGRPRootProvidersFullProps = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  defaultOpen?: boolean;
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
  children: React.ReactNode;
  className?: string;
};

export function IGRPRootProvidersFull({
  sidebar,
  header,
  defaultOpen,
  toasterConfig,
  children,
  className,
}: IGRPRootProvidersFullProps) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
  } = toasterConfig ?? {};

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className={cn('z-45')}>{sidebar}</div>
      <SidebarInset className={cn('min-w-0')}>
        {header}
        <div className={cn('p-4', className)}>{children}</div>
        {showToaster && (
          <IGRPToaster
            position={position}
            theme={theme}
            richColors={richColors}
            expand={expand}
            duration={duration}
            {...toasterConfig}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

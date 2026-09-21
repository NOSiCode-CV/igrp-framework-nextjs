'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPToaster,
  SidebarInset,
  SidebarProvider,
} from '@igrp/igrp-framework-react-design-system';

export type IGRPRootProvidersFullProps = {
  sidebar?: React.ReactNode;
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
  // `closeButton` is destructured explicitly rather than swept in by a trailing
  // `{...toasterConfig}` spread. That spread put `showToaster` — a framework
  // flag with no meaning to sonner — onto the toaster, and re-applied every raw
  // value AFTER the defaults resolved, so an explicit `position: undefined`
  // silently beat the 'bottom-right' default.
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
    closeButton,
  } = toasterConfig ?? {};

  const toaster = showToaster && (
    <IGRPToaster
      position={position}
      theme={theme}
      richColors={richColors}
      expand={expand}
      duration={duration}
      closeButton={closeButton}
    />
  );

  if (!sidebar) {
    return (
      // SidebarProvider is required even without a visible sidebar because
      // IGRPTemplateNavUser (and SidebarMenuButton) call useIGRPSidebar() unconditionally.
      <SidebarProvider defaultOpen={defaultOpen}>
        <div className="flex min-h-screen flex-col w-full">
          {header}
          <div className={cn('p-4', className)}>{children}</div>
          {toaster}
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="z-45">{sidebar}</div>
      <SidebarInset className="min-w-0">
        {header}
        <div className={cn('p-4', className)}>{children}</div>
        {toaster}
      </SidebarInset>
    </SidebarProvider>
  );
}

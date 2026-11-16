'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { cn, SidebarInset, SidebarProvider } from '@igrp/igrp-framework-react-design-system';

import { IGRPBreadcrumbsProvider } from './breadcrumbs.js';
import { IGRPCommandPaletteProvider } from './command-palette.js';
import { IGRPShellProvider } from './shell.js';
import { IGRPTemplateToaster } from './toaster.js';

export type IGRPRootProvidersFullProps = {
  sidebar?: React.ReactNode;
  header: React.ReactNode;
  defaultOpen?: boolean;
  /**
   * @deprecated Pass `toaster={<IGRPTemplateToaster {...config} />}` instead.
   * Still used when `toaster` is omitted.
   */
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
  /** The toaster element; `null` renders none. Defaults to `IGRPTemplateToaster` with `toasterConfig`. */
  toaster?: React.ReactNode | null;
  children: React.ReactNode;
  /** Class of the content wrapper around `children` (merged over `p-4`). */
  className?: string;
};

export function IGRPRootProvidersFull({
  sidebar,
  header,
  defaultOpen,
  toasterConfig,
  toaster,
  children,
  className,
}: IGRPRootProvidersFullProps) {
  const toasterNode = toaster === undefined ? <IGRPTemplateToaster {...toasterConfig} /> : toaster;
  const hasSidebar = Boolean(sidebar);

  const shell = hasSidebar ? (
    <>
      <div className="z-45">{sidebar}</div>
      <SidebarInset className="min-w-0">
        {header}
        <div className={cn('p-4', className)}>{children}</div>
        {toasterNode}
      </SidebarInset>
    </>
  ) : (
    <div className="flex min-h-screen flex-col w-full">
      {header}
      <div className={cn('p-4', className)}>{children}</div>
      {toasterNode}
    </div>
  );

  return (
    // SidebarProvider is required even without a visible sidebar because
    // IGRPTemplateNavUser (and SidebarMenuButton) call useIGRPSidebar() unconditionally.
    <SidebarProvider defaultOpen={defaultOpen}>
      <IGRPShellProvider hasSidebar={hasSidebar}>
        <IGRPCommandPaletteProvider>
          <IGRPBreadcrumbsProvider>{shell}</IGRPBreadcrumbsProvider>
        </IGRPCommandPaletteProvider>
      </IGRPShellProvider>
    </SidebarProvider>
  );
}

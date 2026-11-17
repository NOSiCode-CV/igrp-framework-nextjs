'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { cn, SidebarProvider } from '@igrp/igrp-framework-react-design-system';

import { useIGRPChromeI18n } from '../i18n/context.js';
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
  /** Class of the `<main>` around `children` (merged over `p-4`). */
  className?: string;
  /** Text of the skip link. Defaults to the chrome catalog (`shell.skipToContent`). */
  skipToContentLabel?: string;
};

/** Target of the skip link: the page's `<main>`. */
export const IGRP_MAIN_CONTENT_ID = 'igrp-main-content';

/**
 * The DS `SidebarInset` classes on a `<div>`: `SidebarInset` hard-codes `<main>`,
 * which put the header inside the main landmark. Keep in step with the DS.
 */
const SIDEBAR_INSET_CLASS =
  'relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2';

export function IGRPRootProvidersFull({
  sidebar,
  header,
  defaultOpen,
  toasterConfig,
  toaster,
  children,
  className,
  skipToContentLabel,
}: IGRPRootProvidersFullProps) {
  const chrome = useIGRPChromeI18n();
  const toasterNode = toaster === undefined ? <IGRPTemplateToaster {...toasterConfig} /> : toaster;
  const hasSidebar = Boolean(sidebar);

  // tabIndex -1: the skip link moves focus here, so the next Tab continues in the page.
  // scroll-mt: lands below the sticky header (two rows when it wraps on narrow screens).
  const main = (
    <main
      id={IGRP_MAIN_CONTENT_ID}
      tabIndex={-1}
      className={cn('p-4 outline-none scroll-mt-28 sm:scroll-mt-16', className)}
    >
      {children}
    </main>
  );

  const shell = hasSidebar ? (
    <>
      <div className="z-45">{sidebar}</div>
      <div data-slot="sidebar-inset" className={cn(SIDEBAR_INSET_CLASS, 'min-w-0')}>
        {header}
        {main}
        {toasterNode}
      </div>
    </>
  ) : (
    <div className="flex min-h-screen flex-col w-full">
      {header}
      {main}
      {toasterNode}
    </div>
  );

  return (
    // SidebarProvider is required even without a visible sidebar because
    // IGRPTemplateNavUser (and SidebarMenuButton) call useIGRPSidebar() unconditionally.
    <SidebarProvider defaultOpen={defaultOpen}>
      <IGRPShellProvider hasSidebar={hasSidebar}>
        <IGRPCommandPaletteProvider>
          <IGRPBreadcrumbsProvider>
            <a
              href={`#${IGRP_MAIN_CONTENT_ID}`}
              className={cn(
                'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            >
              {skipToContentLabel ?? chrome.shell.skipToContent}
            </a>
            {shell}
          </IGRPBreadcrumbsProvider>
        </IGRPCommandPaletteProvider>
      </IGRPShellProvider>
    </SidebarProvider>
  );
}

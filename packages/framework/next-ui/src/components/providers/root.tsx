'use client';

import type {
  IGRPConfigArgs,
  IGRPHeaderDataArgs,
  IGRPSidebarDataArgs,
} from '@igrp/framework-next-types';
import {
  cn,
  IGRPToaster,
  SidebarInset,
  SidebarProvider,
} from '@igrp/igrp-framework-react-design-system';

import { IGRPTemplateHeader } from '../templates/header';
import { IGRPTemplateSidebar } from '../templates/sidebar';

export type IGRPRootProvidersArgs = {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  defaultOpen?: boolean;
  showHeader?: boolean;
  sidebarData?: IGRPSidebarDataArgs;
  headerData?: IGRPHeaderDataArgs;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
};

export function IGRPRootProviders({
  children,
  defaultOpen,
  showSidebar,
  showHeader,
  sidebarData,
  headerData,
  sidebar,
  header,
  toasterConfig,
}: IGRPRootProvidersArgs) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
  } = toasterConfig ?? {};

  const sidebarContent =
    sidebar ?? (sidebarData ? <IGRPTemplateSidebar data={sidebarData} /> : null);
  const headerContent = header ?? (headerData ? <IGRPTemplateHeader data={headerData} /> : null);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {showSidebar && sidebarContent && <div className={cn('z-45')}>{sidebarContent}</div>}

      <SidebarInset className={cn('min-w-0')}>
        {showHeader && headerContent}

        <div className={cn('p-4')}>{children}</div>

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

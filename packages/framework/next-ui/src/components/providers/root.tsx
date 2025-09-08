'use client';

import type {
  IGRPConfigArgs,
  IGRPHeaderDataArgs,
  IGRPSidebarDataArgs,
} from '@igrp/framework-next-types';
import {
  IGRPToaster,
  IGRPSidebarInsetPrimitive,
  IGRPSidebarProviderPrimitive,
} from '@igrp/igrp-framework-react-design-system';

import { IGRPTemplateHeader } from '../templates/header';
import { IGRPTemplateSidebar } from '../templates/sidebar';

export type IGRPRootProvidersArgs = {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  defaultOpen?: boolean;
  showHeader?: boolean;
  sidebarData: IGRPSidebarDataArgs;
  headerData: IGRPHeaderDataArgs;
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
};

export function IGRPRootProviders({
  children,
  defaultOpen,
  showSidebar,
  showHeader,
  sidebarData,
  headerData,
  toasterConfig,
}: IGRPRootProvidersArgs) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 3500,
  } = toasterConfig ?? {};

  return (
    <IGRPSidebarProviderPrimitive defaultOpen={defaultOpen}>
      {showSidebar && <IGRPTemplateSidebar data={sidebarData} />}

      <IGRPSidebarInsetPrimitive>
        {showHeader && <IGRPTemplateHeader data={headerData} />}

        <main className="flex flex-col flex-1 px-6 py-8">{children}</main>

        {showToaster && (
          <IGRPToaster
            position={position}
            theme={theme}
            richColors={richColors}
            expand={expand}
            duration={duration}
          />
        )}
      </IGRPSidebarInsetPrimitive>
    </IGRPSidebarProviderPrimitive>
  );
}

import { cookies } from 'next/headers';
import {
  IGRPRootProvidersFull,
  type BreadcrumbItem,
  type IGRPHeaderSlots,
} from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpSetAccessClientConfig } from '../lib/api-config.js';
import { layoutHeader, layoutSidebar, resolveLayoutAccess } from './igrp-layout-chrome.js';

export type IGRPLayoutFullArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  /**
   * The header. Defaults to `<IGRPLayoutHeader config={config} />` built from
   * the deprecated header props below. Pass your own `IGRPLayoutHeader` to set
   * slots, labels, fallbacks or a parts composition.
   */
  readonly header?: React.ReactNode;
  /**
   * The sidebar. Defaults to `<IGRPLayoutSidebar config={config} />`; `null`
   * renders no sidebar (and hides the header's sidebar trigger).
   */
  readonly sidebar?: React.ReactNode | null;
  /**
   * The toaster element; `null` renders none. Defaults to
   * `IGRPTemplateToaster` with `config.toasterConfig`.
   */
  readonly toaster?: React.ReactNode | null;
  /** Class of the wrapper around `children` (merged over `p-4`). */
  readonly contentClassName?: string;
  /** @deprecated Pass `sidebar={null}` instead. Ignored when `sidebar` is given. */
  readonly showSidebar?: boolean;
  /** @deprecated Pass `breadcrumbs` to `IGRPLayoutHeader`, or render `<IGRPPageBreadcrumbs>` in the page. */
  readonly breadcrumbs?: BreadcrumbItem[];
  /** @deprecated Pass `breadcrumbRouteLabels` to `IGRPLayoutHeader`. */
  readonly breadcrumbRouteLabels?: Record<string, string>;
  /**
   * Consumer-injected header content. Slots must be elements, not components:
   * they cross the Server→Client boundary into the header.
   *
   * @deprecated Pass `slots` to `IGRPLayoutHeader` (as `header`).
   */
  readonly headerSlots?: IGRPHeaderSlots;
  /**
   * Initial open state of the sidebar shell.
   *
   * It cannot be read from the sidebar data source: that is fetched inside
   * `SidebarDataProvider`, behind a `<Suspense>` boundary nested in the shell
   * this value configures — the shell has to render before the data exists.
   * Hence an explicit prop. When omitted, it is read from the `sidebar_state`
   * cookie the design-system sidebar writes on toggle (open unless `'false'`).
   */
  readonly defaultSidebarOpen?: boolean;
  /** @deprecated Use `contentClassName`. */
  rootProviderClassName?: string;
};

export async function IGRPLayoutFull({
  children,
  config,
  header,
  sidebar,
  toaster,
  contentClassName,
  showSidebar = true,
  breadcrumbs,
  breadcrumbRouteLabels,
  headerSlots,
  defaultSidebarOpen,
  rootProviderClassName,
}: IGRPLayoutFullArgs) {
  const { previewMode, toasterConfig } = config;
  const access = await resolveLayoutAccess(config);

  if (!previewMode && access.baseUrl) {
    igrpSetAccessClientConfig({
      token: access.token,
      baseUrl: access.baseUrl,
      ...(access.timeout !== undefined ? { timeout: access.timeout } : {}),
      ...(access.locale ? { locale: access.locale } : {}),
    });
  }

  const sidebarNode =
    sidebar !== undefined
      ? (sidebar ?? undefined)
      : showSidebar
        ? layoutSidebar({ config }, access)
        : undefined;

  const headerNode =
    header ??
    layoutHeader({ config, slots: headerSlots, breadcrumbs, breadcrumbRouteLabels }, access);

  // Must match SIDEBAR_COOKIE_NAME in the design-system sidebar primitive.
  const sidebarOpen =
    defaultSidebarOpen ?? (await cookies()).get('sidebar_state')?.value !== 'false';

  return (
    <IGRPRootProvidersFull
      defaultOpen={sidebarOpen}
      toasterConfig={toasterConfig}
      toaster={toaster}
      sidebar={sidebarNode}
      header={headerNode}
      className={contentClassName ?? rootProviderClassName}
    >
      {children}
    </IGRPRootProvidersFull>
  );
}

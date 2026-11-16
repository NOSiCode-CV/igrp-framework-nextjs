import { Suspense } from 'react';
import {
  IGRPLayoutErrorBoundary,
  IGRPHeaderSkeleton,
  IGRPSidebarSkeleton,
  IGRPHeaderError,
  IGRPSidebarError,
  type BreadcrumbItem,
  type IGRPHeaderLabelProps,
  type IGRPHeaderSlots,
  type IGRPSidebarLabelProps,
} from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import type { IGRPI18nConfig } from '../i18n/config.js';
import { igrpResolveLocale } from '../i18n/server/resolve.js';
import { HeaderDataProvider } from './providers/header-data-provider.js';
import { SidebarDataProvider } from './providers/sidebar-data-provider.js';

/** What the data providers need to reach Access Management for this request. */
export type LayoutAccess = {
  token: string;
  baseUrl: string;
  timeout?: number;
  locale?: string;
};

export async function resolveLayoutAccess(config: IGRPConfigArgs): Promise<LayoutAccess> {
  const { apiManagementConfig, layout } = config;
  return {
    token: layout.session?.accessToken || '',
    baseUrl: apiManagementConfig?.baseUrl || '',
    // Threaded explicitly: `igrpSetAccessClientConfig` only defaults `timeout`
    // when it CREATES the store, so omitting it left every read-path client
    // on the 10s default and made `apiManagementConfig.timeout` dead config.
    timeout: apiManagementConfig?.timeout,
    // Base locale for `Accept-Language` on framework API calls (menus, user).
    locale: config.i18n ? await igrpResolveLocale(config.i18n as IGRPI18nConfig) : undefined,
  };
}

export type IGRPLayoutHeaderArgs = IGRPHeaderLabelProps & {
  readonly config: IGRPConfigArgs;
  /**
   * Consumer-injected header content (elements, not components). A supplied
   * slot always renders. Ignored when `children` is given.
   */
  readonly slots?: IGRPHeaderSlots;
  /** Pre-resolved breadcrumb items (a page's `<IGRPPageBreadcrumbs>` wins). */
  readonly breadcrumbs?: BreadcrumbItem[];
  /** Route → label map for URL-derived breadcrumbs. */
  readonly breadcrumbRouteLabels?: Record<string, string>;
  /** App-relative path to the logo used when `headerLogo` is absent or fails. */
  readonly fallbackLogo?: string;
  /** Class of the default header bar. Ignored when `children` is given. */
  readonly className?: string;
  /** Shown while the header data loads. Defaults to `IGRPHeaderSkeleton`. */
  readonly fallback?: React.ReactNode;
  /**
   * Fill the built-in command palette with the layout menus. Defaults to `true`;
   * no menu commands are built when a `slots.search` replaces the palette, or
   * when the default header has `showSearch` off. Pass `false` for a `children`
   * composition without `IGRPHeaderSearch`: otherwise the menus are fetched for
   * a palette that never renders.
   */
  readonly paletteCommands?: boolean;
  /** Shown when the header fails. Defaults to `IGRPHeaderError`. */
  readonly errorFallback?: React.ReactNode;
  /**
   * A composition of `IGRPHeader*` parts from `@igrp/framework-next-ui`,
   * rendered with the fetched data instead of the default header. In it a part
   * shows by being included; the `show*` flags are not consulted.
   */
  readonly children?: React.ReactNode;
};

export type IGRPLayoutSidebarArgs = IGRPSidebarLabelProps & {
  readonly config: IGRPConfigArgs;
  /** Shown while the sidebar data loads. Defaults to `IGRPSidebarSkeleton`. */
  readonly fallback?: React.ReactNode;
  /** Shown when the sidebar fails. Defaults to `IGRPSidebarError`. */
  readonly errorFallback?: React.ReactNode;
  /**
   * A composition of `IGRPSidebar*` parts (plus the design system's
   * `SidebarHeader` / `SidebarContent` / `SidebarFooter`), rendered with the
   * fetched data instead of the default sidebar.
   */
  readonly children?: React.ReactNode;
};

// token/baseUrl are passed explicitly to each provider: each renders inside its
// own <Suspense> boundary, which resumes on a later tick that doesn't reliably
// inherit the AsyncLocalStorage store seeded by `igrpSetAccessClientConfig`.
// They re-apply it themselves.

/** The header with its error boundary and Suspense, for a resolved `access`. */
export function layoutHeader(
  { config, fallback, errorFallback, slots, ...rest }: IGRPLayoutHeaderArgs,
  access: LayoutAccess,
) {
  return (
    <IGRPLayoutErrorBoundary fallback={errorFallback ?? <IGRPHeaderError />}>
      <Suspense fallback={fallback ?? <IGRPHeaderSkeleton />}>
        <HeaderDataProvider config={config} headerSlots={slots} {...access} {...rest} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  );
}

/** The sidebar with its error boundary and Suspense, for a resolved `access`. */
export function layoutSidebar(
  { config, fallback, errorFallback, ...rest }: IGRPLayoutSidebarArgs,
  access: LayoutAccess,
) {
  return (
    <IGRPLayoutErrorBoundary fallback={errorFallback ?? <IGRPSidebarError />}>
      <Suspense fallback={fallback ?? <IGRPSidebarSkeleton />}>
        <SidebarDataProvider config={config} {...access} {...rest} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  );
}

/**
 * The framework header as a server piece: fetches the header data and the
 * user, mounts `IGRPHeaderDataProvider`, and renders the default header or
 * your `children` composition. Pass it as `header` on `IGRPLayoutFull`.
 */
export async function IGRPLayoutHeader(props: IGRPLayoutHeaderArgs) {
  return layoutHeader(props, await resolveLayoutAccess(props.config));
}

/**
 * The framework sidebar as a server piece: fetches menus, user and apps,
 * mounts `IGRPSidebarDataProvider`, and renders the default sidebar or your
 * `children` composition. Pass it as `sidebar` on `IGRPLayoutFull`.
 */
export async function IGRPLayoutSidebar(props: IGRPLayoutSidebarArgs) {
  return layoutSidebar(props, await resolveLayoutAccess(props.config));
}

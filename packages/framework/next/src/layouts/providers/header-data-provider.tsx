// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import { unstable_rethrow } from 'next/navigation';
import type { IGRPConfigArgs, IGRPHeaderDataArgs } from '@igrp/framework-next-types';
import {
  IGRPHeaderDataProvider,
  IGRPTemplateHeader,
  igrpMenusToPaletteCommands,
} from '@igrp/framework-next-ui';
import type {
  BreadcrumbItem,
  IGRPHeaderLabelProps,
  IGRPHeaderSlots,
  IGRPPaletteCommand,
} from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors.js';
import { igrpSetAccessClientConfig } from '../../lib/api-config.js';
import { igrpResolveLayoutDataSource } from '../../lib/layout-data-source.js';
import { igrpGetLayoutMenus } from '../../lib/layout-menus.js';
import { fetchCurrentUser } from '../../hooks/use-user.js';

export type HeaderDataProviderProps = IGRPHeaderLabelProps & {
  config: Pick<IGRPConfigArgs, 'appCode' | 'layoutData' | 'previewMode'>;
  // Access-client credentials, re-applied at the top of this component rather
  // than relied on from the caller's AsyncLocalStorage context: this component
  // renders inside a <Suspense> boundary in IGRPLayoutFull, and Next.js resumes
  // Suspense-deferred Server Components on a later tick that does not reliably
  // inherit a store seeded by `enterWith()` earlier in the same render. See
  // igrp-layout-full.tsx for the matching `igrpSetAccessClientConfig` call.
  token: string;
  baseUrl: string;
  /** Per-request AM client timeout; see igrp-layout-full.tsx. */
  timeout?: number;
  /** Base locale for `Accept-Language`; see igrp-layout-full.tsx. */
  locale?: string;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
  // Consumer-injected header content, forwarded verbatim. Header data is still
  // fetched here regardless — a slot replaces rendering, never the data.
  headerSlots?: IGRPHeaderSlots;
  fallbackLogo?: string;
  className?: string;
  /** A composition of `IGRPHeader*` parts, rendered instead of the default header. */
  children?: React.ReactNode;
  /** `false` skips the palette's menu commands; see `IGRPLayoutHeaderArgs`. */
  paletteCommands?: boolean;
};

/**
 * Palette commands from the layout menus. Never rejects: the palette is
 * auxiliary, and a promise handed to the client must not carry a redirect (the
 * user fetch in this same render already turns a 401 into one).
 */
function paletteCommands(config: HeaderDataProviderProps['config']): Promise<IGRPPaletteCommand[]> {
  return igrpGetLayoutMenus(config).then(igrpMenusToPaletteCommands, () => []);
}

export async function HeaderDataProvider({
  config,
  token,
  baseUrl,
  timeout,
  locale,
  breadcrumbs,
  breadcrumbRouteLabels,
  headerSlots,
  fallbackLogo,
  className,
  children,
  paletteCommands: withPaletteCommands = true,
  ...labels
}: HeaderDataProviderProps) {
  const { previewMode } = config;
  const layoutData = igrpResolveLayoutDataSource(config);

  if (!previewMode) {
    igrpSetAccessClientConfig({
      token,
      baseUrl,
      ...(timeout !== undefined ? { timeout } : {}),
      ...(locale ? { locale } : {}),
    });
  }

  // `layoutData.getUser` replaces the user source in both modes; without it,
  // preview keeps the data's own `user` and production asks Access Management.
  const getUser = layoutData.getUser ?? (previewMode ? undefined : fetchCurrentUser);

  // The built-in palette gets the menu commands unless a search slot replaces
  // it. Started before the header awaits so the menu fetch (cached, shared with
  // the sidebar) overlaps them, and handed over as a promise so it never delays
  // the header; the palette streams them in. It never rejects, so an unused one
  // (`showSearch` off) is harmless.
  const palette = withPaletteCommands && !headerSlots?.search ? paletteCommands(config) : undefined;

  let headerData: IGRPHeaderDataArgs;
  if (!getUser) {
    headerData = await layoutData.getHeaderData();
  } else {
    // Parallel fetch: both are independent of each other. Wrapped so the
    // boundary's `onError` reporter gets a stable `code` instead of a bare
    // transport error — `unstable_rethrow` FIRST, because `fetchCurrentUser`
    // signals a 401/403 by throwing `redirect('/login')`, and wrapping that would
    // turn "send the user to login" into "render the header error".
    try {
      const [data, user] = await Promise.all([layoutData.getHeaderData(), getUser()]);
      headerData = { ...data, ...(user != null && { user }) };
    } catch (error) {
      unstable_rethrow(error);
      throw new IgrpLayoutDataError(
        'IGRP_LAYOUT_DATA_FAILED',
        '[igrp-layout]: Não foi possível carregar os dados do cabeçalho.',
        {},
        { cause: error },
      );
    }
  }

  return (
    <IGRPHeaderDataProvider
      data={headerData}
      breadcrumbs={breadcrumbs}
      breadcrumbRouteLabels={breadcrumbRouteLabels}
      paletteCommands={children || headerData.showSearch ? palette : undefined}
      fallbackLogo={fallbackLogo}
      {...labels}
    >
      {children ?? <IGRPTemplateHeader slots={headerSlots} className={className} />}
    </IGRPHeaderDataProvider>
  );
}

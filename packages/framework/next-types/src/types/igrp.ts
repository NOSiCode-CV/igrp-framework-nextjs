import { Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';

import { IGRPHeaderDataArgs } from './header';
import { IGRPSidebarDataArgs } from './sidebar';
import { IGRPPackageJson, IGRPToasterPosition } from './globals';

export type IGRPConfigArgs = {
  appCode: string;
  previewMode: boolean;
  syncAccess: boolean;
  appInformation: IGRPPackageJson;
  layoutMockData: {
    getHeaderData: () => Promise<IGRPHeaderDataArgs>;
    getSidebarData: () => Promise<IGRPSidebarDataArgs>;
  };
  font?: string;
  showLanguageSelector?: boolean;
  layout: IGRPLayoutConfigArgs;
  apiManagementConfig?: {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
    /**
     * Service identity used as the resource name on the Access Management
     * server and sent as the `X-Machine-Service-ID` header. Must be a
     * non-empty identifier (lowercase alphanumeric + dashes). Shape is
     * validated at render time in `planAccessManagementSync` so
     * misconfiguration surfaces via `global-error.tsx` instead of an opaque
     * 4xx from the AM server inside `after()`.
     *
     * Sourced from `process.env.IGRP_SERVICE_ID` in the template.
     */
    serviceId: string;
    /**
     * OAuth2 `client_credentials` client identifier. Combined with
     * `m2mClientSecret`, the framework obtains a bearer token from
     * `POST {baseUrl}/oauth2/token` and caches it until expiry. Required
     * when `syncAccess` is enabled and `previewMode` is off.
     *
     * Sourced from `process.env.IGRP_M2M_CLIENT_ID` in the template.
     */
    m2mClientId: string;
    /**
     * OAuth2 `client_credentials` client secret. Server-only — must never
     * be threaded into a client component prop. The framework keeps the
     * value inside `IGRPRootLayout` (a server component) and the
     * `AccessManagementClient` running in `after()`.
     *
     * Sourced from `process.env.IGRP_M2M_CLIENT_SECRET` in the template.
     */
    m2mClientSecret: string;
    /**
     * Optional OAuth2 scope requested when fetching the bearer token. Leave
     * `undefined` to let the AM authorization server pick the default scope
     * this client is allowed. Set when the AM admin has issued a specific
     * scope for resource sync.
     *
     * Sourced from `process.env.IGRP_M2M_SCOPE` in the template.
     */
    m2mScope?: string;
    appRoutes?: string[];
    paramMapBody?: string;
  };
  toasterConfig: {
    showToaster: boolean;
    position?: IGRPToasterPosition;
    theme?: 'light' | 'dark' | 'system';
    richColors?: boolean;
    expand?: boolean;
    duration?: number;
    closeButton?: boolean;
  };
  loginUrl?: string;
  logoutUrl?: string;
  showSettings?: boolean;
  sessionArgs?: Partial<SessionProviderProps>;
};

export type IGRPConfigClient = () => Promise<IGRPConfigArgs>;

export type IGRPLayoutConfigArgs = {
  session: Session | null;
  activeThemeValue?: string;
  isScaled?: boolean;
};

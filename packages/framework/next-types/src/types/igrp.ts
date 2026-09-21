import type { Session } from '@igrp/framework-next-auth/session';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';

import type { IGRPMenuItemArgs, IGRPPermissionCatalogEntry } from './access-management.js';
import type { IGRPMockDataAsync, IGRPPackageJson, IGRPToasterPosition } from './globals.js';

export type IGRPConfigArgs = {
  appCode: string;
  previewMode: boolean;
  syncAccess: boolean;
  appInformation: IGRPPackageJson;
  /**
   * Header and sidebar data source — **required in production too, not just in
   * preview mode**. The name is a misnomer: the framework calls it on every
   * render and keeps most of what it returns. See {@link IGRPMockDataAsync} for
   * exactly which fields production overrides and which stay live.
   */
  layoutMockData: IGRPMockDataAsync;
  font?: string;
  /**
   * @deprecated Read by nothing in `@igrp/framework-next` or
   * `@igrp/framework-next-ui` — there is no language selector to show. Setting
   * it has never had an effect. Kept for one release, then removed.
   */
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
    appRoutes?: string[];
    paramMapBody?: string;
    /**
     * When `true`, the framework pushes `onCodeMenus` to Access Management at
     * startup via `client.m2m.syncApplicationMenus`. The push is an inner
     * phase of the AM sync pipeline and only runs when the outer gates are
     * also satisfied (`syncAccess === true` and `previewMode === false`).
     *
     * When `false` (the default for templates that omit it), AM remains the
     * source of truth and no menu push occurs.
     *
     * Sourced from `process.env.IGRP_SYNC_ON_CODE_MENUS === "true"` in the
     * template.
     */
    syncOnCodeMenus?: boolean;
    /**
     * The template-defined menu array pushed to Access Management when
     * `syncOnCodeMenus` is true. This is the source of truth at push time —
     * AM is reconciled to match it. Typically points at
     * `src/temp/menus/menus.ts` (`IGRP_DEFAULT_MENU`).
     *
     * Required only when `syncOnCodeMenus` is true. Omitting it is a no-op
     * because the gate short-circuits before reading the array.
     */
    onCodeMenus?: IGRPMenuItemArgs[];
    /**
     * Forwarded as the `syncRoles` argument of
     * `client.m2m.syncApplicationMenus(appCode, menus, syncRoles)` during the
     * on-code menu push. When `true`, Access Management also reconciles the
     * menu↔role assignments; when `false`, only the menu entries are synced
     * and existing role assignments are left untouched.
     *
     * Only consulted when the on-code menu push actually runs (i.e.
     * `syncOnCodeMenus === true` and the outer `syncAccess` / `previewMode`
     * gates are satisfied).
     *
     * Defaults to `true` when omitted — matching the AM client default — so
     * role sync stays on unless a deployment opts out.
     *
     * Sourced from `process.env.IGRP_SYNC_ON_CODE_MENU_ROLES !== "false"` in
     * the template.
     */
    syncOnCodeMenuRoles?: boolean;
    /**
     * When `true`, the framework pushes `onCodePermissions` to the Access
     * Management permission catalog at startup via
     * `client.m2m.syncPermissions`. Like the menu push, it is an inner phase
     * of the AM sync pipeline and only runs when the outer gates are also
     * satisfied (`syncAccess === true` and `previewMode === false`).
     *
     * Default `false`: enabling the capability must never make an existing
     * deployment start writing to the shared central AM without opting in.
     *
     * The sync is an **idempotent upsert keyed on `name`** — entries removed
     * from the catalog are NOT deleted in AM (that would break tokens already
     * granting them); retire them via the AM admin UI.
     *
     * Sourced from `process.env.IGRP_SYNC_PERMISSIONS === "true"` in the
     * template.
     */
    syncPermissions?: boolean;
    /**
     * The permission catalog pushed to Access Management when
     * `syncPermissions` is true. Typically loaded from
     * `.igrpstudio/permissions.json` (maintained by iGRP Studio).
     *
     * Registering an entry does **not** make it checkable — AM must still
     * grant it to a role and the user's token must carry the resulting claim.
     * See `IGRPPermissionCatalogEntry` for the three distinct senses of
     * "permission" in this codebase.
     *
     * Required only when `syncPermissions` is true. Omitting it (or passing an
     * empty array) is a no-op: the push is skipped rather than sending an
     * empty upsert.
     */
    onCodePermissions?: IGRPPermissionCatalogEntry[];
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
  /**
   * @deprecated Read by nothing in `@igrp/framework-next` or
   * `@igrp/framework-next-ui`. Login/logout redirects are driven by NextAuth
   * and the template's `middleware.ts`, not by this field. Kept for one
   * release, then removed.
   */
  loginUrl?: string;
  /**
   * @deprecated Read by nothing — see {@link IGRPConfigArgs.loginUrl}. Kept
   * for one release, then removed.
   */
  logoutUrl?: string;
  /**
   * @deprecated Read by nothing at this level, and easily mistaken for the one
   * that works: the settings link is gated by
   * {@link IGRPHeaderDataArgs.showSettings}, set inside
   * `layoutMockData.getHeaderData()`. Move the flag there. Kept for one
   * release, then removed.
   */
  showSettings?: boolean;
  sessionArgs?: Partial<SessionProviderProps>;
};

/**
 * Shape of a template's config factory — annotate `createConfig` in
 * `src/igrp.template.config.ts` with this to have the whole config object
 * checked at its definition site rather than only where `igrpBuildConfig`
 * consumes it:
 *
 * ```ts
 * export const createConfig: IGRPConfigClient = (config) => igrpBuildConfig({ ... });
 * ```
 *
 * It previously read `() => Promise<IGRPConfigArgs>` and its docs pointed at a
 * *default* export — neither matched any template. The real factory is a named
 * export taking the per-request layout config, which is why nothing could
 * apply this type.
 */
export type IGRPConfigClient = (config: IGRPLayoutConfigArgs) => Promise<IGRPConfigArgs>;

export type IGRPLayoutConfigArgs = {
  session: Session | null;
  activeThemeValue?: string;
  isScaled?: boolean;
};

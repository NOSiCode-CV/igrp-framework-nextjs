import { cookies } from 'next/headers';
import { after } from 'next/server';
import type { AbstractIntlMessages } from 'next-intl';
import { getMessages } from 'next-intl/server';
import {
  IGRPBrandingStyle,
  IGRPChromeI18nProvider,
  IGRPNestedProviders,
  type IGRPNestedProvidersArgs,
} from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPI18nProvider } from '@igrp/igrp-framework-react-design-system';

import { igrpCheckAccessSession } from '../actions/index.js';
import { igrpResolveRequestBranding } from '../branding/request.js';
import { IGRPIntlProvider } from '../i18n/client/provider.js';
import {
  IGRP_DEFAULT_FORMAT_LOCALES,
  IGRP_LOCALE_COOKIE,
  type IGRPI18nConfig,
  igrpNormalizeLocale,
} from '../i18n/config.js';
import { igrpResolveLocale } from '../i18n/server/resolve.js';
import {
  CHROME,
  DS,
  igrpGetChromeStrings,
  igrpGetDesignSystemStrings,
} from '../i18n/server/strings.js';
import { igrpStartupSync, igrpStartupSyncDone } from '../lib/startup-sync.js';
import { planAccessManagementSync } from '../lib/sync-plan.js';

/** `i18n` always stays: `IGRPLocaleSwitcher` reads it on the client. */
function pickNamespaces(
  messages: AbstractIntlMessages,
  namespaces: readonly string[] | undefined,
): AbstractIntlMessages {
  if (!namespaces) return messages;
  const out: AbstractIntlMessages = {};
  for (const ns of [...namespaces, 'i18n']) {
    const value = messages[ns];
    if (value !== undefined) out[ns] = value;
  }
  return out;
}

export type IGRPRootLayoutProvidersArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  /**
   * CSP nonce of this request, for the inline theme boot script. A prop, not a
   * `headers()` read here, so apps without a nonce-based CSP stay as they are.
   */
  readonly nonce?: string;
  /** next-themes props merged over the framework defaults. */
  readonly themeProps?: IGRPNestedProvidersArgs['themeProps'];
};

export type IGRPRootLayoutArgs = IGRPRootLayoutProvidersArgs & {
  /**
   * BCP-47 language of the document (`<html lang>`). Defaults to the i18n
   * format locale when `config.i18n` is set, else `"pt"`.
   */
  readonly lang?: string;
  /** Classes appended to the `<body>` defaults (no Tailwind merge: use `!` to beat one). */
  readonly bodyClassName?: string;
};

/**
 * The root providers plus the document language they resolved. Shared by
 * `IGRPRootLayoutProviders` and `IGRPRootLayout`, so the layout resolves once.
 */
async function buildRootProviders({
  children,
  config,
  nonce,
  themeProps,
}: IGRPRootLayoutProvidersArgs) {
  const {
    layout,
    sessionArgs,
    syncAccess,
    previewMode,
    appInformation,
    apiManagementConfig,
    appCode,
  } = config;

  const { session } = layout;

  // Validate Access Management config synchronously during render. Any
  // misconfiguration throws `IgrpConfigError('IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING')`,
  // which bubbles through React's error boundary to `app/global-error.tsx`.
  //
  // Returns `null` when sync is disabled (`syncAccess === false`) or when
  // preview mode is on. In those cases nothing is scheduled.
  //
  // Doing the validation here — not inside `after()` — is load-bearing:
  // anything thrown inside `after()` is post-stream and only reaches a
  // `console.error`, so developers wouldn't see config bugs until they
  // checked the server logs. See `sync-plan.ts` for the full rationale.
  //
  // Once a sync has succeeded in production the plan is skipped: the config is
  // fixed for the process and that sync proved it valid, so rebuilding it only
  // re-ran O(catalog) validation per request. Dev keeps validating, because an
  // edited config hot-reloads while the completed flag stays set.
  const syncDone = igrpStartupSyncDone();
  const syncPlan =
    syncDone && process.env.NODE_ENV === 'production'
      ? null
      : planAccessManagementSync({
          syncAccess,
          previewMode,
          appCode,
          appInformation,
          menus: apiManagementConfig?.onCodeMenus ?? [],
          permissions: apiManagementConfig?.onCodePermissions ?? [],
          apiManagementConfig,
        });

  if (syncPlan && !syncDone) {
    // Schedule sync post-response — does not block streaming or RSC render.
    after(() => igrpStartupSync(syncPlan));
  }

  // i18n: resolve once, load the merged messages (next-intl request config,
  // registered by the app's createNextIntlPlugin) and the two framework
  // catalogs, then mount the client provider below the session/theme providers.
  const i18n = config.i18n as IGRPI18nConfig | undefined;
  // Organization Brand. Off by default: with `branding.enabled` not true the
  // resolver returns `null` before reading a cookie or making a request, and
  // `IGRPBrandingStyle` renders nothing. Resolved alongside the locale.
  const [intl, branding] = await Promise.all([
    i18n
      ? (async () => {
          const locale = await igrpResolveLocale(i18n);
          return {
            locale,
            formatLocale: i18n.formatLocales[locale],
            locales: i18n.locales,
            timeZone: i18n.timeZone,
            messages: pickNamespaces(await getMessages(), i18n.clientNamespaces),
            designSystemStrings: igrpGetDesignSystemStrings(i18n, locale),
            chromeStrings: igrpGetChromeStrings(i18n, locale),
          };
        })()
      : undefined,
    igrpResolveRequestBranding(config),
  ]);
  // Without config.i18n, follow the locale choice cookie on the server so the
  // design system and chrome agree with each other and never flash pt first.
  const cookieLocale = intl
    ? undefined
    : igrpNormalizeLocale((await cookies()).get(IGRP_LOCALE_COOKIE)?.value);
  const defaultLang =
    intl?.formatLocale ?? (cookieLocale ? IGRP_DEFAULT_FORMAT_LOCALES[cookieLocale] : 'pt');
  const content = intl ? (
    <IGRPIntlProvider {...intl}>{children}</IGRPIntlProvider>
  ) : cookieLocale ? (
    <IGRPI18nProvider strings={DS[cookieLocale]} locale={IGRP_DEFAULT_FORMAT_LOCALES[cookieLocale]}>
      <IGRPChromeI18nProvider strings={CHROME[cookieLocale]}>{children}</IGRPChromeI18nProvider>
    </IGRPI18nProvider>
  ) : (
    children
  );

  return {
    lang: defaultLang,
    node: (
      <>
        <IGRPBrandingStyle branding={branding} />
        <IGRPNestedProviders
          session={session}
          branding={branding}
          sessionArgs={sessionArgs}
          nonce={nonce}
          themeProps={themeProps}
          // No AM to ask in preview mode.
          checkSession={previewMode ? undefined : igrpCheckAccessSession}
        >
          {content}
        </IGRPNestedProviders>
      </>
    ),
  };
}

/**
 * Everything `IGRPRootLayout` mounts inside `<body>`: startup sync
 * scheduling, organization branding, the locale catalogs and the provider
 * stack. For apps that render their own `<html>` and `<body>`.
 */
export async function IGRPRootLayoutProviders(props: IGRPRootLayoutProvidersArgs) {
  return (await buildRootProviders(props)).node;
}

export async function IGRPRootLayout({ lang, bodyClassName, ...props }: IGRPRootLayoutArgs) {
  const { lang: defaultLang, node } = await buildRootProviders(props);

  return (
    <html lang={lang ?? defaultLang} suppressHydrationWarning className={props.config.font}>
      <body
        className={['bg-background overscroll-none h-screen font-sans antialiased', bodyClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {node}
      </body>
    </html>
  );
}

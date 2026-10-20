import { after } from 'next/server';
import { getMessages } from 'next-intl/server';
import { IGRPBrandingStyle, IGRPNestedProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpResolveRequestBranding } from '../branding/request.js';
import { IGRPIntlProvider } from '../i18n/client/index.js';
import type { IGRPI18nConfig } from '../i18n/config.js';
import { igrpResolveLocale } from '../i18n/server/resolve.js';
import { igrpGetChromeStrings, igrpGetDesignSystemStrings } from '../i18n/server/strings.js';
import { igrpStartupSync } from '../lib/startup-sync.js';
import { planAccessManagementSync } from '../lib/sync-plan.js';

export type IGRPRootLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  /**
   * BCP-47 language of the document (`<html lang>`). Defaults to the i18n
   * format locale when `config.i18n` is set, else `"pt"`.
   */
  readonly lang?: string;
};

export async function IGRPRootLayout({ children, config, lang }: IGRPRootLayoutArgs) {
  const {
    font,
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
  const syncPlan = planAccessManagementSync({
    syncAccess,
    previewMode,
    appCode,
    appInformation,
    menus: apiManagementConfig?.onCodeMenus ?? [],
    permissions: apiManagementConfig?.onCodePermissions ?? [],
    apiManagementConfig,
  });

  if (syncPlan) {
    // Schedule sync post-response — does not block streaming or RSC render.
    after(() => igrpStartupSync(syncPlan));
  }

  // i18n: resolve once, load the merged messages (next-intl request config,
  // registered by the app's createNextIntlPlugin) and the two framework
  // catalogs, then mount the client provider below the session/theme providers.
  const i18n = config.i18n as IGRPI18nConfig | undefined;
  const intl = i18n
    ? await (async () => {
        const locale = await igrpResolveLocale(i18n);
        return {
          locale,
          formatLocale: i18n.formatLocales[locale],
          locales: i18n.locales,
          timeZone: i18n.timeZone,
          messages: await getMessages(),
          designSystemStrings: igrpGetDesignSystemStrings(i18n, locale),
          chromeStrings: igrpGetChromeStrings(i18n, locale),
        };
      })()
    : undefined;
  const htmlLang = lang ?? intl?.formatLocale ?? 'pt';

  // Organization Brand. Off by default: with `branding.enabled` not true the
  // resolver returns `null` before reading a cookie or making a request, and
  // `IGRPBrandingStyle` renders nothing.
  const branding = await igrpResolveRequestBranding(config);

  return (
    <html lang={htmlLang} suppressHydrationWarning className={font}>
      <body className="bg-background overscroll-none h-screen font-sans antialiased">
        <IGRPBrandingStyle branding={branding} />
        <IGRPNestedProviders session={session} branding={branding} sessionArgs={sessionArgs}>
          {intl ? <IGRPIntlProvider {...intl}>{children}</IGRPIntlProvider> : children}
        </IGRPNestedProviders>
      </body>
    </html>
  );
}

import { after } from 'next/server';
import { IGRPNestedProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { igrpStartupSync } from '../lib/startup-sync.js';
import { planAccessManagementSync } from '../lib/sync-plan.js';

export type IGRPRootLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  /**
   * `lang` for the `<html>` element. Defaults to `'pt'` — the previous
   * hardcoded value, kept as the default so nothing changes for existing
   * templates — but it is the document's language, which assistive technology
   * and the browser's own translation prompt both read, so an app serving any
   * other locale needs to be able to say so.
   */
  readonly lang?: string;
};

export async function IGRPRootLayout({ children, config, lang = 'pt' }: IGRPRootLayoutArgs) {
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

  const { session, activeThemeValue, isScaled } = layout;

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

  // Built by join rather than a multi-line template literal: the literal
  // embedded its own newlines and indentation into the class attribute.
  const bodyClassName = [
    'bg-background overscroll-none h-screen font-sans antialiased',
    activeThemeValue ? `theme-${activeThemeValue}` : '',
    isScaled ? 'theme-scaled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html lang={lang} suppressHydrationWarning className={font}>
      <body className={bodyClassName}>
        <IGRPNestedProviders
          session={session}
          activeThemeValue={activeThemeValue}
          sessionArgs={sessionArgs}
        >
          {children}
        </IGRPNestedProviders>
      </body>
    </html>
  );
}

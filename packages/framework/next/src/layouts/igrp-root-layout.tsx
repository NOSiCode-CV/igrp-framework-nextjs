import { after } from 'next/server';
import { IGRPNestedProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { igrpStartupSync } from '../lib/startup-sync';
import { planAccessManagementSync } from '../lib/sync-plan';

export type IGRPRootLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPRootLayout({ children, config }: IGRPRootLayoutArgs) {
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
    apiManagementConfig,
  });

  if (syncPlan) {
    // Schedule sync post-response — does not block streaming or RSC render.
    after(() => igrpStartupSync(syncPlan));
  }

  return (
    <html lang="pt" suppressHydrationWarning className={font}>
      <body
        className={`bg-background overscroll-none h-screen font-sans antialiased
          ${activeThemeValue ? ` theme-${activeThemeValue}` : ''}
          ${isScaled ? ' theme-scaled' : ''}`}
      >
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

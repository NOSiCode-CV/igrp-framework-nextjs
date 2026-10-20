import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { fetchAppByCode } from '../hooks/use-applications.js';
import { IGRP_LOCALE_COOKIE, igrpNormalizeLocale } from '../i18n/config.js';
import { IGRP_MESSAGES_EN, IGRP_MESSAGES_FR, IGRP_MESSAGES_PT } from '../i18n/messages/index.js';

/**
 * Placeholder app code used by the framework's own shell, which has no Access
 * Management record to look up.
 */
const FRAMEWORK_APP_CODE = 'IGRP';

const MESSAGES = { pt: IGRP_MESSAGES_PT, en: IGRP_MESSAGES_EN, fr: IGRP_MESSAGES_FR };

/** `common.actions.loading` / `loadingApp`; without next-intl config, the cookie language's built-in copy. */
async function loadingText(name?: string): Promise<string> {
  try {
    const t = await getTranslations('common.actions');
    return name ? t('loadingApp', { name }) : t('loading');
  } catch (error) {
    unstable_rethrow(error);
    // An app without config.i18n has no next-intl request config.
    const locale = igrpNormalizeLocale((await cookies()).get(IGRP_LOCALE_COOKIE)?.value) ?? 'pt';
    const { loading, loadingApp } = MESSAGES[locale].common.actions;
    return name ? loadingApp.replace('{name}', name) : loading;
  }
}

/**
 * Loading placeholder that names the application it is loading.
 *
 * The name lookup is best-effort and deliberately swallowed. This renders as a
 * `loading.tsx` fallback, where throwing replaces the loading state with an
 * error boundary and a `redirect()` (which `fetchAppByCode` performs on a
 * 401/403) navigates the user away mid-suspense — both worse outcomes than
 * showing the raw code while the real page resolves.
 */
export async function IGRPGlobalLoading({ appCode }: { appCode: string }) {
  if (!appCode || appCode === FRAMEWORK_APP_CODE) {
    return <div>{await loadingText()}</div>;
  }

  let name = appCode;
  try {
    const app = await fetchAppByCode(appCode);
    name = app?.name ?? appCode;
  } catch {
    // Keep the code as the label — see above.
  }

  return <div>{await loadingText(name)}</div>;
}

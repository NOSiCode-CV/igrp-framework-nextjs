import type { getRequestConfig } from 'next-intl/server';

import type { IGRPI18nConfig } from '../config.js';
import { igrpGetMessageFallback, igrpOnIntlError } from '../fallback.js';
import { type IGRPAppCatalogs, igrpMergeMessages } from '../messages/index.js';
import { igrpResolveLocale } from './resolve.js';

type RequestConfigFactory = Parameters<typeof getRequestConfig>[0];

/**
 * The function an app passes to next-intl's `getRequestConfig` in its
 * `src/i18n/request.ts`. The locale comes from `igrpResolveLocale`, never from
 * the URL; messages are the layered merge of framework and app catalogs.
 */
export function igrpCreateRequestConfig(
  i18n: IGRPI18nConfig,
  appCatalogs: IGRPAppCatalogs,
): RequestConfigFactory {
  return async () => {
    const locale = await igrpResolveLocale(i18n);
    return {
      locale,
      messages: igrpMergeMessages(i18n, locale, appCatalogs),
      ...(i18n.timeZone ? { timeZone: i18n.timeZone } : {}),
      onError: igrpOnIntlError,
      getMessageFallback: igrpGetMessageFallback,
    };
  };
}

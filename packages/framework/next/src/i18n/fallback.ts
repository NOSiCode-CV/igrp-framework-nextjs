import { type IntlError, IntlErrorCode } from 'next-intl';

/** Missing keys warn in development and stay silent in production; other errors are logged. */
export function igrpOnIntlError(error: IntlError): void {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[igrp-i18n] ${error.message}`);
    return;
  }
  console.error('[igrp-i18n]', error);
}

/** Last step of the fallback chain: the key path itself. */
export function igrpGetMessageFallback({
  namespace,
  key,
}: {
  namespace?: string;
  key: string;
}): string {
  return namespace ? `${namespace}.${key}` : key;
}

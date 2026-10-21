import type { NextRequest, NextResponse } from 'next/server';

import {
  IGRP_LOCALE_COOKIE,
  igrpIsSecureRequest,
  igrpLocaleCookieOptions,
  igrpNormalizeLocale,
  type IGRPI18nConfig,
} from './config.js';

/**
 * Session-first apps call this from middleware with the token they already
 * decoded: when the profile locale differs from the cookie, the cookie is
 * rewritten so pages rendered without a session (login after logout, public
 * flows) follow the last signed-in user. A no-op under cookie-first, where a
 * seeded cookie would be indistinguishable from a choice (ADR 0001).
 */
export function igrpSyncLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  tokenLocale: unknown,
  i18n: Pick<IGRPI18nConfig, 'locales' | 'resolution'>,
): NextResponse {
  if (i18n.resolution !== 'session-first') return response;
  const locale = igrpNormalizeLocale(tokenLocale);
  if (!locale || !i18n.locales.includes(locale)) return response;
  if (request.cookies.get(IGRP_LOCALE_COOKIE)?.value === locale) return response;
  const secure = igrpIsSecureRequest(request.headers, request.nextUrl.protocol);
  response.cookies.set(IGRP_LOCALE_COOKIE, locale, igrpLocaleCookieOptions(secure));
  return response;
}

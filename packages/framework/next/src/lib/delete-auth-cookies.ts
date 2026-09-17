import { cookies } from 'next/headers';

import { SESSION_COOKIE_BASENAME } from '@igrp/framework-next-auth/cookies';

/**
 * Clears every NextAuth session cookie, including chunked (`.0`, `.1`) and
 * basePath-scoped (`.apps-template`) variants.
 *
 * Matching is by the shared basename. The previous two-parameter form
 * (`prodCookieName`, `devCookieName`) only looked like it gave independent
 * control: it tested `name.includes(dev) || name.includes(prod)`, and the prod
 * name CONTAINS the dev name (`__Secure-next-auth.session-token` ⊃
 * `next-auth.session-token`), so the first test already matched both and the
 * second could never change the outcome.
 *
 * @param cookieBasename Override for a deployment that renamed its session
 *   cookie wholesale. Defaults to NextAuth's basename, which also matches the
 *   `__Secure-` prefixed and basePath-suffixed forms.
 */
export async function igrpDeleteAuthCookies(cookieBasename: string = SESSION_COOKIE_BASENAME) {
  const store = await cookies();

  for (const cookie of store.getAll()) {
    if (cookie.name.includes(cookieBasename)) {
      store.delete(cookie.name);
    }
  }
}

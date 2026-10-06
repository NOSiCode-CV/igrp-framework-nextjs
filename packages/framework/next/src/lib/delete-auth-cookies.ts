import 'server-only';

import { cookies } from 'next/headers';

import {
  authCookieSuffix,
  basePathCookiePath,
  SECURE_COOKIE_PREFIX,
  SESSION_COOKIE_BASENAME,
} from '@igrp/framework-next-auth/cookies';

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
 * Each match is expired at the path it was SET at, which the request does not
 * carry, so it is inferred from the name: this app's current, path-scoped
 * cookies (their names end in `authCookieSuffix`, plus NextAuth's `.N` chunk)
 * live at the basePath (`basePathCookiePath`); every older or unscoped name was
 * written at `/`. Only one path per name is possible anyway — Next keeps a
 * single pending `Set-Cookie` per cookie name, so a second `delete()` of the
 * same name would replace the first. `Secure` is set for `__Secure-` names,
 * without which the browser ignores the expiring `Set-Cookie`.
 *
 * @param cookieBasename Override for a deployment that renamed its session
 *   cookie wholesale. Defaults to NextAuth's basename, which also matches the
 *   `__Secure-` prefixed and basePath-suffixed forms.
 */
export async function igrpDeleteAuthCookies(cookieBasename: string = SESSION_COOKIE_BASENAME) {
  const store = await cookies();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  const scopedPath = basePathCookiePath(basePath);
  const scopedSuffix = authCookieSuffix(basePath);

  for (const cookie of store.getAll()) {
    if (cookie.name.includes(cookieBasename)) {
      const isScoped = cookie.name.replace(/\.\d+$/, '').endsWith(scopedSuffix);
      store.delete({
        name: cookie.name,
        path: isScoped ? scopedPath : '/',
        secure: cookie.name.startsWith(SECURE_COOKIE_PREFIX),
      });
    }
  }
}

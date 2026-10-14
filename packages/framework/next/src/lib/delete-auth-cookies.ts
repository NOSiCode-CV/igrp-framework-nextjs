import 'server-only';

import { cookies } from 'next/headers';

import {
  authCookieSuffix,
  basePathCookiePath,
  SECURE_COOKIE_PREFIX,
  SESSION_COOKIE_BASENAME,
  staleAuthCookies,
} from '@igrp/framework-next-auth/cookies';

/**
 * Clears THIS app's NextAuth session cookies: the current name (chunks
 * `.0`, `.1` included, with or without `__Secure-`) and the names this app
 * wrote before its cookies were scoped to its basePath.
 *
 * Only this app's. Several IGRP apps share one domain and one cookie jar, and
 * a logout page sees every cookie whose path covers it — a basePath app's
 * `/apps/demo/logout` also receives the app-center's `Path=/` session cookie.
 * Matching by the shared basename (as this used to) deleted that cookie too:
 * the center looked signed out while its session at the authorization server
 * stayed active and unrevoked, and apps under other paths were not touched at
 * all. Signing out of OTHER apps is the authorization server's job (single
 * logout), not a cookie side effect.
 *
 * Current cookies are expired at the basePath (`basePathCookiePath`), where
 * they are set; previous-generation names come from `staleAuthCookies`, which
 * derives them from this app's basePath only and expires them at `/`. `Secure`
 * is set for `__Secure-` names, without which the browser ignores the
 * expiring `Set-Cookie`.
 *
 * @param cookieBasename Override for a deployment that renamed its session
 *   cookie wholesale. Previous-generation names are only swept for the default
 *   basename.
 * @param options.sweepStockNames Root-path apps only: also expire the stock
 *   `next-auth.session-token` this app wrote before the `~` terminator. Opt in
 *   only when no older stock-named app shares the host (see `staleAuthCookies`).
 */
export async function igrpDeleteAuthCookies(
  cookieBasename: string = SESSION_COOKIE_BASENAME,
  options: { sweepStockNames?: boolean } = {},
) {
  const store = await cookies();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  const scopedPath = basePathCookiePath(basePath);
  const ownName = `${cookieBasename}${authCookieSuffix(basePath)}`;
  const ownNames = new Set([ownName, `${SECURE_COOKIE_PREFIX}${ownName}`]);
  const present = store.getAll().map((cookie) => cookie.name);

  for (const name of present) {
    // Strip NextAuth's chunk index; every own name ends in `~`, so a sibling's
    // name can never reduce to it.
    if (!ownNames.has(name.replace(/\.\d+$/, ''))) continue;
    store.delete({ name, path: scopedPath, secure: name.startsWith(SECURE_COOKIE_PREFIX) });
  }

  if (cookieBasename === SESSION_COOKIE_BASENAME) {
    for (const { name, options: expire } of staleAuthCookies(basePath, present, options)) {
      store.delete({ name, path: expire.path, secure: expire.secure });
    }
  }
}

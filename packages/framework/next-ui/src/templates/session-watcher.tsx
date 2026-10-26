'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, useSession } from '@igrp/framework-next-auth/client';

/**
 * Matches the auth chrome routes that handle the unauthenticated state
 * themselves — `/login` and `/logout` (and any nested children). The session
 * watcher must NOT push to `/login` when the user is already on one of these
 * pages, otherwise it overwrites a legitimate `callbackUrl` from middleware
 * with a self-referential one and creates a sign-in loop.
 */
const AUTH_UI_PATH = /^\/(login|logout)(\/|$)/;

/**
 * How long BEFORE access-token expiry the adaptive refresh fires. Must land
 * INSIDE the server jwt callback's 60s proactive-refresh buffer (so the call
 * actually triggers a refresh) while leaving margin before real expiry and the
 * middleware's 10s post-expiry grace. 45s satisfies both: 60 > 45 > 10.
 */
const ADAPTIVE_REFRESH_LEAD_MS = 45_000;

/**
 * Floor for the scheduled delay. An already-expired or nearly-expired token
 * still gets one prompt refresh attempt instead of a same-tick call storm.
 */
const ADAPTIVE_REFRESH_MIN_DELAY_MS = 5_000;

/** At most one Access Management session check per this window, however often the tab refocuses. */
export const SESSION_CHECK_MIN_INTERVAL_MS = 60_000;

/** Server action that asks Access Management whether this app's session is still alive. */
export type IGRPCheckSession = () => Promise<{ valid: boolean; reason?: string | null }>;

export type IGRPSessionWatcherProps = {
  children: React.ReactNode;
  /**
   * Checked when the tab becomes visible again, so an idle tab notices a
   * session that ended elsewhere (a logout cascade, an admin kill) before the
   * user acts on stale data. Pass `igrpCheckAccessSession` from
   * `@igrp/framework-next/actions`; `IGRPRootLayout` does. Without it the
   * watcher only reacts to the NextAuth session, as before.
   */
  checkSession?: IGRPCheckSession;
};

export function IGRPSessionWatcher({ children, checkSession }: IGRPSessionWatcherProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  // `usePathname()` is already basePath-stripped by Next; it is here as a
  // DEPENDENCY, not just a value. Reading `window.location.pathname` inside the
  // effect while depending only on `[status, session, router]` meant an
  // unauthenticated user who client-navigated from /login into a protected
  // route never re-triggered the redirect — `status` had not changed.
  const pathname = usePathname();

  useEffect(() => {
    // Already on the auth UI — that's the correct destination for an
    // unauthenticated/expired user. Navigating again would loop and stomp the
    // existing `?callbackUrl=…` set by middleware.
    if (AUTH_UI_PATH.test(pathname)) return;

    // Refresh failed: the session cookie still decodes, so `status` stays
    // `authenticated`, but the access token is dead. Route to `/logout` for a
    // clean IdP single-logout instead of leaving the broken session mounted —
    // otherwise the next access-token-bearing request 401s and surfaces in the
    // global error boundary.
    const refreshFailed =
      (session as { error?: string } | null)?.error === 'RefreshAccessTokenError';
    if (refreshFailed) {
      router.replace('/logout');
      return;
    }

    if (status !== 'unauthenticated') return;

    // The query string is not in `usePathname()`, and it is the part that
    // carries the state the user should come back to.
    const currentPath = pathname + window.location.search;
    const target =
      currentPath && currentPath !== '/'
        ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
        : '/login';
    router.push(target);
  }, [status, session, router, pathname]);

  // Adaptive silent-refresh scheduler. The fixed-interval SessionProvider poll
  // (`sessionArgs.refetchInterval`; there is no env var for it) only works when
  // it is tuned below the IdP access-token TTL; this timer derives the moment to refresh
  // from the token itself (`session.expiresAt`, set by the jwt/session
  // callbacks on every rotation), so correctness no longer depends on that
  // tuning. getSession() hits /api/auth/session — a route handler, which CAN
  // persist the rotated cookie — and broadcasts the new session to OTHER tabs
  // (storage events don't fire in the originating tab); this tab picks up the
  // new expiresAt on the next poll or focus refetch, which reschedules this
  // effect. On permanent refresh failure expiresAt is unchanged, so the
  // effect does NOT re-fire (no retry loop); the error-flag effect above
  // routes to /logout instead. The fixed-interval poll stays on as a fallback.
  const expiresAt = (session as { expiresAt?: number } | null)?.expiresAt;
  useEffect(() => {
    if (status !== 'authenticated' || typeof expiresAt !== 'number') return;

    const delay = Math.max(
      expiresAt - ADAPTIVE_REFRESH_LEAD_MS - Date.now(),
      ADAPTIVE_REFRESH_MIN_DELAY_MS,
    );
    const timer = setTimeout(() => {
      // Errors surface through the session error flag, not here.
      getSession().catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [expiresAt, status]);

  // Focus check. AM's session can end while this app's tokens are still valid
  // (a logout in another app cascades, an admin kills it), and nothing here
  // notices until the next AM call. Any `valid: false` goes to the same
  // `/login?reason=session_ended` the server's 401 path uses: it clears the
  // local session and tries a silent sign-in, so a session AM merely evicted
  // (`SESSION_LIMIT_EXCEEDED`, SSO still alive) comes straight back, while a
  // real logout (`USER_LOGOUT`, SSO gone) shows the form.
  const lastCheckRef = useRef(0);
  useEffect(() => {
    if (!checkSession || status !== 'authenticated' || AUTH_UI_PATH.test(pathname)) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastCheckRef.current < SESSION_CHECK_MIN_INTERVAL_MS) return;
      lastCheckRef.current = now;
      checkSession()
        .then(({ valid }) => {
          if (valid) return;
          const currentPath = pathname + window.location.search;
          router.replace(
            currentPath && currentPath !== '/'
              ? `/login?reason=session_ended&callbackUrl=${encodeURIComponent(currentPath)}`
              : '/login?reason=session_ended',
          );
        })
        // The action already answers `valid: true` on failure; a rejected
        // call (network, deploy skew) must not sign the user out either.
        .catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [checkSession, status, pathname, router]);

  // Only hide children during the FIRST session probe (no data yet). NextAuth
  // briefly flips `status` to `'loading'` on every refetch (signOut completion,
  // focus refetch, polling interval); returning `null` there would unmount the
  // whole subtree on every poll, defeating refs/timers in mid-flight client
  // components (notably `/logout`, which double-runs its effect after a remount
  // and races its own navigation). With an SSR-hydrated session, the initial
  // render already has `data`, so this branch only fires when there genuinely
  // is no session yet.
  if (status === 'loading' && !session) return null;
  return children;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

/**
 * Strips the configured `basePath` from a browser pathname so the regex above
 * matches `/apps/template/login` the same as `/login`. `NEXT_PUBLIC_BASE_PATH`
 * is baked into the client bundle by Next.js at build time.
 */
function stripBasePath(pathname: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!basePath) return pathname;
  if (pathname === basePath) return '/';
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length);
  return pathname;
}

export function IGRPSessionWatcher({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Already on the auth UI — that's the correct destination for an
    // unauthenticated/expired user. Navigating again would loop and stomp the
    // existing `?callbackUrl=…` set by middleware.
    const pathname = stripBasePath(window.location.pathname);
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

    const currentPath = pathname + window.location.search;
    const target =
      currentPath && currentPath !== '/'
        ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
        : '/login';
    router.push(target);
  }, [status, session, router]);

  // Adaptive silent-refresh scheduler. The fixed-interval SessionProvider poll
  // (IGRP_SESSION_REFETCH_INTERVAL, default 150s) only works when it is tuned
  // below the IdP access-token TTL; this timer derives the moment to refresh
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

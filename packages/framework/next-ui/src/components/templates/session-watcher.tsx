'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@igrp/framework-next-auth/client';

/**
 * Matches the auth chrome routes that handle the unauthenticated state
 * themselves — `/login` and `/logout` (and any nested children). The session
 * watcher must NOT push to `/login` when the user is already on one of these
 * pages, otherwise it overwrites a legitimate `callbackUrl` from middleware
 * with a self-referential one and creates a sign-in loop.
 */
const AUTH_UI_PATH = /^\/(login|logout)(\/|$)/;

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

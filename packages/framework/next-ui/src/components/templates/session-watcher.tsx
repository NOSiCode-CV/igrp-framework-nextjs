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
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'unauthenticated') return;

    // Already on the auth UI — that's the correct destination for an
    // unauthenticated user. Pushing again would loop and stomp the
    // existing `?callbackUrl=…` set by middleware.
    const pathname = stripBasePath(window.location.pathname);
    if (AUTH_UI_PATH.test(pathname)) return;

    const currentPath = pathname + window.location.search;
    const target =
      currentPath && currentPath !== '/'
        ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
        : '/login';
    router.push(target);
  }, [status, router]);

  if (status === 'loading') return null;
  return children;
}

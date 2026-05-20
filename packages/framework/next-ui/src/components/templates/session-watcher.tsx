'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@igrp/framework-next-auth/client';

export function IGRPSessionWatcher({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const currentPath = window.location.pathname + window.location.search;
      const target =
        currentPath && currentPath !== '/'
          ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
          : '/login';
      router.push(target);
    }
  }, [status, router]);

  if (status === 'loading') return null;
  return children;
}

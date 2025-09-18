'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSession } from '@igrp/framework-next-auth/client';

export function IGRPSessionWatcher() {
  const { session, status } = useSafeSession();
  const router = useRouter();

  console.log('::: SESSION WATCHER :::');
  console.log({ session, status });

  useEffect(() => {
    if ((status === 'authenticated' && session?.forceLogout) || status === 'unauthenticated') {
      router.push('/logout');
    }
  }, [status, session, router]);

  return null;
}

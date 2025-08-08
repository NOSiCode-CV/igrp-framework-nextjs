'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Cookies from 'js-cookie';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function MyAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());
  const [hasMounted, setHasMounted] = useState(false);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    // Optional: logout if session is invalid
    if (!session || session.error === 'RefreshAccessTokenError') {
      // Prevent infinite redirect loop on /login
      if (pathname !== '/login') {
        console.warn('Invalid session or refresh error, signing out...');
        signOut({ callbackUrl: '/login' });
      }
    }
  }, [status, session, pathname]);

  useEffect(() => {
    if (session?.expiresAt) {
      const msUntilExpiry = session.expiresAt * 1000 - Date.now() - 1000;
      if (msUntilExpiry > 0) {
        const timeout = setTimeout(() => {
          console.warn('Access token expired. Signing out automatically.');
          signOut({ callbackUrl: '/login' });
        }, msUntilExpiry);

        return () => clearTimeout(timeout);
      } else {
        console.warn('Access token already expired. Signing out.');
        signOut({ callbackUrl: '/login' });
      }
    }
  }, [session]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

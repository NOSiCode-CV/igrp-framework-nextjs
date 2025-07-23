'use client';

import { SessionProvider, type SessionProviderProps } from 'next-auth/react';

function IGRPSessionProvider(props: SessionProviderProps) {
  return (
    <SessionProvider {...props} refetchInterval={4 * 60}>
      {props.children}
    </SessionProvider>
  );
}

export { IGRPSessionProvider }

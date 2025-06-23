import { SessionProvider, type SessionProviderProps } from 'next-auth/react';

export function IGRPSessionProvider(props: SessionProviderProps) {
  return (
    <SessionProvider {...props} refetchInterval={4 * 60}>
      {props.children}
    </SessionProvider>
  );
}

'use client';

import { SessionProvider, type SessionProviderProps } from '@igrp/framework-next-auth/client';

function IGRPSessionProvider(props: SessionProviderProps) {
  return <SessionProvider {...props}>{props.children}</SessionProvider>;
}

export { IGRPSessionProvider };

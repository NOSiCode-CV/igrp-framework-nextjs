'use client';

import { SessionProvider, type SessionProviderProps } from '@igrp/framework-next-auth/client';

function IGRPSessionProvider(props: SessionProviderProps) {
  console.log(':: Session DEBUG ::');
  console.log({ props });
  return <SessionProvider {...props}>{props.children}</SessionProvider>;
}

export { IGRPSessionProvider };

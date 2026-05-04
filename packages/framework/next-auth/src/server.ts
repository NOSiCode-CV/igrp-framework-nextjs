import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import NextAuthImport from 'next-auth';

import { interopDefault } from './_interop';

// Normalize CJS-default interop — same reason as ./providers.ts and
// ./config.ts (see ./_interop.ts). Consumers of `/server` would otherwise
// receive the module namespace object instead of the factory function under
// webpack's Next.js 15 App Router module graph.
const NextAuth = interopDefault(NextAuthImport);

export async function getServerSessionStrict(opts: NextAuthOptions) {
  const session = await getServerSession(opts);
  if (!session) throw new Error('Unauthorized');
  return session;
}

export { getServerSession } from 'next-auth';
export type { NextAuthOptions, Account, User } from 'next-auth';
export { NextAuth };
